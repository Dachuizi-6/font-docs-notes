## setTimout、setInterval
* setTimeout()
1. 返回值timeoutID是一个正整数，表示定时器的编号
2. 如果 setTimeout 存在嵌套调用，那么系统会设置最短时间间隔为 4 毫秒
```js
console.log('begin', new Date().getTime())
setTimeout(()=> {
  setTimeout(()=> {
    console.log('end', new Date().getTime())
  }, 0)
}, 0)
// begin: 1625994293493
// end: 1625994293497
```

## 为什么setTimeout不准确
setTimeout设置了一个定时器，表示在指定时间之后才放入事件循环队队(宏任务队列)，如果此时队列中已经有其它任务，依据队列<code>先入先出原则</code>，要等前面的任务都执行完，才会执行定时器的任务。因此，setTimeout定时器任务设置的时间往往不是一个准确的时间

* setInterval()
1. setInterval的最短间隔时间是10毫秒，也就是说，小于10毫秒的时间间隔会被调整到10毫秒
2. javascript引擎：当使用setInterval时，如果队列中存在之前由其添加的回调函数，就会放弃本次的添加

根据第2点的原则，会导致两个问题：
1. 某些间隔被跳过. 即setInterval任务被跳过
2. 多个定时器的代码执行之间的间隔可能比预期的小
```js
btn.onclick = function(){
    setTimeout(function(){
        console.log(1);
    },250);
}
```

![setInterval](@assets/basic/code_write/8.png)

在205ms处把interval定时器任务添加到任务队列，此时需排队执行，在300ms时执行定时器任务。当执行这个定时器代码时，在405ms处又给队列添加了另一个副本。在下一个间隔，即605ms处，第一个定时器仍在运行，同时队列中已经存在一个定时器任务了。故605ms处，定时器任务会跳过。

::: info
405ms处，定时器还能添加到队列，是因为此时第一个定时器任务已经出队列，在执行栈中执行了，此时队列并无定时器任务，故能添加。
:::

* requestAnimationFrame()
大多数电脑显示器的刷新频率是60Hz，大概相当于每秒钟重绘60次。大多数浏览器都会对重绘操作加以限制，不超过显示器的重绘频率，因为即使超过那个频率用户体验也不会有提升。因此，最平滑动画的最佳循环间隔是1000ms/60，约等于16.6ms

setTimeout和setInterval的问题是，它们都不精确。它们的内在运行机制决定了时间间隔参数实际上只是指定了把动画代码添加到浏览器UI线程队列中以等待执行的时间。如果队列前面已经加入了其他任务，那动画代码就要等前面的任务完成后再执行

<code>requestAnimationFrame</code>采用系统时间间隔，<code>保持最佳绘制效率</code>，不会因为间隔时间过短，造成过度绘制，增加开销；也不会因为间隔时间太长，使用动画卡顿不流畅，让各种网页动画效果能够有一个统一的刷新机制，从而节省系统资源，提高系统性能，改善视觉效果



## requestAnimationFrame
:::warning
用requestAnimationFrame实现自己的setInterval方法
:::
答：
```js
var obj = {
  timer: null,
  setInterval: (callback, interval) => {
    let startTime = new Date().getTime()
    const loop = () => {
      console.log('loop')
      const endTime = new Date().getTime()
      this.timer = requestAnimationFrame(loop)
      if (endTime - startTime > interval) {
        callback && callback()
        startTime = new Date().getTime()
      }
    }
    this.timer = requestAnimationFrame(loop)
    return this.timer
  },
  clearInterval: () => {
    cancelAnimationFrame(this.timer)
  }
}

// 测试
var count = 0
var timer = obj.setInterval(() => {
  count++
  console.log('count', count)
  if (count > 3) {
    obj.clearInterval()
  }
}, 1000)
```
<code>window.requestAnimationFrame()</code>传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行。
:::tip
window.requestAnimationFrame只会调用一次回调。若你想在浏览器下次重绘之前继续更新下一帧动画，那么回调函数自身必须再次调用window.requestAnimationFrame()
:::

参考：[深入理解定时器系列第一篇——理解setTimeout和setInterval](https://www.cnblogs.com/xiaohuochai/p/5773183.html)
[window.requestAnimationFrame](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame)