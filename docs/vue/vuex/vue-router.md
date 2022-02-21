

路由有几种模式？说说它们的区别？


1. hash: hash(跟在＃符号后面的URL部分，包括＃符号)的改变会触发[hashchange](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/hashchange_event)事件，通过监听hashchange事件来实现页面更新。hash值变化不会让浏览器向服务器请求。
```js
// 监听hash变化，点击浏览器的前进后退会触发
window.addEventListener('hashchange', function() {
  console.log('The hash has changed!')
}, false)
```
2. history: [History API](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API#replacestate_%E6%96%B9%E6%B3%95)提供了<code>pushState</code>和<code>replaceState</code>两个方法, 分别可以添加和修改历史记录条目。这两个方法可以改变url，但不会请求资源
* 调用history.pushState()或者history.replaceState()不会触发[window.onpopstate](https://developer.mozilla.org/zh-CN/docs/Web/API/WindowEventHandlers/onpopstate)事件. popstate事件只会在浏览器某些行为下触发, 比如点击后退、前进按钮（或者在JavaScript中调用history.back()、history.forward()、history.go()方法）此外，a 标签的锚点也会触发该事。通过监听popstate事件来实现页面更新。
* 初次访问或者刷新都会向服务器请求，如果没有请求到对应的资源就会返回404，所以路由地址匹配不到任何静态资源，则应该返回同一个index.html 页面，需要在nginx中配置。
```js
// nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
3. abstract: 非浏览器环境下. 如 Node.js 服务器端


[Vue Router history模式的配置方法及其原理](https://juejin.cn/post/6844903856359342087)