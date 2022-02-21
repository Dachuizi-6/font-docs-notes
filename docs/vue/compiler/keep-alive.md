## 基本使用
keep-alive 是 Vue 内置的一个组件，可以使被包含的组件保留状态，或避免重新渲染。

keep-alive 新加入了两个属性: include(包含的组件缓存生效) 与 exclude(排除的组件不缓存) 

include 和 exclude 属性允许组件有条件地缓存。二者都可以用逗号分隔字符串、正则表达式或一个数组来表示
```html
<!-- 逗号分隔字符串，只有组件a与b被缓存 -->
<keep-alive include="a,b">
  <component :is="view"></component>
</keep-alive>
<!-- 正则表达式 -->
<keep-alive :include="/a|b/">
  <component :is="view"></component>
</keep-alive>
<!-- Array -->
<keep-alive :include="['a', 'b']">
  <component :is="view"></component>
</keep-alive>
```

### 生命周期钩子
被包含在 <code>\<keep-alive\></code> 中创建的组件，会多出两个生命周期的钩子: activated 与 deactivated
* activated: 在组件被激活时调用，在组件第一次渲染时也会被调用，之后每次keep-alive激活时被调用。
* deactivated: 在组件被停用时调用。
* 首次进入组件时：beforeRouteEnter > beforeCreate > created> mounted > activated > ... ... > beforeRouteLeave > deactivated
* 再次进入组件时：beforeRouteEnter >activated > ... ... > beforeRouteLeave > deactivated

注意：
::: tip
当组件在 <code>\<keep-alive\></code> 内被切换，<code>activated</code> 和 <code>deactivated</code> 这两个生命周期才会被调用

在服务端渲染时此钩子也不会被调用的
:::

## 结合vue-router
router-view 也是一个组件，如果直接被包在 keep-alive 里面，所有路径匹配到的视图组件都会被缓存。
```html
<keep-alive>
  <router-view>
    <!-- 所有路径匹配到的视图组件都会被缓存！ -->
  </router-view>
</keep-alive>
```

## LRU策略
在使用 keep-alive 时，可以添加 prop 属性 include、exclude、max 允许组件有条件的缓存。既然有限制条件，旧的组件需要删除缓存，新的组件就需要加入到最新缓存，那么要如何制定对应的策略？

LRU（Least recently used，最近最少使用）策略根据数据的历史访问记录来进行淘汰数据。LRU 策略的设计原则是，如果一个数据在最近一段时间没有被访问到，那么在将来它被访问的可能性也很小。也就是说，<code>当限定的空间已存满数据时，应当把最久没有被访问到的数据淘汰</code>

![LRU](@assets/vue/compiler/5.png)

<code>keep-alive</code> 缓存机制便是根据LRU策略来设置缓存组件新鲜度，将很久未访问的组件从缓存中删除

## 源码解析
```js
export default {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created () {
    this.cache = Object.create(null)
    this.keys = []
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  render () {
    const slot = this.$slots.default
    // 找到第一个子组件对象
    const vnode: VNode = getFirstComponentChild(slot)
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // 组件名
      const name: ?string = getComponentName(componentOptions)
      const { include, exclude } = this
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }
      const { cache, keys } = this
      // 定义组件的缓存key. 如果vnode没有key，则根据组件ID和tag生成缓存Key
      const key: ?string = vnode.key == null
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
      // 已经缓存过该组件
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest
        remove(keys, key)
        keys.push(key)
      } else {
        cache[key] = vnode // 缓存组件对象
        keys.push(key)
        // 超过缓存数限制，将第一个删除
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }
      // 将该组件实例的keepAlive属性值设置为true
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
```
* 组件缓存key放入<code>this.keys</code>数组中。根据LRU策略，如果组件未缓存过，则直接push；若已缓存过，则先把keys数据中缓存的组件key删除，再push组件缓存key
* <code>this.cache</code>对象中存储该组件实例并保存key值
* 检查缓存的实例数量是否超过max的设置值，超过则根据LRU策略删除最近最久未使用的实例（即是下标为0的那个key）
* 将该组件实例的<code>keepAlive</code>属性值设置为true

以上，是keep-alive的源码。简洁明了。

## keep-alive组件渲染
<strong>keep-alive 它不会生成真正的DOM节点，这是怎么做到的？</strong>

kepp-alive 实际是一个<code>抽象组件</code>，只对包裹的子组件做处理，并不会和子组件建立父子关系，也不会作为节点渲染到页面上。在组件开头就设置 <code>abstract</code> 为 true，代表该组件是一个抽象组件。
```js
// 源码位置： src/core/instance/lifecycle.js
export function initLifecycle (vm: Component) {
  const options = vm.$options
  // 找到第一个非abstract的父组件实例
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }
  vm.$parent = parent
  // ...
}
```
在初始化阶段会调用 initLifecycle，里面判断父级是否为抽象组件，如果是抽象组件，就选取抽象组件的上一级作为父级，忽略与抽象组件和子组件之间的层级关系。

最后构建的组件树中就不会包含keep-alive组件，那么由组件树渲染成的DOM树自然也不会有keep-alive相关的节点了。

回到keep-alive组件，看看渲染keep-alive组件做了啥。
keep-alive组件由 <code>render 函数</code>决定渲染结果
```js
const slot = this.$slots.default
const vnode: VNode = getFirstComponentChild(slot)
```
如果 keep-alive 存在多个子元素，keep-alive 要求同时只有一个子元素被渲染。所以在开头会获取插槽内的子元素，调用 getFirstComponentChild 获取到第一个子元素的 VNode.
```js
if (
  // not included
  (include && (!name || !matches(include, name))) ||
  // excluded
  (exclude && name && matches(exclude, name))
) {
  return vnode
}
```
判断当前组件【keep-alive组件内的第一个子组件】是否符合缓存条件，组件名与include不匹配或与exclude匹配都会直接退出并返回 VNode【组件实例】，不走缓存机制。
```js
vnode.data.keepAlive = true
```
如果走缓存机制的话，最后会给keep-alive组件内的第一个子组件实例的keepAlive属性值设置为true

::: tip
keep-alive 它不会生成真正的DOM节点，但keep-alive 并非真的不会渲染，而是渲染的对象是包裹的子组件
:::

## keep-alive组件渲染过程
渲染过程最主要的两个过程就是 render 和 patch，在 render 之前还会有模板编译，render 函数就是模板编译后的产物，它负责构建 VNode 树，构建好的 VNode 会传递给 patch，patch 根据 VNode 的关系生成真实dom节点树。

这张图描述了 Vue 视图渲染的流程：

![render](@assets/vue/compiler/6.png)

### keep-alive组件初始化渲染
组件在 patch 过程是会执行 createComponent 来挂载组件的，A组件【缓存组件】也不例外。
```js
// 源码位置：src/core/vdom/patch.js
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data
  if (isDef(i)) {
    const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode, false /* hydrating */)
    }

    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue)
      insert(parentElm, vnode.elm, refElm)
      if (isTrue(isReactivated)) {
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
      }
      return true
    }
  }
}
```
isReactivated 标识组件是否重新激活。在A组件初始化渲染时，A组件还没有初始化构造完成，componentInstance 还是 undefined。而A组件的 keepAlive 是 true，因为 keep-alive 作为父级包裹组件，会先于A组件挂载，也就是 kepp-alive 会先执行 render 的过程，A组件被缓存起来，之后对插槽内第一个组件（A组件）的 keepAlive 赋值为 true。

<strong>在初始化渲染中，keep-alive 将A组件缓存起来，然后正常的渲染A组件</strong>

### 缓存渲染
当切换到B组件，再切换回A组件时，A组件命中缓存被重新激活
非初始化渲染时，patch 会调用 patchVnode 对比新旧节点。patchVnode 内会调用 prepatch更新节属性。 prepatch内调用 updateChildComponent来更新vnode属性。
```js
// 源码位置：src/core/instance/lifecycle.js
export function updateChildComponent (
  vm: Component,
  propsData: ?Object,
  listeners: ?Object,
  parentVnode: MountedComponentVNode,
  renderChildren: ?Array<VNode>
) {
  // ...
  const needsForceUpdate = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    hasDynamicScopedSlot
  )
  // ...
  // resolve slots + force update if has children
  if (needsForceUpdate) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }
}
Vue.prototype.$forceUpdate = function () {
  const vm: Component = this
  if (vm._watcher) {
    // 这里最终会执行 vm._update(vm._render)
    vm._watcher.update()
  }
}
```
从注释中可以看到 needsForceUpdate 是有插槽才会为 true，keep-alive 符合条件。首先调用 resolveSlots 更新 keep-alive 的插槽，然后调用 $forceUpdate 让 keep-alive 重新渲染，再走一遍 render。因为A组件在初始化已经缓存了，keep-alive 直接返回缓存好的A组件 VNode。VNode 准备好后，又来到了 patch 阶段中的createComponent

A组件再次经历 createComponent 的过程，调用 init
```js
const componentVNodeHooks = {
  init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },
}
```
这时将不再走 $mount 的逻辑，只调用 prepatch 更新实例属性。所以在缓存组件被激活时，不会执行 created 和 mounted 的生命周期函数。

最后调用 insert 插入组件的dom节点，至此缓存渲染流程完成

<strong>缓存渲染时，keep-alive 会更新插槽内容，之后 $forceUpdate 重新渲染</strong>

## 面试
问：如何实现？
假设这里有 3 个路由： A、B、C。需求：
* 默认显示 A
* B 跳到 A，A 不刷新
* C 跳到 A，A 刷新

答：
使用keep-alive + router-view结合
```html
<keep-alive v-if="$route.meta.keepAlive">
  <router-view></router-view>
</keep-alive>
<router-view v-else></router-view>
```
1. A路由，设置meta.keepAlive属性
```js
{
  path: '/',
  name: 'A',
  component: A,
  meta: {
    keepAlive: true // 默认会缓存
  }
}
```
2. 在 B 组件里面设置 beforeRouteLeave
```js
export default {
  data() {
    return {};
  },
  methods: {},
  beforeRouteLeave(to, from, next) {
    // 设置下一个路由的 meta
    to.meta.keepAlive = true;  // 让 A 缓存，即不刷新
    next();
  }
}
```
3. 在 C 组件里面设置 beforeRouteLeave
```js
export default {
  data() {
    return {};
  },
  methods: {},
  beforeRouteLeave(to, from, next) {
    // 设置下一个路由的 meta
    to.meta.keepAlive = false; // 让 A 不缓存，即刷新
    next();
  }
}
```
这样便能实现 B 回到 A，A 不刷新；而 C 回到 A 则刷新


问：keep-alive原理，说说你的理解

答：
1. 抽象组件：keep-alive 组件通过abstract 来声明成抽象组件, 在生成组件对应父子关系时会跳过抽象组件，所以keep-alive不会生成真正的DOM节点
2. 渲染keep-alive: keep-alive组件定义了render函数。虽然keep-alive不会生成真正的DOM节点，但keep-alive 并非真的不会渲染，而是对keep-alive包裹的第一个子组件做处理(用到插槽this.$slots.default)；根据LRU策略缓存组件 VNode；render 函数返回第一个子组件的 VNode
3. 缓存渲染过程：
* 初始化渲染：，keep-alive 将缓存组件缓存起来，然后正常的渲染组件
* 缓存渲染时，keep-alive 会更新插槽内容，之后 $forceUpdate 重新渲染，从缓存中读取之前的组件 VNode 实现状态缓存

<strong>第三步加点额外理解</strong>：$forceUpdate重新渲染，先渲染keep-alive，从this.cache缓存命中缓存组件，返回缓存组件的vnode。接着渲染缓存组件，由于vnode.componentInstance && vnode.data.keepAlive为true，所以不走$mount，也就没有beforeCreate、created、mounted 钩子


参考：
[vue-router 之 keep-alive](https://www.jianshu.com/p/0b0222954483)
[Vue源码解析，keep-alive是如何实现缓存的？](https://www.cnblogs.com/chanwahfung/p/13523396.html)
[彻底揭秘keep-alive原理](https://juejin.cn/post/6844903837770203144)


<style scoped>
img {
    max-width: 100% !important;
}
</style>