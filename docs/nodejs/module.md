## CommonJS
CommonJS 的一个模块就是一个脚本文件，通过执行该文件来加载模块。CommonJS 规范规定，每个模块内部，module 变量代表当前模块。这个变量是一个对象，它的 exports 属性（即 module.exports）是对外的接口。<code>加载某个模块，其实是加载该模块的 module.exports 属性</code>。

注意区分下面两种不同有导出和导入。CJS中<code>module.exports</code>默认是一个对象
```js
// module.js。 方法定义在了模块的属性
module.exports.sayHello = function() {
    console.log('Hello ');
};

// 调用
var myModule = require('module');
myModule.sayHello();

// 如果这样写
module.exports = sayHello;

// 调用则需要改为
var sayHello = require('module');
sayHello();
```
<code>require 命令第一次加载该脚本时就会执行整个脚本，然后在内存中生成一个对象（模块可以多次加载，但是在第一次加载时才会运行，结果被缓存）</code>，这个结果长成这样：
```js
{
  id: '...',
  exports: { ... },
  loaded: true,
  ...
}
```
Node.js 的模块机制实现就是参照了 CommonJS 的标准。但是 Node.js 额外做了一件事，即为每个模块提供了一个 exports 变量，以指向 module.exports，这相当于在每个模块最开始，写有这么一行代码：
```js
var exports = module.exports;
```
:::tip
* 模块可以多次加载，但是只会在第一次加载时运行一次，然后运行结果就被缓存了
* 以后再加载，就直接读取缓存结果。
* 要想让模块再次运行，必须清除缓存。
:::

## AMD
CommonJS 规范很好，但是不适用于浏览器环境，于是有了 AMD 和 CMD 两种方案。AMD 全称 Asynchronous Module Definition，即异步模块定义。它采用<strong>异步方式加载模块，模块的加载不影响它后面语句的运行</strong>。所有依赖这个模块的语句，都定义在一个回调函数中，等到加载完成之后，这个回调函数才会运行。除了和 CommonJS 同步加载方式不同之外，AMD 在模块的定义与引用上也有所不同。
```js
define(id?, dependencies?, factory);
```

[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) 的模块引入由 define 方法来定义，在 define API 中：
* id：模块名称，或者模块加载器请求的指定脚本的名字；
* dependencies：是个定义中模块所依赖模块的数组。如果省略，则默认为 ["require", "exports", "module"]
* factory：为模块初始化要执行的函数或对象。如果为函数，它应该只被执行一次。如果是对象，此对象应该为模块的输出值
```js
// 1 创建一个名为 “alpha” 的模块，使用了require，exports，和名为 “beta” 的模块
define("alpha", ["require", "exports", "beta"], function (require, exports, beta) {
  exports.verb = function() {
    return beta.verb();
    // 或者
    return require("beta").verb();
  }
});

// 2. 不存在依赖。直接定义模块的函数或对象
define({
  add: function(x, y){
    return x + y;
  }
});

// 3. require([module], callback); 第一个数组为要加载的模块，第二个参数为回调函数
require(['math'], function (math) {
  math.add(2, 3);
});
```

## CMD

[CMD](https://github.com/seajs/seajs/issues/242) 全称为 Common Module Definition，是 Sea.js 所推广的一个模块化方案的输出。在 CMD define 的入参中，虽然也支持<code>define(id?, deps?, factory)</code>，但推荐<code>define(factory)</code>，factory 方法在执行时，默认会传入三个参数：require、exports 和 module：
```js
// CMD写法
define(function(require, exports, module) {
  var a = require('./a');
  a.doSomething();
  var b = require('./b'); 
  b.doSomething();
  ...
})

// AMD写法
define(['./a', './b'], function(a, b) {  
  a.doSomething();
  b.doSomething();
  ...
})
```
AMD与CMD的不同：
1. 对于依赖的模块，AMD 是提前执行，CMD 是延迟执行
2. CMD 推崇依赖就近，AMD 推崇依赖前置。


## UMD
UMD，全称 Universal Module Definition，即通用模块规范。既然 CJS 和 AMD 风格一样流行，那么需要一个可以统一浏览器端以及非浏览器端的模块化方案的规范。

直接来看看官方给出的 jQuery 模块如何用 UMD 定义的代码：
```js
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = function( root, jQuery ) {
            if ( jQuery === undefined ) {
                // require('jQuery') returns a factory that requires window to
                // build a jQuery instance, we normalize how we use modules
                // that require this pattern but the window provided is a noop
                // if it's defined (how jquery works)
                if ( typeof window !== 'undefined' ) {
                    jQuery = require('jquery');
                }
                else {
                    jQuery = require('jquery')(root);
                }
            }
            factory(jQuery);
            return jQuery;
        };
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.fn.jqueryPlugin = function () { return true; };
}));
```
## UMD的实现
1. 先判断是否支持 AMD（define 是否存在），存在则使用 AMD 方式加载模块；
2. 再判断是否支持 Node.js 模块格式（exports 是否存在），存在则使用 Node.js 模块格式；
3. 前两个都不存在，则将模块公开到全局（window 或 global）；

## ES Modules
ES Modules 的模块化设计思想是尽量的静态化，使得<code>编译时就能确定模块的依赖关系</code>. ES Module由 <code>export</code> 和 <code>import</code> 组成。我们可以这样定义一个模块：
```js
// 第一种方式
export var firstName = 'Michael';
export var lastName = 'Jackson';
export var year = 1958;

// 第二种方式
var firstName = 'Michael';
var lastName = 'Jackson';
var year = 1958;

export { firstName, lastName, year };
```
然后再这样引入他们：
```js
import { firstName, lastName, year } from 'module';
import { firstName as newName } from 'module';
import * as moduleA from 'module';
```

## export default本质
除以上两种命令外，还有一个 export default 命令用于指定模块的默认输出（一个模块只能有一个默认输出）。
如果使用了 export default 语法，在 import 时则可以任意命名。
由于 export default 命令的<code>本质是将default后面的值，赋给 default 变量</code>. 当然，引用方式也存在多种：
```js
import { default as foo } from 'module';
import foo from 'module';
```

## 面试
问：你知道的 js 模块化方案有哪些?

答：有CJS, AMD, CMD, ESModule。
* cjs使用require('xxx')同步加载模块，导出使用module.exports或exports，一般用于nodejs. 
* AMD(CMD) 是异步加载模块，一般用于浏览器
* ESModule使用import导入，export或者export default导出。ESModule有静态模块结构(static-module-structure)特点，在编绎时就能确定导入与导出

问：为什么同步的 Commonjs 要用在 node, 异步的 AMD 要用在前端呢?
* node程序 运行在服务器上，可以直接读取本地各模块文件。响应快。
* 前端项目运行在浏览器中，js,css,html模块都要通过http/https请求来获取，用户对响应有高要求。不能用同步的方式，否则会出现'卡死'的情况

问：ES6 模块与 CommonJS 模块的差异？

答：
1. CommonJS 模块输出的是一个值的拷贝，ES6 模块输出的是值的引用
2. CommonJS 模块是运行时加载，ES6 模块是编译时输出接口


问: 那你听过 webpack 吗? 知道 webpack 是怎么实现模块化的吗?

使用cjs编写模块时，webpack是这样实现的
1. 定义\_\_webpack_modules__对象，以模块ID为key, 模块方法为value. 使用\_\_webpack_require__来加载模块，参数为模块id
2. 如果 模块 已经在缓存中，直接返回缓存模块的exports. 否则执行模块id对应的模块方法。模块方法给它的module.exports赋值。
3. 最终webpack_require 返回已赋值的module.exports。
4. 总结来说，webpack使用了\_\_webpack_require__实现了cjs规范的require. 实现了模块化

更多可参考：[webpack模块化加载原理](../../buildTools/webpack/__webpack_require__.md)
