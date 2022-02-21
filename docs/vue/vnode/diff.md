## patch
虚拟DOM 最核心部分是patch, 它可以将vnode渲染成真实的DOM. patch, 渲染真实DOM时, 并不是暴力覆盖原有DOM, 而是比对新旧两个vnode之间有哪些不同, 根据对比结果找出需要更新的节点进行更新. 故patch实际作用是在现有DOM上进行修改来实现更新视图

```js
return function patch(oldVnode, vnode, hydrating, removeOnly) {
  // 新的不存在，删除
  if (isUndef(vnode)) {
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
    return
  }

  let isInitialPatch = false
  const insertedVnodeQueue = []

  // 老的不存在，新增
  if (isUndef(oldVnode)) {
    // empty mount (likely as component), create new root element
    isInitialPatch = true
    createElm(vnode, insertedVnodeQueue)
  }
  // 两者都存在，更新
  else {
    const isRealElement = isDef(oldVnode.nodeType)
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // 比较两个vnode
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
    } else {
      ...
    }
  }

  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
  return vnode.elm
}
```
分析 <code>patch</code> 方法，两个 <code>vnode</code> 进行对比，结果无非就是三种情况
1. 新的不存在，表示要删除旧节点
2. 老的不存在，表示要新增节点
3. 都存在，进行更新，这里又分成了两种情况
  * 其他情况，比如根组件首次渲染
  * 不是真实节点，且新旧节点的是同一类型的节点（根据 key 和 tag 等来判断）

## 根组件首次渲染
先来分析下3.1的情况. 举例:
:::details
```js
<div id="demo">
  I am {{name}}.
</div>
<script>
  const app = new Vue({
    el: '#demo',
    data: {
      name: 'ayou',
    },
  })
</script>
```
:::
第一次进入到 patch 这个函数的时候是根组件挂载时，此时因为 oldVnode 为 demo 这个<code>真实的DOM元素</code>, 执行emptyNodeAt会通过new Vnode返回一个生成的vnode实例，并vnode.elem = oldVnode， 即把最外层的Dom（#demo）赋给vnode.ele。而createEle中的vnode参数是<code>const vnode = vm._render()</code>模版编译生成的render函数，执行render返回的vnode。我们会走到这里：
```js
if (isRealElement) {
  // either not server-rendered, or hydration failed.
  // create an empty node and replace it
  // 真实节点转为虚拟节点，并把真实节点放到 oldVnode.elm 上
  oldVnode = emptyNodeAt(oldVnode)
}

// replacing existing element
const oldElm = oldVnode.elm
const parentElm = nodeOps.parentNode(oldElm)

// 创建真实的 dom 或者组件并插入到 parentElm
createElm(
  vnode,
  insertedVnodeQueue,
  // extremely rare edge case: do not insert if old element is in a
  // leaving transition. Only happens when combining transition +
  // keep-alive + HOCs. (#4590)
  oldElm._leaveCb ? null : parentElm,
  // 新的 dom 会放到旧的 dom 的后面，所以有一瞬间两者都会存在
  // 这样的好处是第一次渲染可以避免对 children 进行无谓的 diff，当然这种做法仅适用于 hydrating 为 false 的时候. hydrating??
  nodeOps.nextSibling(oldElm)
)
```
做的内容有(createElm下面再分析):
1. 将真实节点转为虚拟节点
2. 得到旧节点的父元素
3. 通过 vnode 创建真实的节点并插入到旧节点的后面，所以有一瞬间会同时存在两个 id 为 demo 的 div

![first-render](@assets/vue/vnode/5.png)

先跳过中间 isDef(vnode.parent) 这一段. 这里会执行 removeVnodes 把旧的元素给删除掉，因此界面才最终显示一个id为 demo的 div

### 接下来简要分析下createElm
首先创建了一个 tag 类型的元素，并赋值给 vnode.elm。因为传进来的 vnode 是原生标签，所以最后会走到
```js
function createElm (
  vnode,
  insertedVnodeQueue,
  parentElm,
  ...
)
  const data = vnode.data
  const children = vnode.children
  const tag = vnode.tag
  // .....
  vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode)
  // .....
  createChildren(vnode, children, insertedVnodeQueue)
  if (isDef(data)) {
    // 事件、属性等等初始化
    invokeCreateHooks(vnode, insertedVnodeQueue)
  }
  // 插入节点
  insert(parentElm, vnode.elm, refElm)
}
```
其中 createChildren 中又调用了 createElm：
```js
function createChildren(vnode, children, insertedVnodeQueue) {
  if (Array.isArray(children)) {
    if (process.env.NODE_ENV !== 'production') {
      checkDuplicateKeys(children)
    }
    for (let i = 0; i < children.length; ++i) {
      createElm(
        children[i],
        insertedVnodeQueue,
        vnode.elm,
        null,
        true,
        children,
        i
      )
    }
  } else if (isPrimitive(vnode.text)) {
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
  }
}
```
不停递归地调用 createElm, 最后执行 insert(parentElm, vnode.elm, refElm) 的时候，vnode.elm 就是一颗完整的 dom 树了，执行完 insert 以后，这颗树就插入到了 body 之中

## 新旧节点的是同一类型的节点
:::details
```js
<div id="demo">
  <p>I am {{name}}</p>
</div>
<script>
  const app = new Vue({
    el: "#demo",
    data: {
      name: "ayou",
    },
    mounted() {
      setTimeout(() => {
        this.name = "you";
      }, 2000);
    },
  });
</script>
```
:::
我们在定时器中对 name 进行了重新赋值，此时会触发组件的更新，最终走到 patch 函数:
```js
// ...
if (!isRealElement && sameVnode(oldVnode, vnode)) {
  // patch existing root node
  // 比较两个vnode
  patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
}
// ...
```
我们去掉一些我们暂时不关心的代码，看看 patchVnode
```js
function patchVnode(
  oldVnode,
  vnode,
  insertedVnodeQueue,
  ownerArray,
  index,
  removeOnly
) {
  if (oldVnode === vnode) {
    return
  }
  ...
  // 获取两个节点孩子节点数组
  const oldCh = oldVnode.children
  const ch = vnode.children
  // 属性更新
  if (isDef(data) && isPatchable(vnode)) {
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
    if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode)
  }
  // 内部比较
  // 新节点不是文本节点
  if (isUndef(vnode.text)) {
    // 都有孩子，进行孩子的更新
    if (isDef(oldCh) && isDef(ch)) {
      if (oldCh !== ch)
        updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
    } else if (isDef(ch)) {
      // 新的有孩子，老的没孩子
      if (process.env.NODE_ENV !== 'production') {
        checkDuplicateKeys(ch)
      }
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
      // 批量新增
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    } else if (isDef(oldCh)) {
      // 老的有孩子，新的没孩子，批量删除
      removeVnodes(oldCh, 0, oldCh.length - 1)
    } else if (isDef(oldVnode.text)) {
      nodeOps.setTextContent(elm, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    // 文本节点更新
    nodeOps.setTextContent(elm, vnode.text)
  }
}
```
patchVnode做了两件事：
1. 更新属性. 略？？
2. 更新 children 或者更新文本<code>setTextContent</code>

更新 <code>chidren</code> 有几种情况:
1. 新旧节点都有孩子，进行孩子的更新
2. 新的有孩子，旧的没有孩子，进行批量添加
3. 新的没有孩子，旧的有孩子，进行批量删除

新增和删除都比较简单，这里就暂时先不讨论。下面着重分析的是 updateChildren, 也是diff算法的核心.
使用<code>双指针算法</code>来对比新旧两个vnode的children, 找出最小操作补丁. 

![patch](@assets/vue/vnode/4.png)

在新⽼两组 vnode 节点的左右头尾两侧都有⼀个变量标记，在遍历过程中这⼏个变量都会向中间靠拢。当 oldStartIdx > oldEndIdx 或者 newStartIdx > newEndIdx 时结束循环。以下是遍历规则：
⾸先，oldStartIdx、oldEndIdx 与 newStartIdx、newEndIdx 两两<code>交叉⽐较</code>，共有 4 种情况:
1. oldStartIdx 与 newStartIdx 所对应的 node 是 sameVnode, patchVnode这两个结点。两个头指针各向后移一步

![updateChildren](@assets/vue/vnode/6.png)

2. oldEndIdx 与 newEndIdx 所对应的 node 是 sameVnode，patchVnode这两个结点。两个尾指针各向后前一步

![updateChildren](@assets/vue/vnode/7.png)

3. oldStartIdx 与 newEndIdx 所对应的 node 是 sameVnode

![updateChildren](@assets/vue/vnode/8.png)

这种情况不仅要进行两者的 patchVNode，还需要将旧的节点移到 oldEndIdx 后面. 

4. oldEndIdx 与 newStartIdx 所对应的 node 是 sameVnode

![updateChildren](@assets/vue/vnode/9.png)

同样，这种情况不光要进行两者的 patchVNode，还需要将旧的节点移到 oldStartIdx 前面

如果四种情况都不匹配，就尝试从旧的 children 中找到一个 sameVnode)(个人理解: 此时循环以新vnode为主体)，这里又分成两种情况:
1. 找到了

![updateChildren](@assets/vue/vnode/10.png)

这种情况首先进行两者的 patchVNode，然后将旧的节点移到 oldStartIdx 前面

2. 没找到

![updateChildren](@assets/vue/vnode/11.png)

这种情况首先会通过 newStartIdx 指向的 vnode 创建一个新的元素，然后插入到 oldStartIdx 前面。然后newStartIdx向后移一步

### 哈希表优化查找
当新旧两组vnode节点，的头叉指针4种情况都匹配不上时。如果新vnode数组中，头指针指向的结点有key。此时会在旧vnode数组中找和头指针指向结点key相同的结点。为了提高速度，用map优化查找。key为 结点key, value为vnode的下标
```js
function createKeyToOldIdx (children, beginIdx, endIdx) {
  var i, key;
  var map = {};
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) { map[key] = i; }
  }
  return map
}

// oldKeyToIdx是一个对象, 保存了oldVond的key和index下标
if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
idxInOld = isDef(newStartVnode.key)
  ? oldKeyToIdx[newStartVnode.key]
  : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
// ......

```
如果 newStartVnode 有标记key, 那么 直接 去 <code>oldKeyToIdx</code>查找, 看看 旧结点 中是否有和newStartVnode一样的结点. 

最后，如果新旧子节点中有任何一方遍历完了，还需要做一个收尾工作，这里又分为两种情况:
```js
// 旧的vnode数组先遍历完
if (oldStartIdx > oldEndIdx) {
  refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
  addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
} else if (newStartIdx > newEndIdx) {
  // 新的vnode数组先遍历完
  removeVnodes(oldCh, oldStartIdx, oldEndIdx);
}
```
1. 旧的先遍历完

![updateChildren](@assets/vue/vnode/12.png)

这种情况需要将新的 children 中未遍历的节点进行插入.

2. 新的先遍历完

![updateChildren](@assets/vue/vnode/13.png)

这种情况需要将旧的 children 中未遍历的节点进行删除

到此，整个 patch 的过程就大致分析完了

## diff原理总结
diff是比较新旧两个vnode，来达到更新UI一系列操作。diff大方向上分为两种情况：
1. 初次渲染：总的来说，是通过vnode创建真实的Dom树，并插入到旧节点后面，最后删除旧节点。所以实际上初次渲染时页面会有一瞬间会同时存在两个 id (通常为app)相同 的 div
*  先说下vnode分别是什么。初次渲染时，oldVnode是$el元素，即实例化vue传el参数，此时的oldVnode是真实的Dom元素；新的vnode是render函数生成的vnode结点。
* 把oldVnode变成vnode的JS数据结构。实例化一个vnode结点，把oldVnode赋给vnode.elem属性，再把生成的vnode结点赋给oldVnode。就达到了oldVnode从真实Dom转成虚拟Dom的结构的目的。
* 生成真实的Dom，并插入页面旧结点后面。vnode是虚拟dom树，实际上是通过不断的，深度优先的，递归遍历vnode虚拟dom树，就可以生成真实dom树。生成的真实dom结点放在哪里？不断生成的dom元素是放在vnode.elem。所以vnode是一棵虚拟dom树，vnode.elem是一棵真实的dom树


2. 非初次渲染。通常是由于响应式数据发生改变，触发渲染watcher的回调，回调又执行patch更新
* 先说下对相同结点的定义。如果新旧两个vnode的key， tag标签等相同，那么就称它们是相同结点(isSameVnode)
* 接下讲讲更新谁。非初渲染是怎么做到更新的？实际上这个更新是真实dom树的更新，vnode.elem才是维护真实dom树，所以可以说非初次渲染的目的是更新vnode.elem
* 接下来讲讲diff核心内容。对比更新vnode(patchVnode)主要做3个操作：
  1. 更新文本内容
  2. 如果新的vnode没有子节点，旧的vnode有子节点，则dom树中相应去掉子节应
  3. 如果新的vnode有子节点，旧的vnode没有子节点，则dom树中相应添加子节应
  4. 如果两者都有子节点，则比较更新(updateChildren)子节点
* 比较更新子节点，分别给新旧子节点数组，添加头尾指针。通过比较是否相同结点(定义上面说过了)，移动头尾指针来实现更新子结点。具体会做6+1步
  1. 头头比较。相同结点，则头指针分别后移
  2. 尾尾比较。相同，则前移
  3. 头尾。相同，移动旧vnode结点。为什么移动旧的vnode而不是新的vnode，是因为旧的vnode.elem才真正是维护着真实dom
  4. 尾头。相同，称动旧vnode结点。
  5. 以上头尾4种交叉都不满足。通过map优化查找（key为vnode的key，value为数组下标），看是否能在旧vnode的头尾指针之间 找到 和新vnode头指针指向结点 相同的结点。若找到，移动旧的vnode结点
  6. 若找不到，则需要创建 一个vnode结点，插入到旧的vnode数组中（头指针的前一个）
  7. 最后一步。看看新旧结点数组谁先遍历完。如果新的先遍历完，则需删除旧结点数组多余的结点；如果旧的先遍历完，则需新增对应结点

问：diff算法时间复杂度

答：新旧虚拟DOM对比的时候，Diff算法比较只会在同层级进行, 不会跨层级比较。 所以Diff算法是:深度优先算法。 时间复杂度:O(n)

加深理解：

实际上是oldVnode.elem维护着真实Dom结构，初次渲染时，oldVnode.elem会插入到页面上，一般是body标签中；
改变数据，渲染更新，一系列操作都是为了更新oldVnode.elem这个真实的dom树，你可能会问，为啥更新oldVnode.elem，就能更新到页面？

实际上oldVnode.elem是一个引用。所以更新每次更新oldVnode.elem会更新页面真实Dom


参考:
[Vue 源码之 patch 详解](https://juejin.cn/post/6850418110911119374#heading-0)
[面试官：你了解vue的diff算法吗？说说看](https://vue3js.cn/interview/vue/diff.html#%E4%B8%89%E3%80%81%E5%8E%9F%E7%90%86%E5%88%86%E6%9E%90)