## KOA2框架原理
实现一个koa框架需要实现四个大模块，分别是：

1. 封装node http server、创建Koa类构造函数
2. 构造request、response、context对象
3. 中间件机制和剥洋葱模型（compose）的实现
4. 错误捕获和错误处理

[实现简易版koa](https://github.com/0zcl-free/koa-mini). compose函数和context的对象封装代码，重点学习！

## 中间件源码
```js
function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

## 手写compose代码
:::warning
实现一个函数 compose([fn1,fn2,fn3..]) 转成 fn1(fn2(fn3()))
:::
答：
```js
function compose(middleware) {
  let index = 0
  const dispatch = i => {
    if (i === middleware.length) return
    const fn = middleware[i]
    return fn(() => dispatch(i+1))
  }
  return () => dispatch(0)
}

// 思路：[f1, f2, f3] 先执行第一个，遇到next，再执行[f2, f3]中的第一个. 重复则用递归
// dispatch(i) 表示执行第i个，把第i+1个作为第i个函数的参数

// 测试
let f1 = next => {
  console.log(1)
  next()
  console.log(2)
}
let f2 = next => {
  console.log(3)
  next()
  console.log(4)
}
let f3 = next => {
  console.log(5)
  next()
  console.log(6)
}
let fn = compose([f1, f2, f3])
fn() // 1 3 5 6 4 2
```
如果next()后面有Promise呢？下面执行测试用例，打印 1 3 5 4 2 6，显然不对, 下面对compose进过行优化
```js
function compose(middleware) {
  let index = 0
  return function() {
    const dispatch = i => {
      if (i === middleware.length) return Promise.resolve()
      const fn = middleware[i] // fn()返回一个promise对象
      return Promise.resolve(fn(() => dispatch(i+1)))
    }
    return dispatch(0)
  }
}

/*
// 源码用了Promise.resolve，但经过测试，不用Promise也是可以的，如下
function compose(middleware) {
  let index = 0
  const dispatch = i => {
    if (i === middleware.length) return
    const fn = middleware[i]
    return fn(() => dispatch(i+1))
  }
  return () => dispatch(0)
}
*/

// 测试
let f1 = async next => {
  console.log(1)
  await next()
  console.log(2)
}
let f2 = async next => {
  console.log(3)
  await next()
  console.log(4)
}
let f3 = async next => {
  console.log(5)
  await next()
  const p = Promise.resolve('6')
  p.then(function (s) {
    console.log(s)
  })
}
let fn = compose([f1, f2, f3])
fn() // 1 3 5 6 4 2
```
[Promise.resolve()](https://es6.ruanyifeng.com/#docs/promise#Promise-resolve) 参数如果是一个Promise实例，那么Promise.resolve将不做任何修改、原封不动地返回这个实例

源码为啥要用Promise.resolve呢？ 个人理解是为了保证compose函数返回一个promise


## 面试
问：koa和express的区别？

答：
1. express 大而全, 自带路由，视图渲染等特性; koa2 小而精, 通过添加中间件实现功能。如：中间件Koa-router实现路由功能
2. koa2 使用 async await，express 使用callback
3. koa2 使用封装的context 上下文；express 没有，express使用Node http模块的req, res对象
4. koa继承EventEmitter类，on监听错误，emit触发错误处理；express在callback捕获error
5. koa2 的中间件是洋葱模型；express的中间件是线型的

![koa-compose](@assets/node/2.png)
![express-compose](@assets/node/3.png)

问：koa2 和 egg 的区别？

答：
1. egg 是在 koa2 上的封装
2. egg约定了文件目录结构，有 controller，service，router


问：中间件原理和洋葱模型

答：
1. 收集中间件函数。app.use() 把中间件函数存储在middleware数组中，最终会调用koa-compose导出的函数compose返回一个promise，

2. 参数说明。中间件函数的第一个参数ctx是封装的context，会不断传递给下一个中间件。next是下一个中间件函数。

3. 洋葱模型。执行compose函数，实际上先执行第一个中间件函数，执行中间件函数时执行了next()，即执行下一个中间件函数。就像洋葱一样，先从外到内执行，再从内到外执行。

问：如果中间件中的next()方法报错了怎么办

答：next方法报错，实际上就是中间件函数报错。会被ctx.onerror捕获异常，ctx.onerror调用emit('error', err)触发错误事件，on('error', )已对错识事件进行监听
```js
// lib/application.js
this.on('error', this.onerror);
// ...
handleRequest(ctx, fnMiddleware) {
  const res = ctx.res;
  res.statusCode = 404;
  const onerror = err => ctx.onerror(err);
  const handleResponse = () => respond(ctx);
  onFinished(res, onerror);
  return fnMiddleware(ctx).then(handleResponse).catch(onerror);
}

// lib/context.js
onerror(err) {
  // delegate
  this.app.emit('error', err, this);
  // ...
}
```
:::tip
[错误处理](https://es6.ruanyifeng.com/#docs/async#%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86)
如果async 函数里的await后面的异步操作出错，那么等同于async函数返回的 Promise 对象被reject
:::

问：co的原理是怎样的？

答：
1. co的原理是通过不断调用generator函数的next方法来达到自动执行generator函数的，类似async、await函数自动执行。
2. next()返回一个包含value, done属性的对象。done为true表示generator已执行完；value为yield后面表达式的值


参考：
[KOA2框架原理解析和实现](https://juejin.cn/post/6844903709592256525#heading-0)
[带你走进 koa2 的世界（koa2 源码浅谈）](https://juejin.cn/post/6844903477798240264#heading-2)
[手写koa](https://github.com/ChanWahFung/koa-mini)
[迷你版 Koa](https://zhouatie.github.io/blog/2020/07/06/%E5%B8%A6%E4%BD%A0%E6%89%8B%E5%86%99%E4%B8%80%E4%B8%AAKoa/)
[从Generator入手读懂co模块源码](https://juejin.cn/post/6844904133577670664#heading-2)