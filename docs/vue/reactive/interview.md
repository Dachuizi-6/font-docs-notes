## 组件里的 data 必须是一个函数返回的对象，而不能就只是一个对象?
由于组件可以多次复用，因此需要通过工厂函数模式返回一个对象，组件每次实例化时(复用组件)调用data()函数返回独立的数据对象. 

如果data 仍然是一个纯粹的对象，则组件每次实例时将引用同一个数据对象。因数esmodule抛出的实际上是一个引用！

源码简析
```js
export function initState (vm: Component) {
  const opts = vm.$options
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
}

function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  const keys = Object.keys(data)
  let i = keys.length
  while (i--) {
    const key = keys[i]
    // data属性的命名不能和props、methods中的命名冲突
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        // ....warn
      }
    }
    if (props && hasOwn(props, key)) {
      // ....warn
      // 是不能以$或者_开头
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  observe(data, true /* asRootData */)
}
export function getData (data: Function, vm: Component): any {
  // 执行data函数, 执行新的数据对象
  return data.call(vm, vm)
}
```

## proxy代理
我们经常会直接使用this.xxx的形式直接访问props或者data中的值，这是因为Vue为props和data默认做了proxy代理
```js
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}
// proxy(vm, `_data`, key)执行
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```
Vue中为什么使用this.xxx就能直接访问data, props中的属性?

因为在初始化State中, 会使用proxy对vm做数据劫持, 当访问this.xxx实际上是访问this._data.xxx或者this._props.xxx
```js
const name = this.name
this.name = 'BBB'
// 等价于
const name = this._data.name
this._data.name = 'BBB'
```

## Vue 中的 key 有什么用?
<code>高效的更新真实Dom树</code>

Vnode进行diff对比更新新旧vnode时，会通过vnode的key， tag标签等来判断两个Vnode结点是否为同一个（sameNode）. 从而来高效更新dom树。再深入请看：[diff](../vnode/diff.md)
```js
function sameVnode(a, b) {
  return (
    a.key === b.key &&
    ((a.tag === b.tag &&
      a.isComment === b.isComment &&
      isDef(a.data) === isDef(b.data) &&
      sameInputType(a, b)) ||
      (isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)))
  );
}
```
为什么不用index作为key? 

如下，左边是初始数据，然后我在数据前插入一个新数据，变成右边的列表。实际上每个dom结点都要更新，更新文本。深入来说是：diff中头头比较，做patchVnode更新，更新了文本。消费性能，不建议使用！
```js
<ul>                      <ul>
    <li key="0">a</li>        <li key="0">林三心</li>
    <li key="1">b</li>        <li key="1">a</li>
    <li key="2">c</li>        <li key="2">b</li>
                              <li key="3">c</li>
</ul>                     </ul>
```


## v-model原理
v-model是个语法糖: 原理是监听input事件，把当前更新的值赋给响应式数据
```js
// 相当于
v-bind:value="value"
v-on:input="e => value = e.target.value"
```

## .sync修饰符原理
Vue父子组件的<code>Prop</code>是<code>单向数据流</code>, 父级 prop 的更新会向下流动到子组件中，反之不行。因此，不能在子组件直接修改prop数据，否则会爆错。

.sync实现了prop数据双向流动。通过父组件监听@update:xxx, 子组件$emit('update:xxx', 更新的值)触发父组件事件。
```js
:xxx.sync="xxx"
// 相当于
:xxx="xxx" @update:xxx="xxx=更新的值"
```
![sync](@assets/vue/reactive/7.png)