## 概念
注：描述的是 Chrome 的实现细节，而并非是 web 平台的功能，因此这里介绍的内容不一定适用于其他浏览器
* Chrome拥有两种不同的渲染路径(rendering path): 硬件加速路径和旧软件路径(older software path)
* 位图：内存（主内存或GPU的视频RAM）中像素值的缓冲
* 纹理：位图，旨在应用于GPU上的3D模型
* 绘画：渲染阶段，其中RenderObjects调用GraphicsContext API以对其自身进行可视化表示
* 合成：将RenderLayer的纹理结合到最终屏幕图像中的渲染阶段
* Chrome 使用纹理来从 GPU上获得大块的页面内容。通过将纹理应用到一个非常简单的矩形网格就能很容易匹配不同的位置(position)和变形(transformation)。这也就是3DCSS 的工作原理，它对于快速滚动也十分有效

[Chrome中的GPU加速合成](https://www.chromium.org/developers/design-documents/gpu-accelerated-compositing-in-chrome)

## 理解层
![layer](@assets/browser/browser/15.png)
1. 节点与DOM树：网页的内容在内部存储为称为DOM树的Node对象树。页面上的每个HTML元素以及元素之间出现的文本都与一个节点相关联。
2. 节点到<code>RenderObjects</code>: <code>DOM树中产生可视输出的每个节点都有一个对应的RenderObject</code>, RenderObject存储在称为“渲染树”的并行树结构中。RenderObject知道如何绘制Node的内容。它通过向GraphicsContext发出必要的绘制调用来实现。GraphicsContext负责将像素写入位图，最终将其显示在屏幕上.
3. RenderObjects到<code>RenderLayers</code>: 当 LayoutObject 处于相同的坐标空间时，就会形成一个 RenderLayers ，也就是渲染层。
![render-layer](@assets/browser/browser/16.png)
<code>RenderObjects和RenderLayers之间没有一一对应的关系</code>。特定的RenderObject与为其创建的RenderLayer（如果有）关联。

什么情况下RenderObject会创建RenderLayer？常见情况如下：
* 它是页面的根对象： 文档节点document
* 具有明确的CSS位置属性: relative、fixed、sticky、absolute
* 透明的: opacity < 1
* 有溢出: overflow不为visible
* CSS过滤器: filter
* 具有3D（WebGL）上下文或加速2D上下文的&lt;canvas&gt;元素
* &lt;video&gt;元素
4. RenderLayers到<code>GraphicsLayers</code>: 为了利用合成器, 某些特殊的RenderLayers(渲染层)会被认为是<code>Compositing Layers(合成层)</code>，Compositing Layers拥有自已的 GraphicsLayer，而其他不是Compositing Layers的RenderLayers，则和其第一个拥有 GraphicsLayer 父层共用一个GraphicsLayer。
5. 每个GraphicsLayer都有一个GraphicsContext供关联的RenderLayers绘制。合成器最终负责在随后的合成过程中将GraphicsContexts的位图输出组合在一起，成为最终的屏幕图像

## Compositing Layers 合成层
为了利用器，一些RenderLayers获得了自己的背衬表面(backing surface)，具有自己的背衬表面的层通常称为Compositing Layers合成层。

理论上，每个单独的RenderLayer都可以成为Composition Layers，但实际上这在内存(尤其是VRAM显卡内存)方面是非常浪费的。必须满足以下条件之一，以使RenderLayer获得其自己的合成层：
* 图层具有3D或透视变换CSS属性: transform, animation...
* &lt;video&gt;元素使用加速视频解码来使用图层
* 混合插件(如 Flash)
* 图层使用CSS动画以提高其不透明度，或使用动画的webkit转换
* 图层使用加速的CSS过滤器 
* 图层具有较低z索引的同级元素，该同级元素具有合成层

## 隐式合成
对于隐式合成，[CSS GPU Animation](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/) 中是这么描述的
::: tip
This is called implicit compositing: One or more non-composited elements that should appear above a composited one in the stacking order are promoted to composite layers.
(一个或多个非合成元素应出现在堆叠顺序上的合成元素之上，被提升到合成层。)
:::
其实是在描述一个交叠问题（overlap）。举个例子说明一下：
* 两个 absolute 定位的 div 在屏幕上交叠了，根据 z-index 的关系，其中一个 div 就会”盖在“了另外一个上边。

![17.png](@assets/browser/browser/17.png)
* 如果处于下方的 div 被加上了 CSS 属性：transform: translateZ(0)，就会被浏览器提升为合成层。提升后的合成层位于 Document 上方，假如没有隐式合成，原本应该处于上方的 div 就依然还是跟 Document 共用一个 GraphicsLayer，层级反而降了，就出现了元素交叠关系错乱的问题

![18.png](@assets/browser/browser/18.png)
* 为了纠正错误的交叠顺序，浏览器必须让原本应该”盖在“它上边的渲染层也同时提升为合成层。

![19.png](@assets/browser/browser/19.png)

## 层爆炸
由于隐式合成的存在在，容易产生一些不在预期内的合成层，当不符合预期的合成层达到一定量级时，就会变成层爆炸。<code>层爆炸会占用 GPU 和大量的内存资源，严重损耗页面性能</code>，因此盲目地使用 GPU 加速，结果有可能会是适得其反。
[DEMO](http://fouber.github.io/test/layer/)

用chremo打开demo页面后，开启浏览器的开发者模式，再按照如图操作打开查看工具：
![chrome](@assets/browser/browser/21.png)

**原因**：由于 animation transform 的特殊性（动态交叠不确定），隐式合成在不需要交叠的情况下也能发生，就导致了页面中所有 z-index 高于它的节点所对应的渲染层全部提升为合成层，最终让这个页面整整产生了几千个合成层

**解决**：消除隐式合成就是要消除元素交叠，拿这个 DEMO 来说，我们只需要给 h1 标题的 z-index 属性设置一个较高的数值，就能让它高于页面中其他元素，自然也就没有合成层提升的必要了。点击 DEMO 中的复选按钮就可以给 h1 标题加上一个较大的 z-index，前后效果对比十分明显

![demo](@assets/browser/browser/20.gif)

多个z-index: auto的div放置，虽然z-index都是auto，但实际上后放置的div，比前面的div层级高[z-index](https://developer.mozilla.org/zh-CN/docs/Web/CSS/z-index)

## 层压缩
浏览器应对层爆炸策略: 如果多个渲染层同一个合成层重叠时，这些渲染层会被压缩到一个 GraphicsLayer 中，以防止由于重叠原因导致可能出现的“层爆炸
* 有四个 absolute 定位的 div 在屏幕内发生了交叠。此时处于最下方的 div(z-index: 3) 在加上了 CSS 属性 transform: translateZ(0) 后被浏览器提升为合成层. 按照隐式合成原理，岂不是就会产生四个合成层了？

![layerPress](@assets/browser/browser/22.png)
* 然而事实并不是这样的，<code>浏览器的层压缩机制，会将多个渲染层压缩到同一个 GraphicsLayer 中进行渲染</code>，也就是说，上方的三个 div 最终会处于同一个合成层中，这就是浏览器的层压缩。

![layerPress](@assets/browser/browser/23.png)

## 总结
合成层的优势：一般一个元素开启硬件加速后会变成合成层，可以独立于普通文档流中，改动后可以避免整个页面重绘，提升性能

性能化化点：
* 提升动画效果元素 到 合成层。合成层不会影响页面其它元素，只需要paint 提升的合成层。<code>提升合成层的最好方式是使用 CSS 的 will-change属性。从上一节合成层产生原因中，可以知道 will-change 设置为opacity、transform、top、left、bottom、right 可以将元素提升为合成层。</code>
* 减少绘制区域。 对于不需要重新绘制的区域应尽量避免绘制，以减少绘制区域，比如一个 fix 在页面顶部的固定不变的导航header，在页面内容某个区域 repaint 时，整个屏幕包括 fix 的 header 也会被重绘。而对于固定不变的区域，我们期望其并不会被重绘，因此可以通过之前的方法，将其提升为独立的合成层。减少绘制区域，需要仔细分析页面，区分绘制区域，减少重绘区域甚至避免重绘。

![掘金](@assets/browser/browser/24.png)


参考：
[浏览器层合成与页面渲染优化](https://juejin.cn/post/6844903959425974280#heading-11)
[浏览器渲染流程&Composite（渲染层合并）简单总结](https://segmentfault.com/a/1190000014520786###)