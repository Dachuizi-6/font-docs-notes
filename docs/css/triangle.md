## 纯CSS画三角形

* 写一个border, 加大border的值。此时border 渲染成梯形的，相邻边框连接处 均分
```css
  width: 100px;
  height: 100px;
  border: 30px solid;
  border-color: #1b93fb #1bfb24 #efad48 #ef4848
```
<div class="triangle"></div>


* 增大border，且将盒子的width、height 置为 0. 此时渲染成 4个三角形拼合成的 矩形
<div class="triangle2"></div>
```css
  width: 0;
  height: 0;
  border: 50px solid;
  border-color: #1b93fb #1bfb24 #efad48 #ef4848
```


* 设置透明, 隐藏其中三个三角形
<div class="triangle3"></div>
```css
  width: 0;
  height: 0;
  border: 50px solid transparent;
  border-bottom: 50px solid red
  /* border: 50px solid;
  border-color: transparent transparent #efad48 transparent */
```

## 面试
问：纯 CSS 画一个三角形的原理是什么

答：利用border 相邻边框连接处的均分原理

<style scoped>
.triangle {
  width: 100px;
  height: 100px;
  border: 30px solid;
  border-color: #1b93fb #1bfb24 #efad48 #ef4848
}

.triangle2 {
  width: 0;
  height: 0;
  border: 50px solid;
  border-color: #1b93fb #1bfb24 #efad48 #ef4848
}

.triangle3 {
  width: 0;
  height: 0;
  border: 50px solid transparent;
  border-bottom: 50px solid red
}
</style>