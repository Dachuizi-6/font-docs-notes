## 面试
问：写出 div 水平垂直居中 的几种方式？

## flex方法
```css
display: flex;
justify-content: center;
align-items: center;
```
<div class="out-box">
  <div class="inner-box"></div>
</div>


## transform + 绝对定位
```css
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%)
```
<div class="out-box2">
  <div class="inner-box2"></div>
</div>

## 负margin + 绝对定位
```css
.outer {
   position: relative;
}
.inner {
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -50px;
  margin-top: -50px;
}
```
注意：此方法 需要知道 居中元素的 宽高
<div class="out-box3">
  <div class="inner-box3"></div>
</div>


## calc + 绝对定位
```css
  position: absolute;
  left: calc(50% - 50px);
  top: calc(50% - 50px);
```
注意：此方法 需要知道 居中元素的 宽高
<div class="out-box4">
  <div class="inner-box4"></div>
</div>


## margin: auto + 绝对定位
```css
position: absolute;
left: 0;
right: 0;
top: 0;
bottom: 0;
margin: auto;
```
原理：
如果 left、right 和 width 都设置了具体值，并且没有占满横向空间，那么剩余空间就处于待分配状态，此时设置 margin: auto; 意味着把剩余的空间分配给 margin，并且左右均分，所以就实现了水平居中，垂直方向同理
* left: 0; right: 0; 相当于 width: 100%;
* top: 0; bottom: 0; 相当于 height: 100%;
<div class="out-box5">
  <div class="inner-box5"></div>
</div>

## table-cell
<code>table-cell + vertical-align</code> 实现 垂直居中. 
缺点：需要在外层div，设置width.
```css
.out-box6 {
  display: table-cell;
  vertical-align: middle;
  height: 200px;
  width: 500px;
  border: 1px solid red;
}
.inner-box6 {
  width: 100px;
  height: 100px;
  margin: 0 auto;
  border: 1px solid yellow;
}
```
<div class="out-box6">
  <div class="inner-box6"></div>
</div>

<style scoped>
.out-box {
  height: 200px;
  border: 1px solid red;
  display: flex;
  justify-content: center;
  align-items: center;
}
.inner-box {
  width: 100px;
  height: 100px;
  border: 1px solid yellow;
}
.out-box2 {
  position: relative;
  height: 200px;
  border: 1px solid red;
}
.inner-box2 {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 1px solid yellow;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%)
}
.out-box3 {
  position: relative;
  height: 200px;
  border: 1px solid red;
}
.inner-box3 {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 1px solid yellow;
  top: 50%;
  left: 50%;
  margin-left: -50px;
  margin-top: -50px;
}
.out-box4 {
  position: relative;
  height: 200px;
  border: 1px solid red;
}
.inner-box4 {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 1px solid yellow;
  top: calc(50% - 50px);
  left: calc(50% - 50px)
}
.out-box5 {
  position: relative;
  height: 200px;
  border: 1px solid red;
}
.inner-box5 {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 1px solid yellow;
  margin: auto;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.out-box6 {
  display: table-cell;
  vertical-align: middle;
  height: 200px;
  width: 500px;
  border: 1px solid red;
}
.inner-box6 {
  width: 100px;
  height: 100px;
  margin: 0 auto;
  border: 1px solid yellow;
}
</style>


参考：https://liuyib.github.io/2020/04/07/css-h-and-v-center/#%E6%B0%B4%E5%B9%B3%E5%B1%85%E4%B8%AD