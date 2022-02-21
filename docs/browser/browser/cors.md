## 为什么会出现跨域
浏览器的[同源策略](./jsonp.md) 不允许XHR对象向不同源的服务器地址发起HTTP请求
## CORS
CORS是一个W3C标准，全称是"跨域资源共享"（Cross-origin resource sharing）

出于安全性，浏览器限制脚本内发起的跨源HTTP请求。但实际开发中，有跨源请求的需求。CORS能允许A域名向B域名发起请求。这需要服务器的支持：
```js
// 参考下activity-test.61info.cn服务的ngnix配置
server_name  activity-test.61info.cn;
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods 'GET,POST';
add_header Access-Control-Allow-Headers 'user-token,DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';
```
1. Preflight request：一个 CORS 预检请求是用于检查服务器是否支持 CORS 即跨域资源共享
2. Access-Control-Allow-Origin：必填。它的值要么是请求时Origin字段的值，要么是一个*，表示接受任意域名的请求
3. Access-Control-Allow-Methods：可选。响应首部 Access-Control-Allow-Methods 在对 preflight request.（预检请求）指明了实际请求所允许使用的 HTTP 方法
4. Access-Control-Allow-Headers：可选。响应首部 Access-Control-Allow-Headers 用于 preflight request （预检请求）中，列出了将会在正式请求的 Access-Control-Request-Headers 字段中出现的首部信息
5. Access-Control-Max-Age：指定了preflight请求的结果能够被缓存多久
6. Access-Control-Allow-Credentials：可选。表示是否允许发送Cookie

### 简单请求
只要同时满足以下两大条件，就属于简单请求
1. 请求方式：GET, POST, HEAD
2. HTTP头信息不超出以下字段：
* Accept、Accept-Language 、 Content-Language、 Last-Event-ID、
* Content-Type(限于三个值：application/x-www-form-urlencoded、multipart/form-data、text/plain)

所以呢，如果请求头的<code>content-type: application/json;charset=UTF-8</code>为json格式，那这个请求就是复杂请求了，就要发起预检

简单请求会在头信息之中，增加一个Origin字段。如果Origin指定的源，不在许可范围内，服务器会返回一个正常的HTTP回应。浏览器发现，响应的头信息没有包含Access-Control-Allow-Origin字段（详见下文），就知道出错了，从而抛出一个错误，被XMLHttpRequest的onerror回调函数捕获
```js
// 请求
Origin: http://api.bob.com
// 响应。http://api.bob.com匹配到了，浏览器会允许 这个请求
Access-Control-Allow-Origin: http://api.bob.com
// 或者
Access-Control-Allow-Origin：*
```

## 复杂请求
复杂请求首先会发起一个预检请求(Preflight request)，该请求是 <code>Request Method: OPTIONS</code>，通过该请求来知道服务端是否允许跨域请求

如果服务器否定了"预检"请求，会返回一个正常的HTTP回应，但是没有任何CORS相关的头信息字段。这时，浏览器就会认定，服务器不同意预检请求，因此触发一个错误，被XMLHttpRequest对象的onerror回调函数捕获。控制台会打印出如下的报错信息。
```js
XMLHttpRequest cannot load http://api.alice.com.
Origin http://api.bob.com is not allowed by Access-Control-Allow-Origin.
```
## 解决跨域的方法
1. CORS：服务端设置allow-origin等相关信息。即可发起跨域请求
2. 代理：请求的流向，浏览器页面和本地服务同源：浏览器页面 --> 本地服务 --> 后端服务。eg: [webpack proxy原理](../../buildTools/webpack/proxy.md)
2. JSONP
3. postmessage
4. iframe：场景：GTD需求时，页面A嵌入iframe页面B，A和B不同域，要想实现消息通信可通过postmessage
```js
<div style="height: 1000px;">
  <iframe id="iframe" :src="gdt_url" frameborder="0" width="100%" height="100%"></iframe>
</div>

window.addEventListener('message', e => {
  // 收到iframe的消息，做相应操作
}, false)
const iFrame = document.getElementById('iframe')
const message = JSON.parse(localStorage.getItem('loginInfo')) || {}
iFrame.onload = () => {
  // 向iframe发消息
  iFrame.contentWindow.postMessage(message, this.gdt_url)
}
```
5. websocket. webpack热更新启动了一个websocket服务。浏览器是socket客户端。实现通信


参考:
[跨域资源共享 CORS 详解](http://www.ruanyifeng.com/blog/2016/04/cors.html)