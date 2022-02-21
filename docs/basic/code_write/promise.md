问：Promise 解决了什么问题？

答：解决了多个异步请求嵌套过多，嵌套地狱问题；Promise把嵌套调用改为链式调用

问：Promise 中是如何实现回调函数返回值穿透的？

答: Promise.prototype.then方法返回的是一个新的Promise实例，因此可以采用链式写法，即then方法后面再调用另一个then方法。

问：Promise 出错后，是怎么通过“冒泡”传递给最后那个捕获异常的函数？

答：Promise 对象的错误具有“冒泡”性质，会一直向后传递，直到被捕获为止。
1. 被.then的第二个回调函数捕获取。
2. 被.catch捕获。.catch()实际上是.then(null, rejection)或.then(undefined, rejection)的别名
```js
// 1. 被catch捕获
new Promise((resolve, reject) => {
    throw Error('abc')
}).then(res => {
    console.log('res', res)
}).catch(e => {
    console.log('e', e)
})
// e Error: abc

// 2. 被.then的第二个回调函数捕获取
new Promise((resolve, reject) => {
    throw Error('abc')
}).then(
res => {
    console.log('res', res)
},
error => {
    console.log('error', error)
}
).catch(e => {
    console.log('e', e)
})
// error Error: abc
```

## 生成器Generator
helloWorldGenerator是一个生成器函数。调用 Generator 函数后，会返回一个[迭代器(遍历器)](./for_of.md)
```js
function* helloWorldGenerator() {
  yield 'hello';
  yield 'world';
  return 'ending';
}

hw.next() // { value: 'hello', done: false }
hw.next() // { value: 'world', done: false }
hw.next() // { value: 'ending', done: true }
hw.next() // { value: undefined, done: true }
```
即然helloWorldGenerator()返回的是一个迭代器，那就可以用for...of
```js
for (item of helloWorldGenerator()) {
  console.log(item)
}
// hello
// world
```
:::tip
一旦next方法的返回对象的done属性为true，for...of循环就会中止，且不包含该返回对象，所以上面代码的return语句返回的`ending`，不包括在for...of循环之中
:::

### next方法的参数
yield表达式本身没有返回值，或者说总是返回undefined。next方法可以带一个参数，该参数就会被当作上一个yield表达式的返回值
```js
function* gen(x) {
  var y = yield new Promise((resolve, reject) => {
    resolve(444)
    })
    console.log('y', y)
  return y;
}

var g = gen(1);
// 测试一
g.next() // {value: Promise, done: false}
// y undefined  yield表达式本身没有返回值
g.next() // {value: undefined, done: true}

// 测试二
g.next() // {value: Promise, done: false}
g.next('zcl')
// y zcl
{value: 'zcl', done: true}
```


## co与Generator
先说下异步编程的发展历史：
1. 回调函数：回调地狱。多个回调函数嵌套问题
2. Promise：将回调函数的嵌套，改成链式调用。代码冗余，代码看上去有一堆then
3. Generator生成器：yield表达式是暂停执行的标记，而next方法可以恢复执行
* 遇到yield表达式，就暂停执行后面的操作，并将yield后面表达式的值，作为返回对象的value值
4. co模块：用于自动执行 Generator 函数。当异步操作有了结果，能够自动交回执行权
```js
// co源码是下面自动执行器的扩展
function run(gen) {
  const g = gen()
  const next = data => {
    const result = g.next(data)
    if (result.done) return result.value
    result.value.then(res => next(res))
  }
  next()
}

// 测试
function* gen(x) {
  var y = yield new Promise((resolve, reject) => {
    resolve(444)
    })
    console.log('y', y)
  return y;
}

run(gen)
// y 444
```
5. async/await：async函数是Generator的语法糖。相当于生成器的*号，换成async; yield换成await。async/await相比生成器，有以下三点改进：
* async函数内置自动执行器。不用像Generator需要每次手动调next
* 适用性更好。<code>co</code>+<code>Generator</code>方案，yield后面只能是Thunk函数(暂不了解。。)或Promise对象; 而async函数的await后面，除了Promise对象还可以是原始数据类型的值(Number, String, Array..., 会自动转成立即 resolved 的 Promise 对象)
* async函数返回值是Promise对象 

## 对async/await的理解以及内部原理
async/await的理解：见上面第5点


## 手写async函数
```js
// 测试用例
function getData() {
  return new Promise(resolve => {
    setTimeout(() => resolve('zcl'), 1000)
  })
}

async function test() {
  const data = await getData()
  console.log('data', data)
  const data2 = await getData()
  console.log('data2', data2)
  return 'success'
}
test().then(res => console.log('res', res))

// 输出
// data zcl
// data2 zcl
// res success
```
手写async函数

```js
function* test() {
  const data = yield getData()
  console.log('data', data)
  const data2 = yield getData()
  console.log('data2', data2)
  return 'success'
}

function generatorToAsync(genFunc) {
  return function() {  // 1. 返回方法
    return new Promise((resolve, reject) => {  // 2. 返回Promise
      const gen = genFunc() // 生成器对象
      const next = data => {
        const result = gen.next(data)
        if (result.done) return resolve(result.value)
        Promise.resolve(result.value).then(  // 3. await 可以是原始类型
          res => next(res),
          error => return reject(error) // 4. await后的异步，只要有一个出错，就不往下执行
        )
      }
      next()
    })
  }
}

const myAsync = generatorToAsync(test)
myAsync().then(res => console.log('res', res))

// 输出
// data zcl
// data2 zcl
// res success
```
思路：
1. async函数是 Generator + 自动执行器
2. async函数返回Promise对象
3. 代码注释第3点，result.value如果是promise，其实用result.value.then()就可以了。但个人理解，考虑到await后面可以是原始类型。所以用Promise.resolve(result.value)做兼容处理。
4. resolve, reject时要return，是为了不再往下执行了

## 手写Promise
1. 实例化Promise会传一个excuteFunc回调，excuteFunc回调有两个参数，分别是resolve, reject函数。实例化promise会执行excuteFunc
2. .then传入两个回调函数。执行.then时，如果promise对象状态是pending，把两个回调分别放入队列，等到resolve/reject之后再执行
3. .then返回一个新的promise
### 第一版
```js
class MyPromise {
  static PENDING = 'pending'
  static FULFILLED = 'fulfilled'
  static REJECTED = 'rejected'

  constructor(excuteFunc) {
    this.value = undefined // 存放成功状态的值
    this.reason = undefined // 存放失败状态的值
    this.status = MyPromise.PENDING
    const resolve = value => {
      if (this.status === MyPromise.PENDING) {
        this.value = value
        this.status = MyPromise.FULFILLED
      }
    }
    const reject = reason => {
      if (this.status === MyPromise.PENDING) {
        this.reason = reason
        this.status = MyPromise.REJECTED
      }
    }
    excuteFunc(resolve, reject)
  }
  // 参数为两个回调
  then(onFulFilled, onRejected) {
    if (this.status === MyPromise.FULFILLED) {
      onFulFilled(this.value)
    }
    if (this.status === MyPromise.REJECTED) {
      onRejected(this.value)
    }
  }
}

// 测试一
new MyPromise((resolve, reject) => {
  resolve('zcl')
}).then(
  res => console.log('res', res),
  error => console.log('err', error)
)
```
问题：new promise对象后直接调用then，当excuteFunc是一个异步，不应该直接调用then，而是等异步执行了resolve或reject，才执行then

解决：调用then时，如果状态为pending，把onFulFilled放到队列暂存，onRejected也放到队列暂存，等到resolve或reject状态变化时，才执行队列中的回调方法

### 第二版
```js
class MyPromise {
  static PENDING = 'pending'
  static FULFILLED = 'fulfilled'
  static REJECTED = 'rejected'

  constructor(excuteFunc) {
    this.value = undefined // 存放成功状态的值
    this.reason = undefined // 存放失败状态的值
    this.onFulFilledCallback = []
    this.onRejectedCallback = []
    this.status = MyPromise.PENDING

    const resolve = value => {
      if (this.status === MyPromise.PENDING) {
        this.value = value
        this.status = MyPromise.FULFILLED
        this.onFulFilledCallback.forEach(cb => cb(this.value))
      }
    }
    const reject = reason => {
      if (this.status === MyPromise.PENDING) {
        this.reason = reason
        this.status = MyPromise.REJECTED
        this.onRejectedCallback.forEach(cb => cb(this.reason))
      }
    }
    excuteFunc(resolve, reject)
  }
  // 参数为两个回调
  then(onFulFilled, onRejected) {
    if (this.status === MyPromise.FULFILLED) {
      onFulFilled(this.value)
    }
    if (this.status === MyPromise.REJECTED) {
      onRejected(this.reason)
    }
    if (this.status === MyPromise.PENDING) {
      this.onFulFilledCallback.push(onFulFilled)
      this.onRejectedCallback.push(onRejected)
    }
  }

}

// 测试二
const promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功');
  }, 1000);
}).then(
  res => {
    console.log('success', res)
  },
  error => {
    console.log('faild', error)
  }
)
// success 成功. 只执行上面是可以的

promise.then(  // 出错 promise is undefined
  res => {
    console.log('success2', res)
  },
  error => {
    console.log('faild2', error)
  }
)
```

问题：未实现链式调用。.then返回的是一个新的promise对象
### 第三版
```js
class MyPromise {
    static PENDING = 'pending'
    static FULFILLED = 'fulfilled'
    static REJECTED = 'rejected'

    constructor(excuteFunc) {
        this.value = undefined
        this.reason = undefined
        this.status = MyPromise.PENDING
        this.onFulfilledCallback = []
        this.onRejectedCallback = []

        const resolve = value => {
            if (this.status === MyPromise.PENDING) {
                this.value = value
                this.status = MyPromise.FULFILLED
                this.onFulfilledCallback.forEach(cb => cb())
            }
        }
        const reject = reason => {
            if (this.status === MyPromise.PENDING) {
                this.reason = reason
                this.status = MyPromise.REJECTED
                this.onRejectedCallback.forEach(cb => cb())
            }
        }

        excuteFunc(resolve, reject)
    }
    
    then(onFulFilled, onRejected) {
        let result = undefined
        return new MyPromise((resolve, reject) => {
            if (this.status === MyPromise.FULFILLED) {
                result = onFulFilled(this.value)
                resolve(result)
            }
            if (this.status === MyPromise.REJECTED) {
                result = onRejected(this.reason)
                reject(result)
            }
            if (this.status === MyPromise.PENDING) {
                this.onFulfilledCallback.push(() => {
                    result = onFulFilled(this.value)
                    resolve(result)
                })
                this.onRejectedCallback.push(() => {
                    result = onRejected(this.reason)
                    reject(result)
                })
            }
        })
    }  
}


new MyPromise((resolve, reject) => {
    setTimeout(() => {
        resolve('zcl')
    }, 1000)
}).then(
    res => {console.log('res', res);return 'hello'},
    err => {console.log('err', err)}
)
```
思路：then返回新的promise对象；如果第一个promise状态为fulfilled，则直接执行then的第一个参数方法，再执行then中新promise对象的resolve；如果第一个promise状态的pending，由于第一个promise执行resolve时，会调用队列的回调，因此，在回调中，不仅要执行then的第一/二个参数方法，执行完参数方法后，还要执行then中新promise对象的resolve

## 手写promise.all
<code>const p = Promise.all([p1, p2, p3])</code>

1. 返回一个promise对象p；
2. 当p1, p2, p3状态都为fulfilled时，p状态才为fulfilled；当p1, p2, p3有一个状态为rejected时，p状态为rejected

```js
Promise.all = function(promiseList) {
  return new Promise((resolve, reject) => {
    let count = 0
    const result = []
    promiseList.forEach((p, index) => {
      Promise.resolve(p).then(
        res => {
          count++
          result[index] = res
          if (count === promiseList.length) {
            resolve(result)
          }
        },
        err => {
          reject(err)
        }
      )
    })
  })
}

// 测试一
p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        console.log('p1')
        resolve('p1')
    }, 1000)
})
p2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        console.log('p2')
        resolve('p2')
    }, 3000)
})
// 3秒后打印：res (2) ['p1', 'p2']
Promise.all([p1, p2]).then(res => {
    console.log('res', res)
})

// 测试二
p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        console.log('p1')
        reject('p1')
    }, 1000)
})
p2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        console.log('p2')
        resolve('p2')
    }, 3000)
})
// 1秒后打印：Uncaught (in promise) p1
Promise.all([p1, p2]).then(res => {
    console.log('res', res)
})

// 测试三
// 3秒后打印：res (3) ['p1', 'p2', 'zcl']
Promise.all([p1, p2, 'zcl']).then(res => {
    console.log('res', res)
})
```


## 题一
```js
new Promise(resolve=>resolve())
  .then(() => console.log(1))
  .then(() => console.log(2))
  .then(() => console.log(3))

new Promise(resolve=>resolve())
  .then(() => console.log(4))
  .then(() => console.log(5))
  .then(() => console.log(6))
```
答案：1 4 2 5 3 6

## 题二
```js
// https://juejin.cn/post/6973817105728667678#heading-8
setTimeout(() => {
  console.log('0');
}, 0)
new Promise((resolve, reject) => {
  console.log('1');
  resolve();
}).then(() => {
  console.log('2');
  new Promise((resolve, reject) => {
    console.log('3');
    resolve();
  }).then(() => {     // 📌
    console.log('4');
  }).then(() => {
    console.log('5');
  })
}).then(() => {
  console.log('6');   // 📌
})

new Promise((resolve, reject) => {
  console.log('7');
  resolve()
}).then(() => {        
  console.log('8');
})
```
代码结果：1 7 2 3 8 4 6 5 0
:::tip
注意了，执行到console.log('3')，此时微任务队列[8]; 打印3后执行resolve后，此时微任务队列[8, 4, 6]，为什么要加6，是因为6的上一个promise对象状态为undefined。嗯，比较难以表达出我的意思~~，看下一道题
:::
## 题三
```js
setTimeout(() => {
  console.log('0');
}, 0)
new Promise((resolve, reject) => {
  console.log('1');
  resolve();
}).then(() => {
  console.log('2');
  // 加了return
  return new Promise((resolve, reject) => {
    console.log('3');
    resolve();
  }).then(() => {     // 📌
    console.log('4');
  }).then(() => {
    console.log('5');
  })
}).then(() => {
  console.log('6');   // 📌
})

new Promise((resolve, reject) => {
  console.log('7');
  resolve()
}).then(() => {        
  console.log('8');
})
```
代码结果：1 7 2 3 8 4 5 6 0。 因为加了return, 要等打印5后，返回一个promise对象状态，才会执行6
## 题四
```js
let v = new Promise(resolve => {
    console.log("v-begin"); 
    resolve("v-then");
});

Promise.resolve(v)
.then((v) => {
    console.log(v) 
});

new Promise(resolve => {
    console.log(1);
    resolve();
})
.then(() => {
    console.log(2);
})
.then(() => {
    console.log(3);
})
.then(() => {
    console.log(4);
});
```
结果：v-begin 1 v-begin 2 3 4

Promise.resolve() 参数是原始数据(String, Number, Array..)，返回一个fulfilled状态的promise对象；
参数是一个promise对象，那么Promise.resolve将不做任何修改、原封不动地返回这个promise实例
## 题五
```js
let v = new Promise(resolve => {
    console.log("v-begin"); 
    resolve("v-then");
});

new Promise(resolve => resolve(v))
.then((v) => {
    console.log(v) 
});

new Promise(resolve => {
    console.log(1);
    resolve();
})
.then(() => {
    console.log(2);
})
.then(() => {
    console.log(3);
})
.then(() => {
    console.log(4); 
});
```
结果：v-begin 1 2 3 v-then 4

<code>new Promise(resolve => resolve(v)) v为promise对象时，then会推迟两个时序。</code>

推迟原因：浏览器会创建一个 PromiseResolveThenableJob 去处理这个 Promise 实例，这是一个微任务。研究了下，还是没懂，暂时记得有这个东西吧~~

## 题六
* async修饰的函数必定返回一个 Promise 对象；
* async修饰的函数若没有返回值时，Promise的resolve方法会传递一个undefined值；
* async修饰的函数若有返回值时，Promise的resolve方法会传递这个值；
* async修饰的函数若抛出异常，Promise的reject方法会传递这个异常值；
```js
async function add(){}
add().then(res=>console.log(res))
// 等价于
// Promise.resolve().then(res=>console.log(res))
// undefined

async function add(){
	return 1 
}
add().then(res=>console.log(res))
// 等价于
// Promise.resolve(1).then(res=>console.log(res))
// 1

// 如果async2有异步操作
async function async1() {
    console.log('async1 start')
    await async2()
    console.log('async1 end')
}
// 等价于
function async1(){
  console.log('async1 start')
  return new Promise(resolve => resolve(async2()))
    .then(() => {
      console.log('async1 end')
    });
}
// 等价于
function async1() {
  console.log('async1 start');
  const p = async2();
  return new Promise((resolve) => {
    Promise.resolve().then(() => {
      p.then(resolve)
    })
  })
  .then(() => {
    console.log('async1 end') // 推迟了两个时序
  });
}
```
```js
console.log('script start')

async function async1() {
    await async2()
    console.log('async1 end')
}
async function async2() {
    console.log('async2 end')
    return Promise.resolve().then(()=>{
        console.log('async2 end1')
    })
}
async1()

setTimeout(function() {
    console.log('setTimeout')
})

new Promise(resolve => {
    console.log('Promise')
    resolve()
})
.then(function() {
    console.log('promise1')
})
.then(function() {
    console.log('promise2')
})
.then(function() {
    console.log('promise3')
})
Promise.resolve().then(function() {
    console.log('promise4')
})

console.log('script end')

```
答案： script start -> async2 end -> Promise -> script end -> async2 end1 -> promise1 -> promise4 -> promise2 -> async1 end -> promise3 -> setTimeout

## 题七
```js
console.log('script start') // 1

async function async1() {
  await async2()
  console.log('async1 end')
}

async function async2() {
  console.log('async2') // 2
}

/*
function async1(){
  console.log('async1 start');
  async2().then(() => {
    console.log('async1 end')
  })
}
    
function async2(){
  console.log('async2');
  return Promise.resolve();
}
*/

async1()

setTimeout(function() {
  console.log('setTimeout')
}, 0)

new Promise(resolve => {
  console.log('Promise')
  resolve()
})
.then(function() {
  console.log('promise1')
})
.then(function() {
  console.log('promise2')
})

console.log('script end')
```
答案：async1 start -> async2 -> Promise -> script end -> async1 end -> promise1 -> promise2 -> setTimeout


参考：
[async函数的实现原理](https://es6.ruanyifeng.com/#docs/async#async-%E5%87%BD%E6%95%B0%E7%9A%84%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86)

[new Promise((resolve)=>{resolve()}) 与 Promise.resolve() 等价吗](https://segmentfault.com/q/1010000021636481/a-1020000021638234)

[面试题：说说事件循环机制(满分答案来了)](https://mp.weixin.qq.com/s?__biz=MzI0MzIyMDM5Ng==&mid=2649826653&idx=1&sn=9e5e2de78a8ef4de3820769ff3ab7c02&chksm=f175ef9ec60266880a86f33085ff43f95e3180846c5f139cb9b1b33c3245201157f39d949e9a&scene=21#wechat_redirect) -->