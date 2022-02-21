:::warning
简单实现 Vue 数据响应式原理
:::
答：

```js
function observer(data) {
  // 递归终止条件
  if (typeof data !== "object") return;
  if (data instanceof Array) {
    // 数组处理
  } else {
    for (let key in data) {
      defineReactive(data, key, data[key]);
    }
  }
}

// 数据响尖 or 劫持
function defineReactive(obj, key, value) {
  const dep = new Dep(); // dep对象
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      // 依赖收集
      if (Dep.target) {
        dep.depend();
      }
      return value;
    },
    set: function (newValue) {
      if (newValue === value) return;
      value = newValue; // 注意：更新值
      // 派发更新
      dep.notify();
    },
  });
}

class Dep {
  constructor() {
    this.subs = [];
  }
  addSub(sub) {
    this.subs.push(sub);
    console.log("subs", this.subs);
  }
  depend() {
    if (Dep.target) {
      this.addSub(Dep.target);
    }
  }
  notify() {
    this.subs.forEach((sub) => sub.update());
  }
}

class Watcher {
  constructor() {
    Dep.target = this;
  }
  update() {
    console.log("更新视图");
    patch();
  }
}

function Vue(options) {
  this.$data = options.data;
  observer(this.$data);
  new Watcher();
}

var vue = new Vue({
  data: {
    name: "zcl",
    age: 26,
  },
});

// 先依赖收集
console.log(vue.$data.name);
// 置为null，防止重复收集依赖
Dep.target = null;

window.onload = function () {
  const input = document.getElementById("vue-input");
  input.addEventListener("input", function (e) {
    vue.$data.name = e.target.value;
  });
};

// 模拟Vue的模版编译，patch对比更新过程
function patch() {
  const p = document.getElementById("vue-p");
  p.innerText = vue.$data.name;
}
```

### 测试

```js
<input type="text" id="vue-input" class="vue-input" />
<p id="vue-p"></p>

<strong>效果</strong>：改变输入框的值，即改变Vue的响应数据，最终触发了更新回调，更新输入框下方P标签的数据

<script>
  window.onload = function() {
    const input = document.getElementById('vue-input')
    input.addEventListener('input', function(e) {
      vue.$data.name = e.target.value
    })
  }

  // 模拟Vue的模版编译，patch对比更新过程
  function patch() {
    const p = document.getElementById('vue-p')
    p.innerText = vue.$data.name
  }

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
        if (Dep.target) {
          dep.depend()
        }
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
      console.log('subs', this.subs)
    }
    depend() {
      if (Dep.target) {
        this.addSub(Dep.target)
      }
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
      patch()
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

  // 先依赖收集
  console.log(vue.$data.name)
  // 置为null，防止重复收集依赖
  Dep.target = null

</script>


思路：
1. Object.defineProperty作数据劫持，getter做依赖收集，收集watcher，getter做通知notify
2. watcher执行update
3. 依赖收集后，我把<code>Dep.target</code>清空，是为了防止重复收集依赖。

100行代码，考察的知识点很多：<code>递归</code>，<code>[Vue响应式原理](../../vue/reactive/reactive.md)</code>，<code>Object.defineProperty</code>, <code>原生Dom操作</code>，<code>队列</code>

<style scoped>
.vue-input {
  width: 200px;
  height: 50px;
}
</style>

```
