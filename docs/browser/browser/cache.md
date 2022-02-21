## 说说你对缓存的理解？
* 浏览器首次加载资源时，服务器返回200，此时浏览器会将资源下载下来，还会缓存response的header头部。
* 下一次加载资源时，首先进行强缓存处理，强缓存主要利用Cache-Control，Cache-Control常用的有：no-cache、no-store、max-age=xxx。Cache-Control为no-cache，则直接进入对比缓存；为no-store，则不缓存(强缓存，对比缓存都不触发)；max-age=xxx，则xxx秒内再次请求，使用强缓存，直接获取浏览器本地的缓存数据。
* 进入比对缓存时，如果使用Etag(响应header字段)与If-None-Match(请求header字段)，<code>If-None-Match</code>保存资源唯一标识，服务器对比If-None-Match与被请求资源的唯一标识，一致则说明未修改，响应http 304，告诉浏览器缓存，否则响应资源内容，状态码200。如果使用Last-Modified(响应header字段)与If-Modified-Since(请求header字段),<code>If-Modified-Since</code>保存资源最后修改时间，服务器对比If-Modified-Since与被请求资源的最后修改时间，一致则说明未修改，响应http 304，告诉浏览器缓存，否则响应资源内容，状态码200。

Etag

![Etag](@assets/browser/browser/10.png)

If-None-Match

![If-None-Match](@assets/browser/browser/11.png)

Last-Modified

![Last-Modified](@assets/browser/browser/12.png)

If-Modified-Since

![If-Modified-Since](@assets/browser/browser/13.png)

当ETag和Last-Modified同时存在时，服务器先会检查ETag，然后再检查Last-Modified

## 什么是from disk cache和from memory cache ？什么时候会触发？
强缓存时会触发。
* memory cache: 资源缓存在内存中，读取速度更快。关闭tab页面，内存缓存会被释放。
* disk cache: 资源缓存在硬盘中，读取速度稍慢，容量大。

## 什么是启发式缓存？在什么条件下触发？
```http
// 响应头
Age:23146
Cache-Control: public
Date:Tue, 28 Nov 2017 12:26:41 GMT
Last-Modified:Tue, 28 Nov 2017 05:14:02 GMT
Vary:Accept-Encoding
```
有人可能会说下次请求直接进入协商缓存阶段，携带If-Moified-Since呗，不是的，浏览器还有个启发式缓存阶段【响应中未显示Expires，Cache-Control：max-age或Cache-Control：s-maxage，并且响应中不包含其他有关缓存的限制】

根据响应头中2个时间字段 Date 和 Last-Modified 之间的时间差值，取其值的10%作为缓存时间周期。
```js
// Date 减去 Last-Modified 值的 10% 作为缓存时间。
// Date：创建报文的日期时间, Last-Modified 服务器声明文档最后被修改时间
response_is_fresh =  max(0,（Date -  Last-Modified)) % 10
```



参考：[彻底弄懂HTTP缓存机制及原理](https://www.cnblogs.com/chenqf/p/6386163.html)