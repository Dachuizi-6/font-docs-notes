## em 是什么 
em作为font-size的单位时，其代表父元素的字体font-size大小

em作为其他属性单位时，代表自身字体大小——MDN
* 优点：比写死px好。改动父元素的字体大小，子元素会等比例变化
* 缺点：牵一发而动全身，一旦某个节点的字体大小发生变化，那么其后代元素都得重新计算

## rem 是什么
W3C 对 rem 的定义： font-size of the root element。

原理：1 rem 等于 根元素font-seize大小；可以通过lib-flexible监测屏幕大小来线性改变html根结点的font-size，从而实现等比缩放的效果。



## 面试

问：说下rem原理

答：1 rem 等于 根元素font-seize大小；通过lib-flexible监测屏幕大小来线性改变html根结点的font-size，从而实现等比缩放的效果。可以直接在代码写px, 通过px2rem-loader把px转成rem

问：如下，问s1、s2、s5、s6的font-size和line-height分别是多少px，先来想一想，结尾处有答案和解释【css细节的了解程度，】
```html
<div class="p1">
	<div class="s1">1</div>
  	<div class="s2">1</div>
</div>
<div class="p2">
	<div class="s5">1</div>
  	<div class="s6">1</div>
</div>
```
```css
.p1 {font-size: 16px; line-height: 32px;}
.s1 {font-size: 2em;}
.s2 {font-size: 2em; line-height: 2em;}

.p2 {font-size: 16px; line-height: 2;}
.s5 {font-size: 2em;}
.s6 {font-size: 2em; line-height: 2em;}
```

答： line-height 为数字，此时行间距：数字 * font-size
第一组的答案
```css
p1：font-size: 16px; line-height: 32px
s1：font-size: 32px; line-height: 32px
s2：font-size: 32px; line-height: 64px 
```
第二组的答案
```css
p2：font-size: 16px; line-height: 32px
s5：font-size: 32px; line-height: 64px
s6：font-size: 32px; line-height: 64px 
```

* p1 无需解释。 font-size: 16px; line-height: 32px;
* s1 em作为字体单位，相对于父元素字体大小；line-height继承父元素计算值。 font-size: 32px; line-height: 32px;
* s2 em作为行高单位时，相对于自身字体大小。font-size: 32px; line-height: 64px;
* p2 line-height: 2自身字体大小的两倍。font-size: 16px; line-height: 32;
* s5 数字无单位行高，继承原始值，s5的line-height继承的2，自身字体大小的两倍。font-size: 32px; line-height: 64;
* s6 无需解释。font-size: 32px; line-height: 64;