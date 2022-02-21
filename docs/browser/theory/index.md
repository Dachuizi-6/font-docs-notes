## 说说浏览器的架构
Chrome浏览器包括：<code>多进程架构</code>
1. 浏览器主进程：界面显示，用户交互，子进程管理等
2. GPU进程：快速显示位图
3. 网络进程：加载网络资源
4. 渲染进程：HTML、CSS、JS的解析等
5. 插件进程：运行插件。插件易崩溃，通过插件进程来隔离

![process](@assets/browser/theory/1.png)
![process](@assets/browser/theory/2.png)

Chrome 浏览器右上角的“选项”菜单，选择“更多工具”子菜单，点击“任务管理器”

## 进程和线程的区别
1. 进程是应用程序的实例，是存放代码，运行数据的环境
2. 线程依赖进程而存在，一个进程可以有多个线程
3. 进程中的线程共享数据，不同进程的数据是相互隔离的。当然可以通过 <code>管道</code> <code>IPC</code> 实现进程间的相互通信
4. 进程中的任一线程出错，都会导致整个进程崩溃
5. 进程关闭后，操作系统会回收进程所占用的内存

<code>顺便说说</code>，Chrome浏览器从单进程 升级到 多进程的原因
1. 不稳定：任一线程出错，整个进程崩溃
2. 不流畅：容易造成页面卡顿。
3. 不安全：插件，脚本可以获取浏览器系统权限
![process](@assets/browser/theory/3.png)

单进程浏览器架构示意图


## 浏览器登录状态是如何保持的？
1. cookie
* 提交用户信息(eg: 帐号密码)，服务器验证请求，并返回响应。
* 如果验证通过，则生成一个表示用户身份的字段串。并把字符串添加到响应头的<code>Set-Cookie</code>字段中
* 浏览器收到响应。解析响应头<code>response headers</code>, 如果遇到<code>Set-Cookie</code>字段，则到该字段写到浏览器本地的<code>Cookie</code>
* 浏览器再次访问，发起HTTP请求时，会自动把同源的Cookie，即之前保存的Cookie，添加到请求头<code>request headers</code>的<code>Cookie</code>字段
* 服务次收到请求后，根据请求头的cookie字段就可以判断用户是否是已登录状态
![cookie](@assets/browser/theory/4.png)

2. token
登录成功后，服务端返回一个token，一般存放在<code>localStorage</code>, 再次发请求时，token放在请求头的<code>authorization</code>字段

## 什么情况下多个页面会同时运行在一个渲染进程中？
1. Chrome默认每个标签 对应 一个渲染进程
2. A页面打开B页面 && A页面和B页面属于<code>同一站点</code>。那么B页面会复用A页面的渲染进程

同一站点：根域名和协议相同
:::tip
[https://linkmarket.aliyun.com](https://linkmarket.aliyun.com) 内新开的标签页都是新开一个渲染进程
a 链接的 rel 属性值都使用了 <code>noopener</code> 和 <code>noreferrer</code>
* noopener: 告诉浏览器通过这个链接打开的标签页中的 opener 值设置为 null
* noreferrer: 告诉浏览器，新打开的标签页不要有引用关系

<img src="@assets/browser/theory/5.png" style="width: 49%" />
<img src="@assets/browser/theory/6.png" style="width: 50%" />
:::

## 解析html的过程？
或者问：HTML、CSS、JS是如何变成页面的？

最新详细版：[解析HTML](../browser/url.html#解析html)


## 时间线面板
![time-board](@assets/browser/theory/8.png)
1. <code>Queuing</code>：排队。浏览器发起请求时，可能由于以下原因导致需要排队
    * 资源有优先级：CSS, HTML, JS 比 图片, 视频, 音频优先
    * <code>HTTP/1.1中，Chrome 最多允许对同一个 域名 建立6个 TCP 连接</code>。超过6个，则会处于排队状态。解决方法：升级HTTP2，无此限制
    * 网络进程在为数据分配磁盘空间时，新的 HTTP 请求也需要短暂地等待磁盘分配结束。
2. <code>Stalled</code>: 停滞。发起连接请求之前，一些原因导致连接过程被推迟。
3. <code>Initial connection/SSL</code>： 和服务器建立连接阶段。TCP连接时间 + SSL握手时间[如果使用HTTPS]
4. <code>Request sent</code>: 网络进程发送数据。此阶段非常快
5. <code>Waiting (TTFB)</code>：等待接收服务器第一个字节的时间。TTFB越短，服务器响应越快。
6. <code>Content Download</code>：从接收到第一个字节 到 接收到全部响应数据所用的时间。Content Download时间过久，解决方法：压缩，去掉代码中的注释等


## async和defer
1. JS 会阻塞 DOM 解析
2. CSS不阻塞 JS 的加载，但 CSS 会阻塞 JS 的执行
3. * 问：HTML 解析器是等整个 HTML 文档加载完成之后开始解析的，还是随着 HTML 文档边加载边解析的？
   * 答：HTML 解析器并不是等整个文档加载完成之后再解析的，而是网络进程加载了多少数据，HTML 解析器便解析多少数据。
4. <code>预解析</code>：当渲染引擎收到字节流之后，会开启一个<code>预解析线程</code>，用来分析 HTML 文件中包含的 JavaScript、CSS 等相关文件，解析到相关文件之后，预解析线程会提前下载这些文件

<img src="@assets/browser/theory/9.png" style="width: 100%" />

解析DOM, 遇到一个没有任何属性的 script 标签，就会<code>暂停解析DOM</code>，先发送<code>网络请求</code>获取该 JS 脚本的代码内容，然后让 JS 引擎<code>执行</code>该代码

<img src="@assets/browser/theory/10.png" style="width: 100%" />
<img src="@assets/browser/theory/11.png" style="width: 100%" />

<code>async</code>标记的脚本文件一旦加载完成会立即执行。async标记的 JS 文件，加载完成后，可能HTML解析未完成，也可能已经完成了。

<img src="@assets/browser/theory/12.png" style="width: 100%" />

<code>defer</code>标记的脚本文件需要在[DOMContentLoaded](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/DOMContentLoaded_event)事件之前执行。defer标记的 JS 文件，加载完成后，如果HTML解析未完成，则<code>等待 HTML 解析完毕再执行 JS 代码</code>

如果脚本中没有操作DOM的相关代码，应该设置为异步加载。（async和defer都是异步加载脚本的）async标记的脚本文件一旦加载完成会立即执行，defer标记的脚本文件需要在DOMContentLoaded事件之前执行
## 面试：说说async和defer的区别
答：async和defer都是异步加载 JS。当 JS 是独立脚本，可以设置为异步加载async或defer。
* async标记的 JS 加载完成后，就执行。
* defer标记的 JS 加载完成后，需等待HTML解析完成后，才执行

:::tip
如果第三方服务商出现了一些小问题，比如延迟之类的，就会使得页面白屏。
好在script提供了两种方式来解决上述问题，async和defer，这两个属性使得script都不会阻塞DOM的渲染
:::



## css如何影响首次加载的白屏时间？
![render](@assets/browser/theory/13.png)
![render](@assets/browser/theory/14.png)

## 显示器是怎么显示图像的
显示器的刷新频率一般是60HZ，即1s更新60次图片，图片是从显卡前缓冲区中取的。
显示的作用是合成新的图像，并把图像保存在后缓冲区。
一旦显卡把合成的图像写到后缓冲区中，系统就会让前缓存区和后缓冲区互换。

思想和 JS引擎垃圾回收机制中 [新生代](../../basic/js/#垃圾数据是如何自动回收的)的处理，基本一样。都有互换

## web worker运行在哪的，怎么理解js引擎单线程，却又能在web worker中执行js。
:::tip
Web Workers are a simple means for web content to run scripts in background threads. The worker thread can perform tasks without interfering with the user interface.
 --> Web Workers是一个关于在web内容中跑脚本的后台线程的简单方法。工作线程可以在不干扰用户界面的同时执行任务
:::
* web worker运行在浏览器中，是浏览器的一个子线程。<code>Web Worker 其实就是在渲染进程中开启的一个新线程，它的生命周期是和页面关联的</code>
* worker子线程运行在 浏览器上。JS 单线程 通过 postMessage 和浏览器上的worker线程 通信. 这样在进行复杂操作的时候，就不会阻塞主线程了
```js
// main.js
const worker = new Worker('worker.js')
worker.postMessage('zcl') // 发送数据
// 监听
worker.onmessage = function(e) {
  console.log(e.data)
  worker.terminate() // 关闭worker
}

// worker.js
self.onmessage = function(e) {
  const workerResult = 'hello' + e.data
  postMessage(workerResult)
}
```

## service worker
![service_worker](@assets/browser/theory/15.png)

* Service Worker 的主要功能就是<code>拦截请求和缓存资源</code>. 
* 由于 Service Worker 还需要会为多个页面提供服务，所以还不能把 ServiceWorker 和单个页面绑定起来，要<code>运行在浏览器进程</code>中。



[语雀-笔记-极客时间：浏览器工作原理与实践](https://www.yuque.com/u517947/auk4bs/yzhx9r)
[css加载会造成阻塞吗](https://segmentfault.com/a/1190000018130499)
[掘鑫async和defer](https://juejin.cn/post/6894629999215640583)
[async和defer](https://www.growingwiththeweb.com/2014/02/async-vs-defer-attributes.html)
[初探Web Workers](https://juejin.cn/post/6971451348227194894#heading-0)
[Service Worker](https://juejin.cn/post/6844903729972396039#heading-19)


<style scoped>
img {
  width: 70%
}
</style>