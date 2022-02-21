:::warning
实现Vue nextTick
:::
答：
```js
var callBackList = [] // 存放回调的队列
var pending = false

function timerFunc() {
  const p = Promise.resolve()
  // 这里为了代码简洁，默认浏览器支持Promise语法
  p.then(() => {
    pending = false
    while (callBackList.length) {
       // 出队列。这里和源码实现有点不一样。都行
      const cb = callBackList.shift()
      cb()
    }
  })
}

function nextTick(cb, ctx) {
  if (cb) {
    callBackList.push(() => {
      cb.call(ctx)
    })
  }
  if (!pending) {
    pending = true
    timerFunc()
  }
  // 不存在cb，则返回promise
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      resolve()
    })
  }
}

// 测试
nextTick(() => {
  console.log(1)
})
nextTick(() => {
  console.log(2)
})
console.log(nextTick()) // Promise {<fulfilled>: undefined}
nextTick().then(() => {
  console.log(3)
})

nextTick(() => {
  console.log(4)
})
Promise.resolve().then(() => {
  console.log(5)
})
nextTick(() => {
  console.log(6)
})
// 注意：这里输出 4 6 5 才是对的! 代码中加了pending标记来实现
```

1. <code>nextTick</code>如果不传回调函数cb，则返回一个promise
2. 用<code>callBackList</code>队列，收集nextTick的回调，在下一个 tick 循环执行

为了代码简洁，默认浏览器支持Promise语法。想看兼容的代码，可以自行查看源码，也可看我之前复习的[nextTick码源解读](../../vue/reactive/nextTick.md). 

题外话：自从看了nextTick的源码，之后做了一个需求，批量下载邀请卡。需要前端批量合成图片，批量下载图片。也用到了nextTick的思想。<strong>用队列收集回调，再统一执行</strong>