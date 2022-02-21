## 盒子模型
* 标准盒子：box-sizing: current-box. 盒子真实宽/高：margin + border + padding + content
![current-box](@assets/css/1.jpg)
```css
.currentBox {
  display: inline-block;
  width: 200px;
  height: 200px;
  border: 1px solid red;
  padding: 10px;
  margin: 20px;
  background: yellow
}
```
此时盒子真实的宽度/高度：40 + 2 + 20 + 200 = 262px
<div class="box">
  <div class="currentBox"></div>
  <div class="test-box">
    width: 262px; background: red; height: 262px
  </div>
</div>


* 怪异盒子：box-sizing: border-box. 盒子真实宽/高：margin + content. content是css中盒子写的width/height，包括了border、padding
![border-box](@assets/css/2.jpg)
```css
.currentBox {
  display: inline-block;
  box-sizing: border-box;
  width: 200px;
  height: 200px;
  border: 1px solid red;
  padding: 10px;
  margin: 20px;
  background: yellow
}
```
此时盒子真实的宽度/高度：40 + 200 = 240px
<div class="box">
  <div class="borderBox"></div>
  <div class="test-box2">
    width: 240px;height: 240px; background: red;
  </div>
</div>

## 总结
盒子模型 分为 标准盒子模型，box-sizing: current-box; 怪异盒子模型，box-sizing: border-box

标准盒子 的真实宽/高：margin + border + padding + content
怪异盒子 的真实宽/高：margin + content. content 包括 padding和border


<style scoped>
.box {
  display: flex;
  justify-content: center;
}
.currentBox {
  display: inline-block;
  width: 200px;
  height: 200px;
  border: 1px solid red;
  padding: 10px;
  margin: 20px;
  background: yellow
}
.borderBox {
  display: inline-block;
  box-sizing: border-box;
  width: 200px;
  height: 200px;
  border: 1px solid red;
  padding: 10px;
  margin: 20px;
  background: yellow
}
.test-box {
  width: 262px;
  height: 262px;
  background: yellow;
}
.test-box2 {
  width: 240px;
  height: 240px;
  background: yellow;
}
</style>