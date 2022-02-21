

## webpack proxy原理
在开发阶段， <code>webpack-dev-server</code> 会启动一个本地服务器，运行在 localhost 的一个端口上，而后端服务又是运行在另外一个IP地址上。由于浏览器同源的限制，本地localhost请求后端服务，会出现跨域。为了解决跨域，devServer使用了参数proxy代理来解决。proxy的原理是：利用了[http-proxy-middleware](npmjs.com/package/http-proxy-middleware)这个http代理中间件，在浏览器与服务端中添加一个代理。

```js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use('/api', createProxyMiddleware({ target: 'http://www.example.org', changeOrigin: true }));
app.listen(4000)
// 本地地址为http://localhost:4000/api/foo/bar -> http://www.example.org/api/foo/bar
// 该浏览器发送一个前缀带有/api标识的请求转发代理服务器，代理服务器转发到 www.example.org 服务器
```

## 跨域

当本地发送请求的时候，代理服务器响应该请求，并将请求转发到目标服务器，目标服务器响应数据后再将数据返回给代理服务器，最终再由代理服务器将数据响应给本地

![proxy](@assets/webpack/26.png)
* 代理服务器传递数据给本地浏览器的过程中，两者同源，并不存在跨域行为，这时候浏览器就能正常接收数据
* 服务器与服务器之间请求数据并不会存在跨域行为，跨域行为是浏览器安全策略限制

## 总结
在开发阶段， <code>webpack-dev-server</code> 会启动一个本地服务器，运行在本地 localhost 的一个端口上，而后端服务又是运行在另外一个IP地址上。由于浏览器同源的限制，本地localhost请求后端服务，会出现跨域。为了解决跨域，devServer使用了参数proxy代理来解决。proxy的原理是：利用了[http-proxy-middleware](npmjs.com/package/http-proxy-middleware)这个http代理中间件，在浏览器与服务端中添加一个代理。


[面试官：说说webpack proxy工作原理？为什么能解决跨域?](https://vue3js.cn/interview/webpack/proxy.html)
[webpack proxy 原理](https://zhuanlan.zhihu.com/p/377060372)