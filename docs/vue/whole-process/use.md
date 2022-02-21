## 用法

在使用Vue开发应用程序的时候，我们经常使用第三方插件库来方便我们开发，例如：Vue-Router、Vuex和element-ui等等。
```js
// main.js
import Vue from 'vue'
import Router from 'vue-router'
import Vuex from 'vuex'
import ElementUI from 'element-ui'

Vue.use(Router)
Vue.use(Vuex)
Vue.use(ElementUI)
new Vue({})
```

在new Vue之前，我们使用Vue.use方法来注册这些插件。其中，Vue.use作为一个全局方法，它是在initGlobalAPI方法内部通过调用initUse来注册这个全局方法的。
```js
import { initUse } from './use'
export function initGlobalAPI (Vue: GlobalAPI) {
  // ...省略代码
  initUse(Vue)
  // ...省略代码
}
```
## 源码解析
initUse方法的代码并不复杂，如下：
```js
import { toArray } from '../util/index'
export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 1.检测是否已经注册了插件
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

   // 2.处理参数
    const args = toArray(arguments, 1)
    args.unshift(this)

    // 3.调用install方法
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
```
我们可以从以上代码中看出，当调用Vue.use时，它只要做三件事情：<code>检查插件是否重复注册</code>、<code>处理插件参数</code>和<code>调用插件的install方法</code>。

<strong>代码分析：</strong>

* 检查插件是否重复注册：首先通过判断大Vue上的<code>_installedPlugins</code>属性是否已经存在当前插件，如果已经存在则直接返回；如果不存在才会执行后面的逻辑，假如我们有如下案例：
```js
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
Vue.use(Router)
```
<strong>多次调用Vue.use()方法注册同一个组件，只有第一个生效。</strong>

* 处理插件参数：有些插件在注册的时候，可能需要我们额外的传递一些参数，例如element-ui。
```js
import Vue from 'vue'
import ElementUI from 'element-ui'
Vue.use(ElementUI, { 
  size: 'small',
  zIndex: 3000
})
```
按照上面的例子，Vue.use()方法的arguments数组的第一项为我们传递的插件，剩下的参数才是我们需要的，因此通过<code>toArray</code>方法把arguments类数组转成一个真正的数组。注意，此时args变量不包含插件这个元素，<strong>随后再把当前this也就是大Vue也传递进数组中。</strong>
```js
// args参数。也是插件内的install方法的参数
const args = ['Vue', { size: 'small', zIndex: 3000}]
```

* 调用插件的install方法：从[官网](https://cn.vuejs.org/v2/guide/plugins.html)我们知道，如果我们在开发一个Vue插件，必须为这个插件<code>提供一个install方法</code>，当<strong>调用Vue.use()方法的时候会自动调用此插件的install方法</strong>，并把第二步处理好的参数传递进去。假如，我们有如下插件代码：
```js
// plugins.js
const plugin = {
  // install 第一个参数为Vue，因为第二步参数处理的时候args.unshift(this)
  install (Vue, options) {
    console.log(options) // {msg: 'test use plugin'}
    // 其它逻辑
  }
}
// main.js
import Vue from 'vue'
import MyPlugin from './plugins.js'
Vue.use(MyPlugin, { msg: 'test use plugin' })
```
在install方法中，我们成功获取到了大Vue构造函数以及我们传递的参数，在随后我们就可以做一些其它事情，例如：注册公共组件、注册指令、添加公共方法以及全局Mixin混入等等。

## 面试
问：Vue的插件机制？或者 Vue.use的原理？

答：Vue通过Vue.use('插件名', {})来注册插件。注册插件在 new Vue({}) 实例化之前。Vue.use做了三件事
1. 检查插件是否已注册。Vue._installedPlugins 属性保存着已注册的插件名。插件未注册才会进行注册，不会重复多次注册
2. 参数处理。获取Vue.use的第二个参数options，再在数组中把Vue放在第一个的位置。
3. 调用插件抛出的 install 方法。install方法第一个参数是Vue，第二个是插件的options参数。install方法内可进行公共组件注册，指令注册等