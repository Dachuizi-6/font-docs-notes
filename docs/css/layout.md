## 上下栏固定、中间自适应的布局
1. flex方案：flex-grow在放大剩余空间
<div class="box-5">
  <div class="header">header</div>
  <div class="contain-5">contain-5</div>
  <div class="footer">footer</div>
</div>

2. float+margin方案

3. position方案

## 左右固定，中间自适应
1. flex方案：flex-grow默认为0，即即如果存在剩余空间，也不放大；如果所有项目的flex-grow属性都为1，则它们将等分剩余空间（如果有的话）
<div class="box-1">
  <div class="left">left</div>
  <div class="contain">contain</div>
  <div class="right">right</div>
</div>

2. float方案+margin方案
```js
// 注意标签的顺序
<div class="box-2">
  <div class="left-2">left</div>
  <div class="right-2">right</div>
  <div class="contain-2">contain</div>
</div>
```
<div class="box-2">
  <div class="left-2">left</div>
  <div class="right-2">right</div>
  <div class="contain-2">contain</div>
</div>

3. float方案+BFC方案

原理：BFC的区域不会与float box重叠
<div class="box-2">
  <div class="left-2">left</div>
  <div class="right-2">right</div>
  <div class="contain-3">contain</div>
</div>

4. position方案
<div class="box-4">
  <div class="left-4">left</div>
  <div class="contain-4">contain</div>
  <div class="right-4">right</div>
</div>

<style scoped>
.box-1 {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: space-between;
  border: 1px solid red;
}
.left {
  width: 100px;
}
.contain {
  flex-grow: 1;
  border: 1px solid green;
}
.right {
  width: 100px;
}

.box-2 {
  width: 100%;
  height: 400px;
  border: 1px solid red;
}
.left-2 {
  float: left;
  width: 100px;
  height: 100%;
}
.contain-2 {
  margin: 0 100px 0 100px;
  border: 1px solid green;
  height: 100%;
}
.right-2 {
  float: right;
  width: 100px;
  height: 100%;
}
.contain-3 {
  overflow: hidden;
  border: 1px solid green;
  height: 100%;
}

.box-4 {
  width: 100%;
  height: 400px;
  border: 1px solid red;
  position: relative;
}
.left-4 {
  position: absolute;
  left: 0;
  top: 0;
  width: 100px;
  height: 100%;
}
.contain-4 {
  margin: 0 100px 0 100px;
  border: 1px solid green;
  height: 100%;
}
.right-4 {
  position: absolute;
  right: 0;
  top: 0;
  width: 100px;
  height: 100%;
}

.box-5 {
  width: 100%;
  height: 400px;
  display: flex;
  flex-direction: column;
  border: 1px solid red;
}
.header {
  height: 100px;
}
.contain-5 {
  flex-grow: 1;
  border: 1px solid green;
}
.footer {
  height: 100px;
}
</style>