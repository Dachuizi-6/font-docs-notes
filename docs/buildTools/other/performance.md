## 打包(webpack)优化
1. tree sharing 优化代码(生产默认开启)
2. scope hosting 优化代码(生产默认开启)
3. 去掉注释、代码压缩，parallel开启多进程压缩（terser, 生产默认开启)
4. vue-router 加载对应页面，import形式进行懒加载
5. 多页面H5项目。打包或运行想要 开发的页面就好了。不要每个页面都运行，打包
6. 分包：
* css资源提取打包成一个文件，再注入到html中。（MiniCssExtractPlugin + html-inline-css-webpack-plugin）
* external + cnd。把vue, vue-router等使用cnd引入
* splitChunks公共资源分离。把多次使用的模块分离到chunk。eg: vue, vue-router等多次使用的第三方库
* dll分包。DLLPlugin把不常用的公共资源打包，DllReferencePlugin再把引入资源([manifest](https://webpack.docschina.org/concepts/manifest/#root).json), manifest保存着模块间的交互，runtime 会通过 manifest 来解析和加载模块(只是了解。。)
7. thread-loader：加快打包与构建。通常构建打包vue-loader处理vue模块，babel-loader处理js, ts模块耗时较长，可以加上thread-loader加快构建。

:::tip
thread-laoder原理（没看源码，猜测）：
1. 由于是loader，所以返回的是函数。
2. 由于是异步loader，所以<code>var callback = this.async()</code>标志为异步loader
3. 内部使用node的创建子进程。由于是大文件处理，所以显然使用child_process.spawn创建子进程
:::

8. 缩小构建和查找文件的范围。eg: babel-loader加上<code>exclude: 'node_modudles'</code>
9. 使用缓存，二次构建提速。babel-loader开启缓存，使用cache-loader

其它：
* 引用的图片资源大小要合理，不能太大；
* 有些第三方库也是奇葩，没打包到dist，但项目的确需要使用，就需要自已打包，发到npm中。

## 网络性能
1. CDN加快网络请求
2. 浏览器缓存。no-store是不缓存，不建议使用；频繁改变的资源用no-cache，对比缓存；不常变化的资源(字体库)使用强缓存max-age
3. cookie 不要用cookie保存太大的数据。--拓展--> httpOnly, SameSite
4. 域名预解析
5. js资源使用异步加载。第三方服务的资源可以使用异步加载，避免延时，页面白屏

## 加载后性能
1. 元素提升到合成层。独立于文档流，当元素改变时，发生重排重绘，不会导致整个页面重排重绘。eg: 统一登陆的header固定在头部(掘金的header也是提升到合成层)，还有动画效果的元素


## 代码层面
1. 尽量缓存DOM查找。能用一个变量保存使用，就不要多次创建Dom变量了
2. DOMFragment来做批量的dom操作。避免多次重排
3. 避免频繁操作style，可以采用修改class
4. 耗时任务可以用web worker执行
5. 图片较多的页面。使用图片懒加载， v-lazy-load插件
6. 按钮加防抖，搜索文本框加节流
7. 字体库不要太大。太大的话，可以使用常用字体的字体库；也可以对字体库进行压缩（去除不用的字体。了解？）
8. vue中不要用index作为key
9. 合理使用v-if, v-show。v-if会重新渲染组件；v-show适合频繁切换
10. keep-alive缓存
11. ssr首屏优化 seo优化