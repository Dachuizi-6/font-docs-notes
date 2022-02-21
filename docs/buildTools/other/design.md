## 日常开发用到的设计模式
1. 单例模式：类有一个返回实例的接口，一个类只有一个实例。
```js
class Single {
  static instance = null
  static getInstance() {
    if (!Single.instance) {
      Single.instance = new Single()
    }
    return Single.instance
  }
}

const a = Single.getInstance()
const b = Single.getInstance()
a === b
```
2. 策略模式：可以用对象来保存策略和策略方法的映射。比如：如果当前是A角色，就去做对应的处理；不同角色对应不同处理。可以减少大量<code>if-else</code>的使用
```js
const queryConfig = {
  '班主任': func1,
  '教师': func2,
  'xxx': func3
}
queryConfig[type] && queryConfig[type]()
```
3. 代理模式：[vue对数组的处理](./../../vue/reactive/reactive.md)；[qiankun对js沙箱的隔离](./../../project/B/common-web-system.md)
```js
// 在原型链插入代理
const methodsList = ['push', 'pop']

const arrayPrototype = Array.prototype
const proxy = Object.create(arrayPrototype) // 生成代理对象：proxy.__proto__ === arrayPrototype

methodsList.forEach(method => {
  Object.defineProperty(proxy, method, {
    value: () => {
      console.log('excute', method)
      return 'zcl'
    }
  })
})

let arr = new Array([1,2,3,4])
arr.__proto__ = proxy  // 指向代理

arr.push(5) // excute push


// proxy
class ProxySandbox {
  constructor() {
    const fakeWindow = {}
    this.proxy = new Proxy(fakeWindow, {
      get: (target, prop) => {
        return prop in target ? target[prop] : window[prop]
      },
      set: (target, prop, value) => {
        target[prop] = value
        return true
      }
    })
  }
}

let proxy = new ProxySandbox().proxy
proxy.location
proxy['zcl'] = 'zclzcl'
proxy.zcl
```
4. 发布订阅：
* [eventEmit](../../basic/code_write/eventEmit.md); 
* vue中队列收集watcher，派发更新时，遍历队列的watcher更新
5. 观察者模式（了解）

平时没用到，常用发布订阅~
* 目标对象Subject，观察者Observer
* Subject需要维护自身的观察者数组observerList，当自身发生变化时，通过调用自身的notify方法，依次通知每一个观察者执行update方法

![observer](@assets/webpack/35.png)
```js
class Observer {
  constructor(cb) {
    this.cb = cb
  }
  // 目标对象通知时，执行
  update() {
    this.cb()
  }
}

class Subject {
  constructor() {
    this.observerList = [] // 观察者列表
  }
  // 添加观察者
  addObserver(observer) {
    this.observerList.push(observer)
  }
  notify() {
    this.observerList.forEach(ob => {
      ob.update()
    })
  }
}

ob1 = new Observer(() => console.log('i am ob1'))
ob2 = new Observer(() => console.log('i am ob2'))
subject = new Subject()
subject.addObserver(ob1)
subject.addObserver(ob2)
subject.notify()
// i am ob1
// i am ob2
```

6. 装饰者模式：[AOP函数](../../basic/code_write/aop.md)。动态的给函数添加动能（执行之前或执行之后）
* 可以用来分离较验输入和业务代码。
```js
submit.beforeValidate(validate)()
```
7. 适配器模式
* 接口请求参数的处理，做适配；
* nextTick适配兼容 MutationObserver, setTimeout, promise
8. 工厂模式
* 简单工厂：把对象的创建放到一个工厂类中，通过参数来创建同一类的对象。
```js
class Role {
  constructor(role) {
    this.role = role
  }
}

class SimpleFactory {
  static getInstance(role) {
    switch (role) {
      case 'admin':
        return new Role('管理员')
      case 'developer':
        return new Role('开发者')
      default:
        throw new Error('参数只能为 admin 或 developer')
    }
  }
}

role1 = SimpleFactory.getInstance('admin')
role2 = SimpleFactory.getInstance('developer')
```
:::tip
如果要生成新的对象各类就需要修改getInstance函数，当可选参数 role 变得更多时，那函数getInstance的判断逻辑代码就变得臃肿起来，难以维护。因此不适合创建多种类型的对象
:::
* 工厂方法：将创建对象的工作推到子类中进行。每种产品由一种工厂子类来创建。

![factory](@assets/webpack/36.png)

* 抽象工厂：大项目中使用。先战略放弃~

简单工厂封装了new到底有啥好处？

代码中最好不要到中new对象，如果构造函数参数变化，那么就得改动多处。造成耦合。因此类定义静态方法，抛出new出来的对象。


## Vue用到了哪些设计模式
代理模式，适配器模式，发布订阅模式，策略模式（响应式数据是否数组，对应不同的策略）。。。


观察者模式和发布订阅模式的有什么区别？

1. 观察者模式，目标对象的列表会收集观察者对象，当目标对象通知更新时，目标对象会遍历观察者对象，执行观察者对象的更新。发布订阅模式：发布者通过中间人--队列，不会直接和订阅者产生联系 （发布订阅，队列收集的是订阅者的更新方法（eventEmit）也可以是观察者(vue响应式)）
2. 观察者模式，实际上目标对象是直接通知观察者的。相比发布订阅，存在耦合

[观察者模式 vs 发布订阅模式](https://zhuanlan.zhihu.com/p/51357583)
[从一道面试题简单谈谈发布订阅和观察者模式](https://juejin.cn/post/6844904018964119566#comment)
[JavaScript设计模式与开发实践](https://juejin.cn/post/6844903607452581896)：这本书值得一看