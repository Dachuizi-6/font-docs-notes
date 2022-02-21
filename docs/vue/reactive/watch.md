## 工作流程
```js
const vue = new Vue({
  el: '#app',
  data: {
    message: 'zcl'
  },
  watch: {
    message (newVal, oldVal) {
      console.log(newVal, oldVal)
    }
  }
})
```
入口文件: /src/core/instance/index.js调用了<code>initMixin(Vue)</code>  -> /src/core/instance/init.js 调用了<code>initState(vm)</code>
```js
// 源码位置: /src/core/instance/state.js 
function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  // 初始化 watch
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

initWatch
```js
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher (
    vm,
    expOrFn,
    handler,
    options
  ) {
    // ......
    return vm.$watch(expOrFn, handler, options)
  }
```
调用initWatch, 循环opts.watch, 调用createWatcher创建watch实例

```js
// cb 是watch对应的回调
Vue.prototype.$watch = function (
  expOrFn,
  cb,
  options
) {
  var vm = this;
  if (isPlainObject(cb)) {
    return createWatcher(vm, expOrFn, cb, options)
  }
  options = options || {};
  options.user = true;
  var watcher = new Watcher(vm, expOrFn, cb, options);
  if (options.immediate) {
    try {
      cb.call(vm, watcher.value);
    } catch (error) {
      handleError(error, vm, ("callback for immediate watcher \"" + (watcher.expression) + "\""));
    }
  }
  return function unwatchFn () {
    watcher.teardown();
  }
}
```
1. options中每个handler会创建一个watcher, 创建watcher时, 会进行依赖收集(具体见下面分析)
2. immediate为true时, 立即执行回调
3. 返回的函数(unwatchFn)可以用于取消watch监听. 即停止触发回调
::: tip
var unwatch = vm.$watch('a', cb) // 之后取消观察<br>
unwatch()
:::


## 依赖收集
进入new Watcher的逻辑, 一起看看是如何做依赖收集的吧
```js
// 源码位置：/src/core/observer/watcher.js
export default class Watcher {
  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    // .....
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      // 以文章最开始的例子来讲, key 为 message, expOrFn为'message'
      // cb为回调函数, 即opt.watch中的message方法 
      this.getter = parsePath(expOrFn)
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }
}
```
先不着急看 parsePath 做的是什么，先知道getter是parsePath返回的函数就好了. 由于this.lazy为false, 调用this.get()
```js
get () {
  pushTarget(this)
  let value
  const vm = this.vm
  value = this.getter.call(vm, vm)
  // ......
  popTarget()
  this.cleanupDeps()
  return value
}
```
pushTarget(this) 参数为watcher实例. 它将当前的 watcher实例 挂到 Dep.target 上. 在收集依赖时，将 Dep.target 即watcher实例, 放到属性对应的dep队列中
```js
function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}
```
接下来执行getter函数, 我们来看下 parsePath
```js
const bailRE = new RegExp(`[^${unicodeRegExp.source}.$_\\d]`)
function parsePath (path: string): any {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  // obj为vm实例
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]
    }
    return obj
  }
}
```
segments 是解析后的键值数组，循环去获取每项键值的值，触发它们的“数据劫持get”。接着触发 dep.depend 收集依赖（依赖就是挂在 Dep.target 的 Watcher）.  以文章最开始的例子来讲, 此时依赖收集, 会将watcher放入message属性对应的dep队列中

到这里依赖收集就完成了，从上面我们也得知，每一项键值都会被触发依赖收集，也就是说上面的任何一项键值的值发生改变都会触发 watch 回调。例如：
```js
watch: {
    'obj.a.b.c': function(){}
}
```
不仅修改 c 会触发回调，修改 b、a 以及 obj 同样触发回调。这个设计也是很妙，通过简单的循环去为每一属性项都收集到了依赖

## 更新
以文章最开始的例子来讲, 当message改变时, 触发<code>数据劫持 set</code>, 调用 dep.notify 通知每一个 watcher 的 update 方法.
update会去执行queueWatcher(this), 参数为watcher实例, 带watcher不重复地放入异步更新队列queue中, 利用vue自己实例的nextTick, 在下一个nextTick中, 循环队列执行watcher.run().

watcher.run中调用了<code>this.cb</code>, 将新值和旧值传入. 以文章最开始的例子来讲, 此时的cb就是opt.watch中的message函数


## 卸载监听
官网的例子, 为什么执行unwatch(), 就能卸载监听? 怎么实现的呢? 下面来讲讲
::: tip
var unwatch = vm.$watch('a', cb) // 之后取消观察<br>
unwatch()
:::
Vue.prototype.$watch函数返回的是unwatchFn函数, 执行unwatchFn实际上就是执行了watcher.teardown()
```js
teardown () {
  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove(this.vm._watchers, this)
    }
    let i = this.deps.length
    while (i--) {
      this.deps[i].removeSub(this)
    }
    this.active = false
  }
}
```
teardown 里的操作也很简单，遍历 deps 调用 removeSub 方法，移除当前 watcher 实例。在下一次属性更新时，也不会通知 watcher 更新了。deps 存储的是属性的 dep


## 面试
问: 说说Vue的watch的原理? 为什么监听的数据变化就能触发回调?

答: <p>watch原理:</p>
vm.watch中, 方法名为key, 方法为handler, 在$mount之前初始化watch, 给每个方法实例化一个watcher, 实例化watcher时, 做了两件事:
* 把watcher实例赋值给Dep.target, 方便依赖收集
* 会把key.split()成数组, 遍历获取vm的属性, 触发 <code>数据劫持get</code>,
将watcher实例添加到属性对应的dep队列中. 

当属性变化时, 触发数据劫持 set, 调用 dep.notify 通知每一个 watcher 的 update 方法. update会去执行queueWatcher(this), 参数为watcher实例, 带watcher不重复地放入异步更新队列queue中, 利用vue自己实例的nextTick, 在下一个nextTick中, 循环队列执行watcher.run().

watcher.run中调用了this.cb, 将新值和旧值传入. cb就是监听数据变化的回调


问: computed和watch的异同? 

答: 
1. 从使用上来看, computed需要使用到依赖属性(即vm.data上的属性), 返回一个值; watch则是监数据听变化触发回调
2. computed和watch 依赖收集的发生点不同. computed是初始化后, vm.$mount渲染界面时, 获取computed属性, 执行computed方法时, 触发依赖属性<code>数据劫持get</code>, 此时进行依赖收集; watch是初始化watch将key.split()成数组, 遍历获取vm的属性,  触发依赖属性<code>数据劫持get</code>, 此时进行依赖收集
3. computed 的更新需要“渲染Watcher”的辅助，watch 不需要. 

参考:
[手摸手带你理解Vue的Watch原理](https://www.cnblogs.com/chanwahfung/p/13210167.html)