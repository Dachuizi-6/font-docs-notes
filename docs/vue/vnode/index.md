## 说一下什么是Virtual DOM
Virtual DOM 是 DOM 节点在 JavaScript 中的一种抽象数据结构. 

VNode有很多个属性，比较重要的属性有：tag、data、children和context
* tag表示为元素标签的类型，例如：p、div或者ul等。
* data表示节点上的数据，包括atts、style和class等。
* children表示子节点列表，它是一个VNode实例数组。
* context当前节点所处的编译作用域
```js
<template>
  <div id="app" class="app-main">元素节点</div>
</template>
// div用vnode表示
const vnode = {
  tag: 'div',
  data: {
    attrs: {
      id: 'app'
    }
    class: 'app-main'
  },
  children: [VNode],
  context: vm
}
```

## Vue2.0引入虚拟 DOM 的目的是什么
* 解决频繁操作原生DOM产生的性能问题. 浏览器中操作DOM的代价比较昂贵，频繁操作DOM会产生性能问题, Vue 使用<code>diff算法</code>找出尽可能少的需要更新的真实DOM，从而达到提升性能的目的
* 跨平台的能力. 虚拟 DOM 是 JavaScript 对象, 而 原生DOM 是和平台(web, h5)强相关. 虚拟 DOM 可以进行更方便地跨平台操作，例如服务器渲染

