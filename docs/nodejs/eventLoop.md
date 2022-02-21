## 事件循环
任务队列又分为macro-task（宏任务）与micro-task（微任务）

macro-task大概包括：
* script(整体代码)
* setTimeout
* setInterval
* setImmediate
* I/O
* UI render

micro-task大概包括:
* process.nextTick(<code>与普通微任务有区别，在微任务队列执行之前执行</code>)
* Promise
* Async/Await(实际就是promise)
* MutationObserver(html5新特性)

## 浏览器中的事件循环
流程图: 

![evenloop](@assets/basic/4.png)

1. 宏任务队列存放宏任务，微任务队列存放微任务。
2. 执行宏任务，然后执行该宏任务产生的微任务。
3. 若微任务在执行过程中产生了新的微任务，则继续往微任务队列添加新产生的微任务。微任务队列执行完毕后，再回到宏任务队列中进行下一轮循环，即执行下一个宏任务


## node中的事件循环
[node事件循环](https://nodejs.org/zh-cn/docs/guides/event-loop-timers-and-nexttick/)简化图

![node_evenloop](@assets/basic/5.png)

node事件循环由上图可知，有6个阶段，<code>每个阶段都有一个 FIFO 队列来执行回调</code>

### 阶段概述
* 定时器检测阶段(<code>timers</code>)：本阶段执行 timer 的回调，即 setTimeout、setInterval 里面的回调函数。
* I/O事件回调阶段(I/O callbacks)：执行延迟到下一个循环迭代的 I/O 回调，即上一轮循环中未被执行的一些I/O回调。
* 闲置阶段(idle, prepare)：仅系统内部使用。
* 轮询阶段(<code>poll</code>)：检索新的 I/O 事件; 执行与 I/O 相关的回调，其余情况 node 将在适当的时候在此阻塞。
* 检查阶段(<code>check</code>)：setImmediate() 回调函数在这里执行
* 关闭事件回调阶段(close callback)：一些关闭的回调函数，如：socket.on('close', ...)

### timers、poll、check
日常开发中的绝大部分异步任务都是在 <code>poll、check、timers</code> 这3个阶段处理的, 所以是重点！

* timers: setTimeout 和 setInterval 回调，并且是由 poll 阶段控制的。
* poll: 
    1. 定时器时间到了，则到timers阶段执行定时器回调；
    2. 如果1不满足且poll队列有回调，则执行poll队列的相关回调
    3. 如果2不满足且存在setImmediate，则到check阶段执行setImmediate回调
![poll](@assets/node/4.png)
* check: 直接执行 setImmdiate 的回调

### process.nextTick
```js
setImmediate(() => {
    console.log('timeout1')
    Promise.resolve().then(() =>console.log('promise resolve'))
    process.nextTick(() =>console.log('next tick1'))
});
setImmediate(() => {
    console.log('timeout2')
    process.nextTick(() =>console.log('next tick2'))
});
setImmediate(() =>console.log('timeout3'));
setImmediate(() =>console.log('timeout4'));
```
1. <code>process.nextTick 是一个独立于 eventLoop 的任务队列</code>, process.nextTick 是微任务的一种(node11 之后)。
2. <code>process.nextTick会优先于其它微任务执行</code>。即每一个 eventLoop 阶段完成后会去检查 nextTick 队列

在 node11 之后，上述代码是先进入 check 阶段，执行一个 setImmediate 宏任务，然后执行其微任务队列，再执行下一个宏任务及其微任务

因此输出为: timeout1=>next tick1=>promise resolve=>timeout2=>next tick2=>timeout3=>timeout4

## node 版本差异说明
* node11 前。上一阶段完成，进入下一阶段前，会清空(执行) nextTick 和 promsie 队列！而且 nextTick 要比 promsie 要高！可参考下图
* node11(含)之后版本，一旦执行一个阶段里的一个宏任务(setTimeout,setInterval和setImmediate)就立刻执行微任务队列，这就跟浏览器端运行一致

![poll](@assets/node/5.png)
```js
setTimeout(() => {
  console.log('timeout1');
  Promise.resolve(1).then(() => {
    console.log('Promise1')
  })
});

setTimeout(() => {
  console.log('timeout2');
  Promise.resolve(1).then(() => {
    console.log('Promise2')
  })
});

// node 11前，输出: timeout1 --> timeout2 --> Promise1 --> Promise2
// node 11后，输出: timeout1 => Promise1 => timeout2 => Promise2
```

更多阶段执行时机变化，参考：[面试题：说说事件循环机制(满分答案来了)](https://juejin.cn/post/6844904079353708557#heading-5)

## 面试
问：说下对事件循环的理解？浏览器端和node端都说下

答：
1. 浏览器事件循环
2. node事件循环：重点timers, poll, check阶段；node11前后事件循环变动

问：node 后 和 浏览器 eventLoop的主要区别？

答：
1. 浏览器事件循环，是先执行宏任务，再执行对应的微任务
2. node事件循环有阶段的概念，如timers poll check，浏览器没有
3. node11前 和 浏览器 事件循环两者不是同一个东西。node中，一个阶段执行完成，进入下一阶段，会去执行微任务队列。微任务执行时机就不一样
4. node11后，宏任务执行完后，就执行微任务。和浏览器保持一致。


参考：
[官网](https://nodejs.org/zh-cn/docs/guides/event-loop-timers-and-nexttick/)
[面试题：说说事件循环机制(满分答案来了)](https://juejin.cn/post/6844904079353708557#heading-0)
[面试题：说说事件循环机制(满分答案来了)](https://mp.weixin.qq.com/s?__biz=MzI0MzIyMDM5Ng==&mid=2649826653&idx=1&sn=9e5e2de78a8ef4de3820769ff3ab7c02&chksm=f175ef9ec60266880a86f33085ff43f95e3180846c5f139cb9b1b33c3245201157f39d949e9a&scene=21#wechat_redirect)
