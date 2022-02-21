同源策略会隔离不同源的 DOM、页面数据和网络通信. 

同源策略出于便利性的让步：页面中可以嵌入第三方资源
## CSP
CSP[内容安全策略](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP), 核心思想：让服务器决定浏览器能够加载哪些资源，让服务器决定浏览器是否能够执行内联 JavaScript 代码
```js
Content-Security-Policy: default-src ‘self’ // 只允许加载本站资源
Content-Security-Policy: img-src https://*  // 只允许加载 HTTPS 协议图片
Content-Security-Policy: child-src 'none'   // 允许加载任何来源框架
```

## XSS攻击
XSS <code>Cross Site Scripting</code>，为了与“CSS”区分开来，故简称 XSS，翻译过来就是“<code>跨站脚本</code>”

## 是什么
XSS攻击是 黑客往 HTML文件或者 DOM中注入 恶意脚本，从而用户浏览页面时利用恶意脚本对用户实施攻击的一种手段

恶意脚本可以
1. 获取Cookie
2. 监听用户行为。监听键盘事件，比如可以获取用户输入的信用卡等信息
3. 修改 DOM
4. 页面内生成浮窗广告

## 解决
1. 服务端对输入的脚本进行转码
2. Cookie加入 <code>HttpOlny</code>，无法通过JS来获取 本地cookie
3. 利用CSP。禁上加载其他域的资源 JS 脚本


## CSRF
CSRF <code>Cross-site request forgery</code> 跨站请求伪造

## 是什么
CSRF 攻击就是黑客利用了用户的登录状态，并通过第三方的站点(黑客的网站)来做一些坏事

CSRF攻击可以
1. 自动发起GET请求 
2. 自动发起POST请求
3. 诱导用户点击

```js
// 1
<img src="https://time.geekbang.org/sendcoin?user=hacker&number=100">
// 2 黑客在他的页面中构建了一个隐藏的表单, 用户打开该站点之后，这个表单会被自动执行提交
<form id='hacker-form' action="https://time.geekbang.org/sendcoin" method=POST>
  <input type="hidden" name="user" value="hacker" />
  <input type="hidden" name="number" value="100" />
</form>
<script> document.getElementById('hacker-form').submit(); </script>
// 3
<a href="https://time.geekbang.org/sendcoin?user=hacker&number=100" taget="_blank">点击下载美女照片</a>
```

## 解决
1. Cookie设置 [SameSite](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
    * Strict：禁止跨域发送Cookie
    * Lax: 第三方网站发起的GET请求允许发送Cookie, 其它不允许
    * None: 允许跨域发送Cookie
2. 服务端验证请求的来源
    * Referer: 记录了请求的具体来源
    * Origin: 记录请求的域名
![origin](@assets/browser/http/16.png)
3. 请求时附带验证信息，比如 token


如果没设置SameSite，登录后Info站点后，在极客时间获取Info站点的资源，会带上极客时间的cookie
（浏览器处理cookie的机制，做某个域的请求，自动会把这个域的cookie带上） csrf 一般是通过 img form 等构造请求发送的，这些请求不受跨域限制

cookie SameSite:
https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite