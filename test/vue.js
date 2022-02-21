function observer(data) {
  // 递归终止条件
  if (typeof data !== 'object') return
  if (data instanceof Array) {
    // 数组处理
  } else {
    for (let key in data) {
      defineReactive(data, key, data[key])
    }
  }
}

// 数据响尖 or 劫持
function defineReactive(obj, key, value) {
  const dep = new Dep() // dep对象
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function() {
      // 依赖收集
      dep.depend()
      return value
    },
    set: function(newValue) {
      if (newValue === value) return
      value = newValue // 注意：更新值
      // 派发更新
      dep.notify()
    }
  })
}

class Dep {
  constructor() {
    this.subs = []
  }
  addSub(sub) {
    this.subs.push(sub)
  }
  depend() {
    this.addSub(Dep.target)
  }
  notify() {
    this.subs.forEach(sub => sub.update())
  }
}

class Watcher {
  constructor() {
    Dep.target = this
  }
  update() {
    console.log('更新视图')
  }
}


function Vue(options) {
  this.$data = options.data
  observer(this.$data)
  new Watcher()
}

var vue = new Vue({
  data: {
    name: 'zcl',
    age: 26
  }
})

vue.$data.name = 'zcl2'
console.log(vue.$data.name)
vue.$data.name = 'zcl3'