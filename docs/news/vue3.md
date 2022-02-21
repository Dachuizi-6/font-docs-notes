## vue3做了哪些优化
* 源码
  1. 代码管理：monorepo。vue2托管在src，依据功能拆分出compiler、core目录等；vue3使用monorepo，根据功能将不同的模块拆分到packages目录下面不同的子目录中，模块拆分更细化
  2. Vue3是基于typeScript编写的；vue2是用js的（Flow）
* 性能
  1. 体积优化：
    * 移除一些API（eg：filter)；
    * Tree shaking 没用到的模块都被摇掉，打包休积更小
```js
// vue2
import Vue from 'vue'
Vue.nextTick(() => {})
// vue3
import { nextTick, observable } from 'vue'
nextTick(() => {})
```
  2. 编译优化：
  vue3编译过程和vue2基本一致。解析 --> 优化AST --> 生成代码。在创建VNode的时候就确定结点的<code>位运算标志：patchFlag</code>，在Diff更新的过程中，通过<code>patchFlag</code>来做相应的更新。性能上较Vue2.x有了提升。
  3. 数据劫持优化：
  vue2使用defineProperty，有两个缺点：
    * 不能检测对象属性的添加和删除。是通过<code>$set</code>和<code>$delete</code>
    * 当对象嵌套层级较深时，使用递归遍历把每一层数据变成响应式的。

  vue3使用Proxy做劫持对象。实际上Proxy API 并不能监听到内部深层次的对象变化。使用对象的深层属性时，在getter中去递归响应式。访问对象深层属性时，对象深层属性才会变成响应式。
* Composition API
  1. 优化代码的组织：一个功能的相关逻辑代码放在一个函数里
  2. 优化代码的复用：vue2使用mixins会有两个问题
  * 命名冲突
  * 数据来源不清晰

  vue3 可以编写可复用的hook函数(useXXX)，实现代码复用

## 编译优化
```js
<p :style="{ color: color }">name: {{name}}</p>

// packages/runtime-core/src/renderer.ts
// text
// This flag is matched when the element has only dynamic text children.
if (patchFlag & PatchFlags.TEXT) {
  if (n1.children !== n2.children) {
    hostSetElementText(el, n2.children as string)
  }
}
```
如果此时的 name 发生了修改，p 节点进入了 diff 阶段，此时会将判断结点的 <code>patchFlag & PatchFlags.TEXT</code> ，当元素只有动态文本子元素时，将匹配此标志。然后才做TEXT的更新



参考：
[v3官网](https://v3.cn.vuejs.org/guide/migration/v-model.html#%E8%BF%81%E7%A7%BB%E7%AD%96%E7%95%A5)

[【初学笔记】整理的一些Vue3知识点](https://juejin.cn/post/6977004323742220319#heading-42)

[vue3数据绑定源码简析](https://github.com/cangshudada/vue3.0-reactivity-analyze)

[Vue3源码分析——数据侦测](https://juejin.cn/post/6844904165324357646#heading-1)

[Vue3模板编译优化](https://juejin.cn/post/6893839274304700429#heading-0)

[Vue3.0 新特性以及使用经验总结](https://juejin.cn/post/6940454764421316644)

[化身面试官出30+Vue面试题，超级干货（附答案）｜牛气冲天新年征文](https://juejin.cn/post/6930897845369356295#heading-30)