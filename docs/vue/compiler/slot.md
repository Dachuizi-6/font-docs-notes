## slot是什么？
slot，也称插槽。子组件暴露的一个让父组件传入自定义内容的接口

## 有什么作用？
拓展组件，更好地<code>复用组件</code>和对其做<code>定制化处理</code>。
slot的用法可以分为三类:
* 默认插槽
* 具名插槽
* 作用域插槽: 可以是匿名插槽，也可以是具名插槽，该插槽的不同点是在子组件渲染作用域插槽时，可以将子组件内部的数据传递给父组件，让父组件根据子组件的传递过来的数据决定如何渲染该插槽

```html
<child>
  <!-- 默认插槽 -->
  <div>默认插槽</div>  
  <!-- 具名插槽 -->
  <template #header>
    <div>具名插槽header</div>
  </template>
  <!-- 作用域插槽 -->
  <!-- <template #footer="slotProps" >
    <div>
      {{slotProps.testProps}}
    </div>
  </template> -->
  <!-- 解构插槽Props -->
  <template #footer="{ testProps, otherProps = 'zcl' }" >
    <div>
      {{testProps}} --- {{otherProps}}
    </div>
  </template>
</child>

Vue.component('child', {
data: function() {
  return {}
},
template: `<div>
  <main>
      <slot>
        <h3>没传内容</h3>
      </slot>
  </main>
  <header>
      <slot name="header">
        <h3>没传header插槽</h3>
      </slot>
  </header>
  <footer>
      <slot name="footer" testProps="子组件的值">
        <h3>没传footer插槽</h3>
      </slot>
  </footer>
</div>`
})
const vue = new Vue({
el: '#app'
})
```
![slot](@assets/vue/compiler/2.png)

::: tip
v-slot 只能添加在 \<template\> 上 (只有一种例外情况)

父级模板里的所有内容都是在父级作用域中编译的；子模板里的所有内容都是在子作用域中编译的。
:::

## 默认插槽
以默认插槽为例：
```js
// 父组件
<div>
  <test>插入slot中</test>
</div>
// 子组件test
<main>
  我在子组件里面
  <slot></slot>
</main>
```
1. 父组件解析
把 test 当做子元素处理，把 插槽内容当做 test 的子元素处理，生成AST如下：
```js
{    
  tag: "div",    
  children: [{        
    tag: "test",        
    children: ['插入slot 中'] // '插入slot 中' 为插槽节点
  }]
}
```
2. 子组件解析
slot 作为一个占位符，会被解析成一个函数
```js
{    
  tag: "main",    
  children: [
    '我在子组件里面',
    _t('default') // 由于举例是默认插槽，故为default。如果是具名插槽，参数名为插槽名
  ]
}
```
* 解析 test 组件时，使用 _init 方法初始化 test 组件的实例:
```js
Vue.prototype._init = function(options) {    
  var vm = this;
  // 如果是组件
  if (options && options._isComponent) {
    initInternalComponent(vm, options);
  }
  initRender(vm);
}
```
* initInternalComponent 把 父组件中的 插槽节点 <code>插入slot中</code> 传给子组件选项的 <code>_renderChildren</code> 中
```js
function initInternalComponent(vm, options) {    
  // 这个options是全局选项和组件设置选项的合集
  var opts = vm.$options =  Object.create(vm.constructor.options);  
  var componentOptions = parentVnode.componentOptions;
  // 传给组件选项_renderChildren
  opts._renderChildren = componentOptions.children;
}
```
* initRender 把上一步保存在 组件选项的<code>_renderChildren</code>放在实例的<code>vm.$slot</code>中
```js
function initRender(vm) {    
    var options = vm.$options;
    // 保存给组件实例上
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
}
function resolveSlots(children, context) {    
    var slots = {};    
    for (var i = 0,l = children.length; i < l; i++) {        
        var child = children[i];        
        var data = child.data;    
        if (如果是具名slot) {} 
        else { 
            (slots.default || (slots.default = [])).push(child);
        }
    }    
    return slots
}
```
经过上面的处理，插槽节点 转存到 子组件test的实例上
```js
testVm.$slot={ 
    default: ['插入slot 中'] 
}
```

3. 执行<code>_t 函数</code>
作用是把父组件解析得到的插槽节点拿到，然后返回给子组件。怎么拿到父组件的插槽节点的？ 后面会说
```js
{
  tag: "main",    
  children: ['我在子组件里面','插入slot 中']
}
```
_t 是 <code>renderSlot</code> 函数，Vue 会给每个实例都保存一个 _t , 作用是返回实例上$slot 保存的对应的<code>插槽节点</code>
```js
function renderSlot(name) {    
  return this.$slots[name]
}
```

## 总结
![默认插槽](@assets/vue/compiler/3.png)

## 作用域插槽
```html
// 父组件
<div>
  <test>
    <template #default="{ slotProps }">
    插入slot中
  </test>
</div>

// 子组件test
<main>
  我在子组件里面
  <slot :child="child"></slot>
</main>
// 子组件数据
data() {
  return { child: 11 }
}
```
1. 父组件解析
把 test 当做子元素处理，把 插槽内容 封装成一个函数，生成AST如下：
```js
{
  tag: "div",    
  children: [{        
    tag: "test"
    scopeSlots:{            
      default(slotProps){ // 函数名 为 插槽名         
        return ['插入slot 中' + slotProps]
      }
    }
  }]
}
```
2. 子组件解析
slot 作为一个占位符，会被解析成一个函数
```js
{    
  tag: "main",    
  children: [
    '我在子组件里面',
    _t('default', {child:11})
  ]
}
```
* 子组件test在初始化的过程中，会把 父组件 节点上的 $scopedSlots 另存为到子组件实例上
```js
// 这个函数作用是，执行渲染函数，得到组件节点
Vue.prototype._render = function() {    
    var vm = this;    
    var ref = vm.$options;
    // _parentVnode 就是外壳节点
    var _parentVnode = ref._parentVnode; 
    if (_parentVnode) {
        vm.$scopedSlots = _parentVnode.data.scopedSlots || {};
    }
    // ...省略N多执行渲染函数的代码
    vm.$vnode = _parentVnode;    
    return vnode
};
```

3. 执行<code>_t 函数</code>
 _t 函数，和普通插槽 的一样，但会多传了一个参数 { child:11 }。为什么会多一个参数，是因为这是一个作用域插槽，这个参数就是子组件传给插槽的数据。

 执行<code>_t 函数</code>，传入两个参数，<code>插槽名</code> 和 <code>参数{ child: 11 }</code>, 返回解析后的插槽节点，于是子组件插槽就完成替换 slot 占位符了。
```js
{    
  tag: "main",    
  children: [
    '我在子组件里面',
    _t('default',{child:11})
  ]
}
// 变成下面这样
{    
  tag: "main",    
  children: [
    '我在子组件里面', 
    '插入slot 中 {child:11}'
  ]
}
```
_t 是 <code>renderSlot</code> 函数。实际上 renderSlot 会兼容处理 作用域Slot 和普通Slot
```js
function renderSlot(name, fallback, props) {   
    // 看了上面，所以可以从实例上获取$scopedSlots
    var scopedSlotFn = this.$scopedSlots[name];   
    var nodes;    
    if (scopedSlotFn) {
        props = props || {};
        // 开始执行插槽函数
        nodes = scopedSlotFn(props);
    }    
    return nodes
}
```
执行renderSlot会直接返回父组件的插槽节点，直接替换子组件 slot 占位符

## 总结
![作用域插槽](@assets/vue/compiler/4.png)

## 面试
问：slot原理是什么？

答：slot有三种，默认插槽，具名插槽，作用域插槽。
插槽的作用 子组件暴露的一个让父组件传入自定义内容的接口，让子组件 变得可复用，有拓展性。<code>本质上是 子组件获取 父组件是插槽节点，然后替换子组件的 slot 占位符</code>
* 默认插槽和具名插槽的原理：
子组件实例化时，获取到父组件的插槽节点，并存放在子组件<code>vm.$slot</code>中，然后子组件模版编译时，执行renderSlot，通过vm.$slot.xxx(xxx为插槽名)获取插槽节点，再替换子组件 slot 占位符
* 作用域插槽原理：
子组件实例化时，获取到父组件的插槽节点（封装成函数），并存放在子组件<code>vm.$scopedSlots</code>中，然后子组件模版编译时，执行renderSlot，从vm.$scopedSlots对象中获取对应的插槽函数，执行插槽函数，会返回插槽节点，再替换子组件 slot 占位符