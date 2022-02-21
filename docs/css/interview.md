## CSS画0.5px 细线
![1px](@assets/css/3.png)

Chrome把0.5px四舍五入变成了1px。用scale缩放来画0.5px
```css
  .line {
    height: 0.5px;
    width: 200px;
    background: red;
  }
```

<div class="line"></div>

```css
  .line {
    height: 1px;
    width: 200px;
    background: red;
    transform: scaleY(0.5)
  }
```
<div class="line_2"></div>


## 单行／多行文本溢出的省略

<code>英文单词和数字css处理不换行</code>

* 强制不换行: p { white-space:nowrap; }
* 自动换行: p { word-wrap:break-word; }
* 强制英文单词断行: p { word-break:break-all; }

1. 单行文本溢出省略号
```css
  white-sapce: nowrap; /* 强制不换行 */
  overflow: hidden; /* 超出宽度则隐藏 */
  text-overflow: ellipsis; /* 当文本溢出时，显示省略符号来代表被修剪的文本 */
```
<div class="one-line">
qweqweqweqweqweqwefdafdfds来了fsdfffffffdfdfdfdfdfdfdfdffffffffffffffffffddddddddddfffdfdfdfdfeqweqweqweqweqweqweqweqweqweqweqweqw
</div>

2. 两行文本溢出省略号
```css
  display: -webkit-box; /* 将对象作为弹性伸缩盒子模型显示 */
  -webkit-line-clamp: 2; /* 结合上面两个属性，表示显示的行数 */
  -webkit-box-orient: vertical;
  word-break:break-all; /* 强制换行 */
  overflow: hidden;
  text-overflow: ellipsis;
```
<div class="multy-line">
qweqweqwfdfffffdf霏霏eqw我eqweqwefdafdfds来了fsdfffffffdfdfdfdfdfdfdfdffffffffffffffffffdd震ddddddddfffdfdfdfdfeqweqweqweqweqweqweqweqweqweqweqweqw
</div>

## 图片自适应
```css
  width: 100%;
  height: 100%;
  object-fit: contain;
```
<div class="my-img-box">
  <img class="my-img" src="@assets/common/1.jpg" />
</div>

图片自适应，一般都会用background-size:cover/contain，但是这个只适用于背景图。

img有个属性object-fit：fill / contain / cover / none / scale-down;
* fill: 默认值。内容拉伸填满整个content box, 不保证保持原有的比例。
* contain: <code>保持原有尺寸比例。长度和高度中长的那条边跟容器大小一致，短的那条等比缩放，可能会有留白</code>。
* cover: 保持原有尺寸比例。宽度和高度中短的那条边跟容器大小一致，长的那条等比缩放。可能会有部分区域不可见。


<style scoped>
  .line {
    height: 0.5px;
    width: 200px;
    background: red;
  }
  .line_2 {
    height: 1px;
    width: 200px;
    background: red;
    transform: scaleY(0.5)
  }
  .one-line {
    width: 100px;
    border: 1px solid red;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .multy-line {
    width: 100px;
    border: 1px solid red;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    word-break:break-all;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .my-img-box {
    width: 200px;
    height: 200px;
    border: 1px solid red;
  }
  .my-img {
    max-width: 100%!important;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>