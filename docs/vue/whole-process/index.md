## 说说对Vue生命周期的理解？
```js
Vue.prototype._init = function() {
  // ...
  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm)
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')
  // ...
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```
1. new Vue()。实例化Vue对象，实例化Vue对象时，会执行Vue构造函数的原型的_init方法，生命周期核心流程封装在这个方法中。
2. 在执行beforeCreate钩子之前做三件事
* initLifecycle初始化生命周期，会把vm._watcher=null, vm.$refs={}等做初始化；
* initEvents事件初始化，会把vm._events初始化为空对象Object.create(null)；
* initRender渲染初始化，会给vm组件实例绑定vm.$createElement函数，用来返回Vnode，也会给vm添加$attrs和$listeners(二次封装组件时，可以直接继承属性和方法)
3. 执行完beforeCreate钩子后做了两件事
* initInjections。把inject注入的数据转成result对象，再遍历result对象给vm添加响应式属性
* initState。做props, methods， data等初始化工作。把data中的数据做响应式
4. 执行created钩子。执行完create钩子后，最主要的处理是拿到render函数
* 如果实例化Vue时没有传render函数，就得把tempalte转成render函数。会经历模版编译的过程：模牍转AST树 --> 标记静态节点 --> 生成render函数
5. 执行beforeMount钩子。执行beforeMount钩子后，实例化渲染watcher，实例化watcher会执行回调，回调又执行_patch。第一次执行_patch, 会通过render生成真实的dom结点，插入到document，再把旧的$el结点删除
6. 实例化渲染watcher后，把vm._isMounted=true并执行mounted钩子
7. 在mounted到beforeDestory之间，如果响应式数据有变化，会用queue队列收集watcher，在nextTick循环执行watcher.before和watcher.run。渲染watcher会执行watcher.before, 渲染watcher.before中，会执行<code>beforeUpdate</code>钩子; 渲染watcher.run会执行_patch，做re-render更新。遍历queue队列，如果找到watcher是渲染watcher并且vm._isMounted=true，则执行updated钩子
8. 当vm.$destroy()执行时(比如keep-alive超过缓存数限制，LRU策略会将第一个删除，删除实际上就是执行vm.$destroy)，会先执行beforeDestroy钩子。
* 在beforeDestroy到destroyed之间，会遍历vm._watcher数组，每个watcher都执行teardown。teardown是把watcher从vm.watcher数组中移出，并查找所有的dep队列，把dep队列中的watcher移出
9. 最后执行destroyed钩子，再执行vm.$off()，把vm对象的监听事件移除

<img src="@assets/vue/whole-process/1.png" style="width: 60%" />


### provide/inject
[provide/inject](https://cn.vuejs.org/v2/api/#provide-inject)
```js
export function initInjections (vm: Component) {
  // 把inject注入的数据转成result对象
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        // 给vm添加响应式属性
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
            `overwritten whenever the provided component re-renders. ` +
            `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}
```

## 渲染过程
<strong>下面的代码非常核心！！</strong>

拿到render函数，再实例化渲染watcher(vm._watcher就是组件的渲染watcher)。渲染watcher的回调是_patch。具体分析见[_patch](https://github.com/Cosen95/blog/issues/31), 第一次patch，通过render生成真实的dom结点，插入到document，再把旧的$el结点删除
```js
// src/platforms/web/runtime/index.js
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}

//  src/platforms/web/entry-runtime-with-compiler.js
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)
  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    if (template) {
      // ...
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns
    }
  }
  return mount.call(this, el, hydrating)
}

// src/core/instance/lifecycle.js 
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    // ...
  }
  callHook(vm, 'beforeMount')

  let updateComponent
  // ...
  updateComponent = () => {
    vm._update(vm._render(), hydrating)
  }


  // 每个vm组件都有一个渲染watcher。实例化watcher时，会执行updateComponent
  new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

## beforeUpdate和updated
在执行watcher时，如果存在watcher.before，会先执行watcher.before，渲染watcher.before中，会执行beforeUpdate钩子
```js
function flushSchedulerQueue () {
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    watcher.run()
  }
  const updatedQueue = queue.slice()
  callUpdatedHooks(updatedQueue)
}

function callUpdatedHooks (queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}
```

## $destroy和teardown
$destroy会遍历vm._watcher数组，每个watcher都执行teardown。teardown是把watcher从vm.watcher数组中移出，并查找所有的dep队列，把dep队列中的watcher移出
```js
// src/core/instance/lifecycle.js
Vue.prototype.$destroy = function () {
  const vm: Component = this
  callHook(vm, 'beforeDestroy')
  vm._isBeingDestroyed = true
  // teardown watchers
  if (vm._watcher) {
    vm._watcher.teardown()
  }
  let i = vm._watchers.length
  while (i--) {
    vm._watchers[i].teardown()
  }
  // call the last hook...
  vm._isDestroyed = true
  // fire destroyed hook
  callHook(vm, 'destroyed')
  // turn off all instance listeners.
  vm.$off()
}

// src/core/observer/watcher.js
teardown () {
  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove(this.vm._watchers, this)
    }
    let i = this.deps.length
    while (i--) {
      this.deps[i].removeSub(this)
    }
    this.active = false
  }
}
```

## 父组件和子组件的执行顺序？
父beforeCreate-> 父created -> 父beforeMounte -> 子beforeCreate ->子create ->子beforeMount ->子 mounted -> 父mounted

子组件更新：父beforeUpdate->子beforeUpdate->子updated->父updated

父组件更新过程：父beforeUpdate->父updated

销毁：父beforeDestroy->子beforeDestroy->子destroyed->父destroyed