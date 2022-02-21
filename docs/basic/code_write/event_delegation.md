:::warning
点击li，alert出当前li的内容
:::
```html
<ul id="test">
  <li>1</li>
  <li>2</li>
  <li>3</li>
  <li>4</li>
</ul>
```
答：
```js
const container = document.getElementById('test')
container.addEventListener('click', (e) => {
  console.log(e.target.innerText)
})
```

:::warning
点击li，alert出当前li的索引
:::

答：
```js
const container = document.getElementById('test')
const list = [...container.children] // 或：document.getElementsByTagName('li')
container.addEventListener('click', e => {
  console.log(list.indexOf(e.target))
})
```

知识点：<code>addEventListener</code>, <code>e.target</code>是点击的元素，<code>getElementById</code>, <code>getElementsByTagName</code>. 代码一看就会，不会要手写的话，还是得提前练练手，记下单词:cry:

<ul id="test">
  <li>1</li>
  <li>2</li>
  <li>3</li>
  <li>4</li>
  <li>5</li>
  <li>6</li>
</ul>


















<!-- 答：
```js
const ulDom = document.getElementById('test')
ulDom.addEventListener('click', function(e) {
  alert(e.target.innerText)
})
// ulDom.onclick = function(e) {
//   console.log(e, e.target, e.target.innerText)
//   alert(e.target.innerText)
// }
``` -->

<!-- ```js
const ulDom = document.getElementById('test')
ulDom.addEventListener('click', function(e) {
  const liLists = [...document.getElementsByTagName('li')]
  alert(liLists.indexOf(e.target))
})
``` -->
