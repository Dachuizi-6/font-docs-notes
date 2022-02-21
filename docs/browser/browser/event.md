## 事件流

### 事件捕获

事件捕获 是 <strong>由外到内的</strong>

![capture](@assets/browser/browser/25.png)

### 事件冒泡

事件捕获 是 <strong>由内到外的</strong>

![bubble](@assets/browser/browser/26.png)

DOM2 Events 规范规定事件流分为 3 个阶段: <code>事件捕获</code>、<code>到达目标</code> 和 <code>事件冒泡</code>
![event](@assets/browser/browser/27.png)

## 事件处理

### DOM0 事件处理

- 事件处理函数中的<code>this</code>指向事件的目标元素
- 一个元素有多个<code>DOM0</code>事件,则后面的覆盖前面的，最终只执行最后一个<code>DOM0</code>事件

```js
const btn = document.getElementById("zcl");
btn.onclick = function () {
  console.log(this); // this 指向btn
  console.log("Clicked");
};
// 移除事件
btn.onclick = null;
```

### DOM2 事件处理

通过[addEventListener](https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener)、<code>removeEventListener</code>来添加和移除事件。

```js
target.addEventListener(type, listener, options);
target.addEventListener(type, listener, useCapture);
```

addEventListener 我们是比较熟悉了，之前[手写事件委托](../../basic/code_write/event_delegation.md)等早已写过。这里注意 第三个参数 可以是一个 option 对象或一个布尔值<code>useCapture</code>。 useCapture 参数指定了该事件处理程序触发的 “时机” ：是在事件流的捕获阶段还是冒泡阶段

- true：表示在捕获阶段调用事件处理程序
- false： （默认值）表示在冒泡阶段调用事件处理程序

## 事件对象

1. [event.preventDefault](https://developer.mozilla.org/zh-CN/docs/Web/API/Event/preventDefault): 阻止事件的默认行为. eg: 选中复选框是点击复选框的默认行为

```js
document.querySelector("#id-checkbox").addEventListener(
  "click",
  function (event) {
    document.getElementById("output-box").innerHTML +=
      "Sorry! <code>preventDefault()</code> won't let you check this!<br>";
    event.preventDefault();
  },
  false
);
```

<p>Please click on the checkbox control.</p>
<form>
  <label for="id-checkbox">Checkbox:</label>
  <input type="checkbox" id="id-checkbox"/>
</form>
<div id="output-box"></div>

2. [event.stopPropagation](https://developer.mozilla.org/zh-CN/docs/Web/API/Event/preventDefault): 阻止事件流在 DOM 中的传播，取消后续的事件捕获或冒泡

```js
var div = document.querySelector("#div");
div.addEventListener(
  "click",
  (e) => {
    console.log("clicked");
    e.stopPropagation();
  },
  false
);
document.body.addEventListener(
  "click",
  () => {
    console.log("body clicked");
  },
  false
);
// clicked  如果不调用 stopPropagation() 那么点击 div 会有两个 log 记录
```

3. event.target & event.currentTarget
   [手写事件委托](../../basic/code_write/event_delegation.md)中，用的是<code>event.target</code>, 不用 event.currentTarget! 看下面就知道为啥了 hh

- event.target: 指向触发事件的元素。event.target 是事件的真正发出者
- event.current: 指向事件绑定的元素。vent.currentTarget 始终是监听事件者

```js
<div id="a">
  <div id="b">
    <div id="c">
      <div id="d"></div>
    </div>
  </div>
</div>
<script>
  document.getElementById('a').addEventListener('click', function(e) {
    console.log(
      'target:' + e.target.id + '&currentTarget:' + e.currentTarget.id
    )
  })
  document.getElementById('b').addEventListener('click', function(e) {
    console.log(
      'target:' + e.target.id + '&currentTarget:' + e.currentTarget.id
    )
  })
  document.getElementById('c').addEventListener('click', function(e) {
    console.log(
      'target:' + e.target.id + '&currentTarget:' + e.currentTarget.id
    )
  })
  document.getElementById('d').addEventListener('click', function(e) {
    console.log(
      'target:' + e.target.id + '&currentTarget:' + e.currentTarget.id
    )
  })
</script>
```

<img src="@assets/browser/browser/28.png" style="width: 80%">
<!-- ![event_target](@assets/browser/browser/28.png) -->

当我们点击最里层的元素 d 的时候，会依次输出:

```js
target:d&currentTarget:d
target:d&currentTarget:c
target:d&currentTarget:b
target:d&currentTarget:a
```

## 面试

浏览器的事件模型/机制，关键词：<code>事件捕获</code>、<code>事件冒泡</code>、<code>DOM0 事件</code>、<code>DOM2 事件</code>。理解上还是很容易的，下面来做道题

```js
<div>
  <button>123</button>
</div>;
btn.addEventListener(
  "click",
  (e) => {
    console.log("btn click capture ");
  },
  true
);

btn.addEventListener("click", (e) => {
  console.log("btn click bubble ");
});

body.addEventListener(
  "click",
  (e) => {
    console.log("body click capture");
  },
  true
);

body.addEventListener("click", (e) => {
  console.log("body click bubble");
});
```

问：打印输出啥？

答：body click capture -> btn click capture -> btn click bubble -> body click bubble

参考:
[深入理解浏览器的事件机制](https://juejin.cn/post/6914600144621027336)
[DOM 事件机制](https://segmentfault.com/a/1190000017259386)
[【前端词典】滚动穿透问题的解决方案](https://juejin.cn/post/6844903753380806669#heading-4)

```js
<script>
  window.onload = function() {
    document.querySelector("#id-checkbox").addEventListener("click", function(event) {
      document.getElementById("output-box").innerHTML += "Sorry! <code>preventDefault()</code> won't let you check this!<br>";
      event.preventDefault();
    }, false);
  }
</script>
<style scoped>
img {
  width: 500px
}
</style>

```
