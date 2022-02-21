:::warning
手写实现一个eventEmit类，包括如下几个方法：
* on监听事件方法。
* off取消监听事件方法。
* emit触发事件方法。
* once绑定一次事件监听方法
:::
答：
```js
class eventEmit {
  constructor() {
    this.event = {}
  }
  on(eventName, callback) {
    // 如果已存在事件名
    if (this.event[eventName]) {
      this.event[eventName].push(callback)
      return
    }
     this.event[eventName] = [callback]
  }

  off(eventName) {
    const eventList = this.event[eventName]
    if (eventList && eventList.length) {
      this.event[eventName] = []
    }
  }

  emit(eventName, ...params) {
    const eventList = this.event[eventName]
    if (eventList && eventList.length) {
      for (let index=0, len=eventList.length; index<len; index++) {
        eventList[index].apply(this, params) // this 为evnet实例
      }
    }
  }

  once(eventName, callback) {
    const fn = () => {
      this.off(eventName)
      callback()
    }
    this.on(eventName, fn)
  }
}
// 测试
const event = new eventEmit()
event.on('zcl', function() {
  console.log('this is zcl', arguments)
})
event.emit('zcl') // this is zcl
event.emit('zcl', 'arg1', 'arg2') // this is zcl Arguments(2) ["arg1", "arg2", callee: ƒ, Symbol(Symbol.iterator): ƒ]
event.off('zcl')
event.emit('zcl')
event.once('js', () => {
  console.log('this is JS')
})
event.emit('js') // this is JS
event.emit('js')
```
注意：
1. emit传入的参数需要 传给监听的事件
2. once接入，重写了on监听的事件。新的事件fn，在调用旧的事件之前先把eventName对应的事件队列清空。个人理解其思想上和前几节复习到的[AOP装饰函数](./aop.md)异曲同工
3. 监听器函数被调用时，this 关键词会被指向监听器所绑定的 EventEmitter 实例. [官网](http://nodejs.cn/api/events.html#events_passing_arguments_and_this_to_listeners)