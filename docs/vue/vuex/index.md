Vuex是一个用来管理Vuex状态的插件。采用<code>集中式存储</code>管理所有组件的状态。
```js
// 两种方式获取数据
this.$store.state.count 
this.$store.getters.xxx  // 定义的getters

// 修改：action --commit--> mutation --mutate--> state
```


带问题看源码，加深理解：[vuex官网](https://vuex.vuejs.org/zh/guide/#%E6%9C%80%E7%AE%80%E5%8D%95%E7%9A%84-store), [vuex使用](https://juejin.cn/post/6844903993374670855#heading-0)

## 传递store
1. 每个组件内都可以使用<code>this.$store.state.xxx</code>，$store如何挂载到组件每个组件中的？

vuex抛出一个Store类和install函数。vuex插件注册时会执行install方法。install会通过mixin在每个组件的<code>beforeCreate</code>添加$store. 
* 最外层的组件。this.$store为实例vue时，传进来的store
* 接下来把最外层的$store，一层一层传给组件的$store
```js
// src/index.js
export {
  Store,
  install,
  // ...
}

// src/store.js
export function install (_Vue) {
  // ...
  applyMixin(Vue)
}

// src/mixin.js
function vuexInit () {
  const options = this.$options
  // store injection
  if (options.store) {
    this.$store = typeof options.store === 'function'
      ? options.store()
      : options.store
  } else if (options.parent && options.parent.$store) {
    this.$store = options.parent.$store
  }
}
```

## 集中式存储
2. 如何理解集中式存储？数据是放在哪里的？

集中式存储就是把要管理的数据集中起来维护，方便管理。实际上会给store._vm实例化一个vue对象，使用响应式来管理数据。当使用<code>this.$store.state.count</code>获取值时，实际上是使用<code>store._vm._data.$$state.count</code>
```js
const state = store.state
// ...
store._vm = new Vue({
  data: {
    $$state: state
  },
  computed
})

export class Store {
  // ...
  get state () {
    return this._vm._data.$$state
  }
}
```

## getters
3. vuex定义了一个<code>eventOrOdd</code>的count的computed。computed中须是依赖属性才生效，为什么可以使用computed来获取数据？
```js
<div>count is {{ count }}</div>
// ...
computed: {
  count () {
    return store.state.count
  }
}
```
数据是存放到vue实例中的，vuex存放的数据也是响应式数据。count是依赖属性，因此可以使用computed


## strict
4. 可以通过this.$store.state.xxx = xxx直接修改状态吗？如何禁止直接修改？如何实现禁止修改的？

可以。加上<code>strict:true</code>即可禁止直接修改数据。

当strict设置为true，会对数据使用watch监听数据。当直接修改时，数据发生改变，触发watch监听回调，如果是开发环境，则爆错。
```js
if (store.strict) {
  enableStrictMode(store)
}

function enableStrictMode (store) {
  store._vm.$watch(function () { return this._data.$$state }, () => {
    if (__DEV__) {
      assert(store._committing, `do not mutate vuex store state outside mutation handlers.`)
    }
  }, { deep: true, sync: true })
}

// Error: [vuex] do not mutate vuex store state outside mutation handlers.
```