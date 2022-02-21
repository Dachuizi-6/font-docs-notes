## MutationObserver
简单介绍下MutationObserver：MO是HTML5中的API，是一个用于监视DOM变动的接口，它可以监听一个DOM对象上发生的子节点删除、属性修改、文本内容修改等。

调用过程是要先给它绑定回调，得到MO实例，这个回调会在MO实例监听到变动时触发。这里MO的回调是放在<code>microtask</code>中执行的。
```js
// 创建MO实例
const observer = new MutationObserver(callback)

const textNode = '想要监听的Don节点'

observer.observe(textNode, {
    characterData: true // 说明监听文本内容的修改
})
```


## nextTick码源解读
nextTick接收一个回调函数作为参数。它的作用是将回调延迟到下次DOM更新周期之后执行。
```js
function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  // 将回调函数存入callbacks数组
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // 不提供回调且支持Promise，则返回一个Promise
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
```
执行timerFunc。
```js
let timerFunc
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
} 
```
Vue2.6源码中，内部对异步队列尝试使用原生的 Promise.then、MutationObserver 和 setImmediate，如果执行环境不支持，则会采用 setTimeout(flushCallbacks, 0) 代替

## Vue异步更新队列
```js
<template>
  <div>
    <div>{{test}}</div>
  </div>
</template>
export default {
  data () {
    return {
      test: 0
    };
  },
  mounted () {
    for(let i = 0; i < 1000; i++) {
      this.test++;
    }
  }
}
```
现在有这样的一种情况，mounted的时候test的值会被++循环执行1000次。

每次++时，都会根据响应式触发 <code>setter -> Dep -> Watcher -> update -> patch</code>
如果这时候没有异步更新视图，那么每次++都会直接操作DOM更新视图(即渲染)，这是非常消耗性能的。
所以Vue.js实现了一个<code>queue队列</code>，在下一个tick (vue使用nextTick) 的时候会统一执行queue中Watcher的run()。同时，拥有相同id的Watcher不会被重复加入到该queue中去，所以不会执行1000次Watcher的run。最终更新视图只会直接将test对应的DOM的0变成1000。

## 异步更新源码解读
响应式 派发更新，会执行wacher实例update。update主要执行了一个queueWatcher函数，将watcher对象作为this进行传递
```js
// wacher.js
  update () {
    // .....
    queueWatcher(this)
  }
```
queue队列通过id对Watcher实例进行了去重
```js
// scheduler.js
let has = {};
let queue = [];
let waiting = false;

queueWatcher (watcher: Watcher) {
  const id = watcher.id
  // 防止queue队列wachter对象重复
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      // 添加watcher到队列
      queue.push(watcher)
    } else {
      // let i = queue.length - 1
      // while (i > index && queue[i].id > watcher.id) {
      //   i--
      // }
      // queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true
      // .....
      nextTick(flushSchedulerQueue)
    }
  }
}
```
flushSchedulerQueue函数依次调用了wacther对象的run方法执行更新
```js
// scheduler.js
function flushSchedulerQueue () {
  flushing = true
  let watcher, id

  queue.sort((a, b) => a.id - b.id)

  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    id = watcher.id
    has[id] = null
    watcher.run()
  }
  ```


## 面试
问：for 100次循环更新vm.$data.count数值，dom会被更新100次吗？为什么不会？

答：不会。只会更新一次。
<code>count</code> 循环进行++操作，不断地触发count属性对应的Dep中的Watcher实例的update方法。但是queue队列通过id对Watcher实例进行了去重，所以queue队列中只会存在一个count对应的Watcher对象。在下一个 tick 的时候（此时count已经变成了 100），触发Watcher对象的run方法来更新视图，将视图上的number` 从 0 直接变成 1000。


问：说说nextTick的原理？

答：
调用Vue.nextTick时会执行：
* 把传入的回调函数cb压入callbacks数组
* 执行timerFunc函数，<code>异步调用</code> flushCallbacks 函数
* 遍历执行 callbacks 数组中的所有函数


在同一个 [事件循环](../../basic/evenLoop.md) 内多次执行nextTick，不会开启多个异步任务，而是把这些异步任务都压成一个同步任务，在下一个 tick 执行完成