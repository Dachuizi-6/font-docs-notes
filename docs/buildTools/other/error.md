## 面试
问：source map原理？

答：

webpack开发环境配置source map，打包会生成.map文件，保存<code>打包代码和源代码的映射关系</code>。
1. 打包文件的最后一行，标记了该文件对应的source map文件地址
2. source map会保存源文件source数组, 变量names数组，映射关系mappings。映射关系中以<code>分号;</code>来以分隔行，a | b | c | d | f 
* a: 打包后代码第几列
* b: 哪个源文件，source数组中的下标
* c: 源代码第几行
* d: 源代码第几列
* f: 哪个变量，names数组中的下标

[source map原理分析&vlq](http://www.qiutianaimeili.com/html/page/2019/05/89jrubx1soc.html)
[Source map 运作原理](https://blog.techbridge.cc/2021/03/28/how-source-map-works/)
[绝了，没想到一个 source map 居然涉及到那么多知识盲区](https://juejin.cn/post/6963076475020902436#heading-0)

问：一般线上的js代码是被压缩过的，但是如果线上有个Bug，浏览器报了类似o is not a function的错误，你怎么定位到o是源代码里的哪个地方？

答：
1. 本地复现。如果能复现的话，修改发布
2. 如果本地无法复现，但线上有问题。前端接入错误监控方案sentry

Sentry方案: 代码里集成下 Sentry 的 Client，然后每次把 SourceMap 也上传一份给 Sentry，线上遇到错误将错误上传给 Sentry Server，Sentry Server基于错误堆栈和 SourceMap 反解出原始的堆栈就可以了。

3. fiddler本地代理替换js文件。本地打包生成js，用代理把线上的js替换成本地的。本地打包可以生成source map方便查看，或者在chrome上给本地的js添加source map

![fiddler](@assets/webpack/32.png)

Chrome 里可以指定 js 的 sourcemap，sourcemap 文件发布的时候不需要和 js 一起发布的。最好不要发布source map，源码被反编译造成代码泄漏

![source map](@assets/webpack/33.png)

## 异常
问：前端异常捕获取有几种方式？

答：

异常类型：
1. JS 语法错误、代码异常
2. 请求异常
3. 静态资源加载异常
4. Promise 异常
5. Script error

捕获异常的方法：
1. try-catch 捕获不到语法和异步错误捕
2. window.onerror: JS运行时发生错误，会执行。主要是来捕获预料之外的错误
```js
try {
  setTimeout(() => {
    undefined.map(v => v);
  }, 1000)
} catch(e) {
  console.log("捕获到异常：", e);
}
// try ... catch ...无法捕获异步错误；
window.onerror = function (message, source, lineno, colno, error) {
  console.log("捕获到异常3：", { message, source, lineno, colno, error });
};
```
3. window.addEventListener('error', fn)：静态资源加载异常
4. window.addEventListener('unhandledrejection', fn)：没有写 catch 的 Promise 中抛出的错误，会触发 unhandledrejection 事件
```js
window.addEventListener("unhandledrejection", function (e) {
  e.preventDefault();  // 去掉控制台的异常显示
  console.log("捕获到 promise 错误了");
  console.log("错误的原因是", e.reason);
  console.log("Promise 对象是", e.promise);
  return true;
});

Promise.reject("promise error");
new Promise((resolve, reject) => {
  reject("promise error");
});
new Promise((resolve) => {
  resolve();
}).then(() => {
  throw "promise error";
})
```
5. 请求异常：axios的response interceptors统一处理



[如何优雅处理前端异常？](http://jartto.wang/2018/11/20/js-exception-handling/index.html)
