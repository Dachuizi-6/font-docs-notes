## 为什么需要服务端渲染
常规的Vue的SPA项目，界面是通过js动态渲染出来的。这样会有两个问题：
* 无法SEO。界面只有根标签，爬虫无法抓取其它元素
* 首屏白屏问题。界面是通过JS渲染出来的，如果JS文件体积很大，需要下载一段时间，那在这一段时间浏览器界面是空白的。

## 什么是服务端渲染
在服务端获取到用户浏览器输入的路由，服务器会提前获取首屏所需求的数据，并注入到HTML中，将渲染好的html字符串，返回给浏览器。data-server-rendered 特殊属性，让客户端 Vue 知道这部分 HTML 是由 Vue 在服务端渲染的，并且应该以激活模式进行挂载。使用界面激活为可交互的应用程序。
![ssr](@assets/vue/vnode/15.png)

## 服务器端渲染有哪些缺点
* 服务器端负载。在 Node.js 中渲染完整的应用程序，显然会比仅仅提供静态文件的 server 更加大量占用 CPU 资源 (CPU-intensive - CPU 密集)
* 开发难度增加、项目的构建、配置、部署。需要懂node技术、区别客户端、服务端分别进行配置及部署；开发中也需要及时注意内存问题、及服务器压力。需要的能力更为综合。
* 开发条件所限。除beforeCreate、Create 生命周期外服务端都不执行，window、document不存在。[一些外部扩展库可能需要特殊处理，才能在服务器渲染应用程序中运行]

## 服务器端渲染如何实现
要解决两个问题：服务端首屏渲染和客户端激活
* 服务器bundle文件：用于服务端首屏渲染
* 客户端bundle文件：也会发送给浏览器，用于客户端激活

![ssr](@assets/vue/vnode/14.png)

如图所示 有两个入口文件，Server entry 和Client entry,分别经webpack打包成服务端用的Server Bundle和客户端用的Client Bundle。

1. 服务端：当Node Server收到来自客户端的请求后，BundleRenderer 会读取Server Bundle，并且执行它，而Server Bundle实现了数据读取并将填充数据的Vue实例挂载在HTML模板上，接下来BundleRenderer将HTML渲染为字符串，最后将完整的HTML返回给客户端。
2. 客户端： 浏览器收到HTML后，客户端加载了Client Bundle,通过app.$mount('#app')的方式将Vue实例挂载在服务端返回的静态HTML上。如：
```html
<div id="app" data-server-rendered="true"></div>
```
3. 客户端激活：data-server-rendered特殊属性，让客户端Vue知道这部分HTML是由Vue在服务端渲染的，并且应该以激活模式Hydartion模式挂载。

参考：
https://github.com/zyl1314/vue-ssr-demo/issues/2
https://github.com/leocoder351/vue-ssr-demo
https://segmentfault.com/a/1190000016637877