
## BFC
BFC定义

BFC(Block formatting context)直译为"<code>块级格式化上下文</code>"。它是一个<code>独立的渲染区域</code>，只有Block-level box参与， 它规定了内部的Block-level Box如何布局，并且与这个区域外部毫不相干

### Formatting Context
Formatting context 是 W3C CSS2.1 规范中的一个概念。它是页面中的一块渲染区域，并且有一套渲染规则，它决定了其子元素将如何定位，以及和其他元素的关系和相互作用。最常见的 Formatting context 有 Block fomatting context (简称<code>BFC</code>)和 Inline formatting context (简称<code>IFC</code>)。

## BFC的布局规则
* 内部的Box会在垂直方向，一个接一个地放置。
* Box垂直方向的距离由margin决定。属于同一个BFC的两个相邻Box的margin会发生重叠。
* 每个盒子（块盒与行盒）的margin box的左边，与包含块border box的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此。
* BFC的区域不会与float box重叠。
* BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此。
* 计算BFC的高度时，浮动元素也参与计算。

## 创建BFC
有多种方式，具体见[官网](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flow_Layout/Intro_to_formatting_contexts)。下面列举几种开发中常见的
1. 使用float
2. position为 absolute/fixed/sticky
3. display的值是inline-block、table-cell、flex、table-caption或者inline-flex
4. overflow的值不是visible(overflow默认为visible)

## BFC的作用
### 利用BFC避免margin重叠
```html
<style>
  .example_1 {
      color: #f55;
      background: yellow;
      width: 200px;
      line-height: 100px;
      text-align:center;
      margin: 30px;
  }
</style>
<div>
    <p class="example_1">看看我的 margin是多少</p>
    <p class="example_1">看看我的 margin是多少</p>
</div>
```
<div>
  <p class="example_1">看看我的 margin是多少</p>
  <p class="example_1">看看我的 margin是多少</p>
</div>

会出现[margin塌陷](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing)

根据第二条，<code>属于同一个BFC的两个相邻的Box会发生margin重叠</code>，所以我们可以设置，两个不同的BFC，也就是我们可以让把第二个p用div包起来，然后激活它使其成为一个BFC
```html
<style>
  .example_2 {
      color: #f55;
      background: yellow;
      width: 200px;
      line-height: 100px;
      text-align:center;
      margin: 30px;
  }
</style>
<div>
    <p class="example_2">看看我的 margin是多少</p>
    <div style="overflow: hidden">
        <p class="example_2">看看我的 margin是多少</p>
    </div>
</div>
```
<div>
  <p class="example_2">看看我的 margin是多少</p>
  <div style="overflow: hidden">
      <p class="example_2">看看我的 margin是多少</p>
  </div>
</div>


### 自适应两栏布局
每个盒子的margin box的左边，与包含块border box的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此
```html
  .left {
      width: 100px;
      height: 150px;
      float: left;
      background: rgb(139, 214, 78);
      text-align: center;
      line-height: 150px;
      font-size: 20px;
  }

  .right {
      height: 300px;
      background: rgb(170, 54, 236);
      text-align: center;
      line-height: 300px;
      font-size: 40px;
  }
<div style="position: relative">
    <div class="left">LEFT</div>
    <div class="right">RIGHT</div>
</div>
```
<div style="position: relative">
    <div class="left">LEFT</div>
    <div class="right">RIGHT</div>
</div>
又因为<code>BFC的区域不会与float box重叠</code>, 所以我们让right单独成为一个BFC。来实现两栏布局

```html
  .left_2 {
      width: 100px;
      height: 150px;
      float: left;
      background: rgb(139, 214, 78);
      text-align: center;
      line-height: 150px;
      font-size: 20px;
  }
  .right_2 {
      overflow: hidden;
      height: 300px;
      background: rgb(170, 54, 236);
      text-align: center;
      line-height: 300px;
      font-size: 40px;
  }
<div style="position: relative">
    <div class="left_2">LEFT</div>
    <div class="right_2">RIGHT</div>
</div>
```
<div style="position: relative">
    <div class="left">LEFT</div>
    <div class="right" style="overflow: hidden">RIGHT</div>
</div>
right会自动的适应宽度，这时候就形成了一个两栏自适应的布局


### 清楚浮动
当我们不给父节点设置高度，子节点设置浮动的时候，会发生高度塌陷，这个时候我们就要清楚浮动
```html
  .parent {
      border: 5px solid rgb(91, 243, 30);
      width: 300px;
  }
  .child {
      border: 5px solid rgb(233, 250, 84);
      width:100px;
      height: 100px;
      float: left;
  }
  <div class="parent">
      <div class="child"></div>
      <div class="child"></div>
  </div>
```
<div style="height: 150px">
  <div class="parent">
      <div class="child"></div>
      <div class="child"></div>
  </div>
</div>


<code>计算BFC的高度时，浮动元素也参与计算</code>, 给父节点激活BFC
```css
  .parent {
      border: 5px solid rgb(91, 243, 30);
      width: 300px;
      overflow: hidden;
  }
```
<div class="parent" style="overflow: hidden">
    <div class="child"></div>
    <div class="child"></div>
</div>

## 总结
以上例子都体现了：

BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此。

因为BFC内部的元素和外部的元素绝对不会互相影响，因此， 当BFC外部存在浮动时，它不应该影响BFC内部Box的布局，BFC会通过变窄，而不与浮动有重叠。同样的，当BFC内部有浮动时，为了不影响外部元素的布局，BFC计算高度时会包括浮动的高度。避免margin重叠也是这样的一个道理



## 面试
问：说说你对BFC的理解？

答：BFC. 块级格式化上下文，它是一个独立的渲染区域。即区域内部元素不会影响外部元素布局，反之，外部元素也不能影响内部元素的布局。创建BFC有多种方式，如：float浮动元素, overflow不为visible；position为absolute, sticky, fixed；display为inline-block， flex 等。

开发中常用BFC来解决
* margin塌陷
* 清除浮动
* 非浮动元素覆盖浮动元素的位置 （可利用BFC使其不覆盖）



问：求背景图片左边到box盒子左边框外侧的距离?
```css
  width: 100px;
  height: 200px;
  background: pink;
  padding: 100px;
  border: 80px solid blue;
  background-image: url('~@assets/css/icon.gif');
  background-repeat: no-repeat;
  background-origin: content-box;
  background-position: -50px 0;
```

答：100 + 80 -50 = 130px
<div class="box"></div>

参考：https://blog.csdn.net/sinat_36422236/article/details/88763187

<style scoped>
.box {
  width: 100px;
  height: 200px;
  background: pink;
  padding: 100px;
  border: 80px solid blue;
  background-image: url('~@assets/css/icon.gif');
  background-repeat: no-repeat;
  background-origin: content-box;
  background-position: -50px 0;
}
.example_1 {
    color: #f55;
    background: yellow;
    width: 200px;
    line-height: 100px;
    text-align:center;
    margin: 30px;
}
.example_2 {
  overflow: hidden;
    color: #f55;
    background: yellow;
    width: 200px;
    line-height: 100px;
    text-align:center;
    margin: 30px;
}
.left {
    width: 100px;
    height: 150px;
    float: left;
    background: rgb(139, 214, 78);
    text-align: center;
    line-height: 150px;
    font-size: 20px;
}

.right {
    height: 300px;
    background: rgb(170, 54, 236);
    text-align: center;
    line-height: 300px;
    font-size: 40px;
}
.parent {
    border: 5px solid rgb(91, 243, 30);
    width: 300px;
}
.child {
    border: 5px solid rgb(233, 250, 84);
    width:100px;
    height: 100px;
    float: left;
}
</style>