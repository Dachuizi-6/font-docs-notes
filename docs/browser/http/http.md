## http1.0
<code>HTTP1.0</code> 特性
无状态。HTTP1.0规定浏览器和服务器保持短暂的连接，浏览器的每次请求都需要与服务器建立一个TCP连接，服务器处理完成后立即断开TCP连接

1. 支持多种类型的文件下载
2. 状态码
3. Cache机制

## http1.1
1. 持久连接: 一个TCP连接可以传输多个HTTP请求，只要浏览器或者服务器没有明确断开连接，那么TCP连接会一直保持

<div style="display: flex">
  <div>
    <p>HTTP1.0</p>
    <img src="@assets/browser/http/1.png" style="display: block">
  </div>
  <div>
    <p>HTTP1.1</p>
    <img src="@assets/browser/http/2.png" style="display: block">
  </div>
</div>


:::tip
如果你不想要采用持久连接，可以在 HTTP 请求头中加上<code>Connection: close</code>。
目前浏览器中对于<strong>同一个域名，默认允许同时建立 6 个 TCP 持久连接</strong>
:::

2. Host 字段，表示当前的域名地址
3. Cookie 字段

## http1.1存在问题
对带宽的利用率却并不理想
1. TCP慢启动。
:::tip
一旦一个 TCP 连接建立之后，就进入了发送数据状态，刚开始 TCP 协议会采用一个非常慢的速度去发送数据，然后慢慢加快发送数据的速度，直到发送数据的速度达到一个理想状态，我们把这个过程称为慢启动.
慢启动是 TCP 为了减少网络拥塞的一种策略
:::
2. 同时开启的多条TCP连接会竞争带宽
3. HTTP/1.1队头阻塞问题. 持久连接能公用一个TCP管道，但一个管道同一时刻只能处理一个请求。如果有一个请求阻塞5s，那么后续的请求都要延迟等待5s!

## http2.0
1. 多路复用。解决HTTP1.1队头阻塞问题。
2. 可以设置请求的优先级
3. 头部压缩。压缩请求头的数据
![multipy](@assets/browser/http/3.png)

## http2.0存在的问题
![multipy](@assets/browser/http/4.png)
![multipy](@assets/browser/http/5.png)

HTTP/2 多路复用
![multipy](@assets/browser/http/6.png)

在 HTTP/2 中，多个请求是跑在一个 TCP 管道中的，如果其中任意一路数据流中出现了丢包的情况，那么就会阻塞该 TCP 连接中的所有请求。这不同于 HTTP/1.1，使用 HTTP/1.1 时，浏览器为每个域名开启了 6 个 TCP 连接，如果其中的 1 个 TCP 连接发生了队头阻塞，那么其他的 5 个连接依然可以继续传输数据。所以，<code>HTTP/2中，TCP队头阻塞造成的影响会更大</code>

## http3.0
HTTP3.0 使用了 基于UDP的<code>QUIC 协议</code>
<img src="@assets/browser/http/7.png" />

通过上图我们可以看出，HTTP/3 中的 QUIC 协议集合了以下几点功能
1. 传输可靠性。
2. TLS加密
3. 多路复用
4. 快速握手
![http3](@assets/browser/http/8.png)

