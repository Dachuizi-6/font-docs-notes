## url解析
url为什么需要解析？url编码方式？encodeURIComponent比encodeURI区别？
### url为什么要解析(编码)？
* 网络标准规定：只有字母和数字[0-9a-zA-Z]、一些特殊符号-_.~ ! * ' ( ) ; : @ <code>&</code> <code>=</code> + $ , <code>/</code> <code>?</code> <code>#</code> [ ]  才可以不经过编码直接用于URL。其它字符需要进行编码

* 会引起歧义。比如http:www.baidu.com?key=value,假如我的key本身就包括等于=符号，比如ke=y=value，就会出现歧义，你不知道=到底是连接key和value的符号，还是说本身key里面就有=

### url编码方式
网络标准没有规定具体的编码方法，而是交给浏览器 自己决定。
* 网址路径的编码，用的是utf-8编码。如：http://zh.wikipedia.org/wiki/春节
* 查询字符串的编码，用的是操作系统的默认编码。http://www.baidu.com/s?wd=春节
* GET和POST方法发出的http请求的URL的编码，用的是网页的编码(charset)
```html
<meta http-equiv="Content-Type" content="text/html;charset=xxxx">
```
不同的操作系统、不同的浏览器、不同的网页字符集，将导致完全不同的编码结果

### 怎么保证utf-8的编码
使用encodeURLcomponent

### encodeURIComponent和encodeURI区别？
* encodeURIComponent比encodeURI编码的范围更大, 会把http:// 编码

如encodeURIComponent会把 http:// 编码成 http%3A%2F%2F 而encodeURI不编码维持http://
```js
str = 'http://www.baidu.com?zcl=程亮'
encodeURI(str)
// "http://www.baidu.com?zcl=%E7%A8%8B%E4%BA%AE"
encodeURIComponent(str)
// "http%3A%2F%2Fwww.baidu.com%3Fzcl%3D%E7%A8%8B%E4%BA%AE"
```
* 当url作为参数时，使用encodeURIComponent
```js
// 参数的 / 是需要编码的，而如果是 encodeURI 编码则不编码 / 就会出问题
let param = "https://github.com/Jacky-Summer/";
param = encodeURIComponent(param);
const url = "https://github.com?param=" + param;
console.log(url) // "https://github.com?param=https%3A%2F%2Fgithub.com%2FJacky-Summer%2F"
```

## dns解析
说说DNS解析流程？html如何做dns优化？

### 域名的形式
极客时间的域名“time.geekbang.org”，
* org 就是顶级域名
* geekbang 是二级域名
* time 则是主机名

[域名、顶级域名、一级域名、二级域名、子域名](https://www.cnblogs.com/guanghe/p/11975387.html)

### dns解析过程
以访问百度为例：
1. 在浏览器中输入www.baidu.com之后，系统会检查本地hosts文件是否存在域名映射。
2. 查询本地DNS缓存，如果存在，则域名解析完成。
3. 查询计算机上配置的DNS服务器是否有缓存。
4. 还找不到的话，本地DNS服务器会访问<code>根域名服务器</code>，<code>根域名服务器</code>返回对应的<code>顶级域名</code>服务器(.com)的地址。本地DNS服务器访问顶级域名服务器，如果顶级域名服务器无法解析域名，则查找下一级，直至找到www.baidu.com映射的IP。
![dns](@assets/browser/browser/2.png)

dns查询有两种模式，一种是<code>转发模式</code>，一种是<code>非转发模式</code>，我上面说的4是非转发模式

![dns](@assets/browser/browser/29.png)

chrome://net-internals/ 的一些功能已经在Chrome 71之后被移除了。

chrome://net-internals/#dns 标签页下现在看不到浏览器缓存的DNS记录。但清除缓存按钮(clear host cache)还是正常工作的

### 预解析的实现
dns-prefetch 预解析 优化页面加载速度。
浏览器访问一个链接时并不是直接将请求到网页对应的服务器上，而是先要做域名解析——将域名解析到网页对应的服务器 ip 地址，然后浏览器才能和服务器之间建立起通信交互，其过程大致如下图所示：
![dns-prefetch](@assets/browser/browser/3.png)
域名解析就要访问域名服务器（在没有缓存缓存的情况下），这就会出现网路开销，开销的大小新取决于你的 dns 服务器和你的距离，一般要要几十毫秒到几百毫秒之间。一般的大型网站，资源都是分开存储的，一个页面上请求十几个域名是常有的事情

dns-prefetch（dns 预解析）指令可以在尚未访问 资源url 的时候提前做 dns 解析（和其他 url 请求并行执行），从而在真正请求 url 的时候避免对 dns 服务器的解析，进而达到加速网页加载的目的。
1. 用meta信息来告知浏览器, 当前页面要做DNS预解析:
```html
<meta http-equiv="x-dns-prefetch-control" content="on" />
```
2. 在页面header中使用link标签来强制对DNS预解析: 
```html
<link rel="dns-prefetch" href="http://bdimg.share.baidu.com" />
```


## 说说三次握手
说说三次握手？为啥两次不行？

### TCP三次握手
简述如下：
1. 主机A发送 SYN=1的TCP包，并随机产生一个序列号<code>seq=x</code>（作为tcp包一部分）
2. 主机B收到请求后，向主机A发送 确认号<code>ack=x+1</code>，主机B随机产生的序列号<code>seq=y</code> 的tcp包
3. 主机A收到请求后，检查 确认号 是否之前发送的seq+1。若是，则主机A向主机B发送 确认号<code>ack=y+1</code>，序列号<code>seq=x+1</code>。 主机B收到后确认下 ack，则连接建立成功
![tcp](@assets/browser/browser/4.png)

### 为什么需要三次握手，两次不行吗？
* 第一次握手说明：客户端有发送能力，服务端有接收能力
* 第二次握手说明：服务端有发送能力，客户端有接收能力。不过此时服务端并不能确认客户端的接收能力是否正常
* 第三次握手说明：客户端接收能力正常

因此，<code>三次握手才能确认双方发送和接收能力正常</code>

两次握手不行，原因如下：
1. <code>已失效的连接请求又传送到服务器端，因而产生错误</code>
2. 只要服务端发出确认，就建立新的连接了，此时客户端忽略服务端发来的确认，也不发送数据，则服务端一致等待客户端发送数据，浪费资源
:::details
如客户端发出连接请求，但因连接请求报文丢失而未收到确认，于是客户端再重传一次连接请求。后来收到了确认，建立了连接。数据传输完毕后，就释放了连接，客户端共发出了两个连接请求报文段，其中第一个丢失，第二个到达了服务端，但是第一个丢失的报文段只是在某些网络结点长时间滞留了，延误到连接释放以后的某个时间才到达服务端，此时服务端误认为客户端又发出一次新的连接请求，于是就向客户端发出确认报文段，同意建立连接，不采用三次握手，只要服务端发出确认，就建立新的连接了，此时客户端忽略服务端发来的确认，也不发送数据，则服务端一致等待客户端发送数据，浪费资源。
:::

## 从网卡把数据包传输出去到服务器发生了什么？

[探究！一个数据包在网络中的心路历程](https://mp.weixin.qq.com/s/iSZp41SRmh5b2bXIvzemIw)
![iso](@assets/browser/browser/5.png)
* 生成IP报文(源IP、目标IP、源端口号、目标端口号)后，在IP报文头部加上MAC头部(发送方MAC地址、接收方MAC地址)，MAC地址用于两点之间的传输。如果本地arp表中没有目标IP对应的MAC缓存，则需要通过ARP协议广播能到接收方的MAC地址。

![arp](@assets/browser/browser/6.png)
* 网卡把数据包转为电信号，在局域网内通过网线把数据包发送到局域网内的交换机
* 交换机收到数据包后，拿到数据包的接收方MAC，查找MAC地址表，将信号发送到相应的端口。如果交换机的MAC地址表找不到 MAC地址，则会将数据包 转发到除源端口外的所有端口

![mac地址表](@assets/browser/browser/7.png)
* 路由器收到数据包后，去掉包的MAC头部(MAC 头部的作用就是将包送达路由器，接收方的MAC地址就是路由器端口的MAC地址，当包到达路由器之后，MAC 头部的任务就完成了，于是 MAC 头部就会被丢弃)，然后查询路由表判断转发目标。
* 匹配到的路由记录的网关列，如果是IP地址，则此时还未抵达终点，需要路由器转发数据包，这个IP 地址就是我们要转发到的目标地址；如果网关列为空，表示找到了数据包IP报文的目标地址，此时已抵达终点 

![mac地址表](@assets/browser/browser/8.png)
* 路由器匹配结果还未抵达终点情况下，知道下一个路由器的IP地址，如果路由器的ARP缓存找不到MAC地址，通过ARP协议，查到下一个路由器的IP地址对应的MAC地址，并将其做为数据包的接收方MAC地址；同时以路由器的输出端口的MAC地址作为发送方MAC地址。此路由器将数据包转发到下一个路由器，经过层层转发之后，数据包到达最终目的地
* 数据包到达服务器，服务器对数据包进行拆包。
    * 拆开数据包的MAC头部，接收方MAC地址是否是本地的MAC地址。 -- 数据链路层
    * 拆开数据包的IP头部，目标IP是否是本地的IP地址。 -- 网络层
    * 拆开TCP头部，TCP头部有端口号，应用层的http服务正在监听这个端口号。-- 传输层
    * http获取http数据。-- 应用层

![封包和拆包](@assets/browser/browser/9.png)

## 浏览器缓存
3次握手之后接着说道，建立完链接，就该请求html文件了，如果html文件在缓存里面浏览器直接返回，如果没有，就去服务器拿

说说你对缓存的理解？什么是from disk cache和from memory cache ？什么时候会触发？

什么是启发式缓存？在什么条件下触发？

[浏览器缓存](./cache.md)

## 解析html
获取html之后，会解析html。说说这个过程？
解析HTML分为 <code>构建 DOM 树、构建渲染树、布局、绘制、渲染层合成</code>5个步骤

![html_render](@assets/browser/browser/14.png)
* 构建DOM树：渲染进程将 HTML 解析成树形结构的 DOM 树
* 构建渲染树：
    * 渲染引擎将 CSS 样式表转化为浏览器可以理解的styleSheets
    * 渲染进程将 CSS 解析成树形结构的 CSSOM 树，再和 DOM 树合并成渲染树. 
* 布局(Layout)：
    * 忽略渲染树中不可见的节点，构建<code>布局树</code>. eg: display: none的节点
    * 根据渲染树每一个节点布局，计算每个节点在屏幕上的<code>坐标位置</code>
* 分层(Layers): 
    * render layers: 含有position, opacity, filter等属性会提升有渲染层
    * compositing layers: 含有transform: translateZ(0)等属性的渲染层会提升为合成层
* 绘制(Paint)：渲染引擎把每个图层的绘制拆分成多个<code>绘制指令</code>，再把指令按顺序组成一个<code>待绘制列表</code>。图层绘制阶段，输出的内容就是这些待绘制列表
* 栅格化(raster)：
    * 渲染引擎的主线程为每个图层生成绘制列表，并将其提交到渲染引擎的<code>合成线程</code>。
    * 合成线程将图层分成图块(tile)
    * 合成线程把视口的附近<code>图块优先生成位图</code>。所谓<code>栅格化，是指将图块转换为位图</code>。渲染进程维护了一个栅格化的线程池, 所有的图块栅格化都是在线程池内执行的.
    * 通常，栅格化过程都会使用 GPU 来加速生成。渲染进程把生成图块的指令发送给 GPU，然后在 GPU 中执行生成图块的位图，并保存在 GPU 的内存中
* 合成与显示
    * 一旦所有图块都被栅格化，合成线程就会生成一个绘制图块的命令——“DrawQuad”，然后将该命令提交给浏览器进程
    * 浏览器进程接收“DrawQuad”命令，将其页面内容绘制到内存中，最后再将内存显示在屏幕上
![render](@assets/browser/theory/7.png)

深入讲讲渲染及层合成？ [层合成](./composite.md)

## 页面渲染优化
说说 页面渲染的优化方法？

加载阶段：
1. 将独立的JS文件，标记为async, defer
2. 压缩，并移除注释
3. CDN加快网络请求
4. 涉及多域名的网站，可以开启域名预解析

交互阶段：
1. 尽量缓存DOM查找，查找器尽量简洁；
2. 动画使用 will-change 提升为合成层。在渲染引擎的合成线程上合成动画
3. 把和DOM无关且耗时的任务放到Web Worker中


## 性能指标
如何诊断页面渲染时各个性能指标？

[vuepress](https://vuepress.vuejs.org/zh/guide/markdown.html#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AE%B9%E5%99%A8)
[关于URL编码](http://www.ruanyifeng.com/blog/2010/02/url_encoding.html)
[dns预解析](https://www.coderxing.com/dns-prefetch.html)
[面试官，不要再问我三次握手和四次挥手](https://yuanrengu.com/2020/77eef79f.html)
https://juejin.cn/post/6928677404332425223
https://www.zhihu.com/question/19721279/answer/677855112
