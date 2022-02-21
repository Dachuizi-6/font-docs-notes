## 解析CSS
```javascript
module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: __dirname + '/dist'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        // loader 运行顺序为从右到左或者从下到上
        use: [
          "style-loader",  // 将样式通过 style 标签插入到 head 中
          "css-loader"     // 加载 css 文件，转化为 commonjs 对象
          "less-loader"    // 转换 less 文件为 css 文件
        ]
      }
    ]
  }
}
```

## 热更新原理（简述）

你编译出的bundle.js文件包含两个部分：hmr runtime和你的js代码。而webpack的dev server中包含一个hmr server，它能够和浏览器中的bundle.js建立websocket连接，当你的js代码发生变化，hmr server会建立一个说明变化内容的json发送到浏览器端的hmr runtime，runtime接收到变化会主动去更新你的js代码，你的页面也就发生变化了
![webpack热更新](@assets/webpack/4.png)

* 初始化阶段：1、2、A、B
* 更新阶段：1、2、3、4、5

深入：https://juejin.cn/post/6844904008432222215#heading-7
https://zhuanlan.zhihu.com/p/138446061

## 代码压缩(webpack5)
* css：[CssMinimizerWebpackPlugin](https://webpack.js.org/plugins/css-minimizer-webpack-plugin/)
* js: [TerserWebpackPlugin](https://webpack.js.org/plugins/terser-webpack-plugin/) webpack5自带最新版的terser-webpack-plugin插件
```javascript
  optimization: {
    minimize: true,
    minimizer: [
      new TerserWebpackPlugin(),
      new CssMinimizerPlugin(),
    ]
  }
```

## 自动清理构建目录
const { CleanWebpackPlugin } = require("clean-webpack-plugin")

## 资源内联
资源内联（inline resource），就是将一个资源以内联的方式嵌入进另一个资源里面。

CSS 内联的思路是：
* 先将 css 提取打包成一个独立的 css 文件（使用MiniCssExtractPlugin.loader）
* 然后读取提取出的 css 内容注入到页面的 style 里面去。这个过程在构建阶段完成

如：CSS 内联图片: 通常将小图片通过 base64 的方式内嵌进 CSS 里面
```css
.search {
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABJ0lEQVQ4T6XSsUoEMRAG4H/ClZaLmbSW1pZ6+gAnFrK+gZXoK6jvIILgE6gIcnYWgmJno6AgYp1Z2EcIGQnsHbuaQ9abMkO+TGaGMGfQnPfxC3DOrajqPoB1AArgnohOvffPucc6ADMfAjgCUMYYH9MFY8wagEsAxyKScp2YAtbaERGNRST7LWZWVd2squq2LbSBMyK6E5GrXKnW2i1jzMh7v5sFmPkzhDCs69rngKIo3GAweBKRpVnAVwhh9Q/gRUQWs4Bz7jzGeFNV1ThXATOXAA5EJDV1Gr2aSETb3vvrLJAOmTmNKY2yVNUHVSVjzBDABYA3ADsi8j4TSIlmkfYAbABYUNUPACdE9NpAHaTXKjPz8k+kF9B8s4P0BibIpBf/AtpN/AYx54AR58WxmQAAAABJRU5ErkJggg==) no-repeat;
}
```
* HTML 和 JS 内联
* HTML 和 CSS 内联：[html-inline-css-webpack-plugin](https://github.com/Runjuu/html-inline-css-webpack-plugin#readme)
![css-inline](@assets/webpack/9.png)
* 图片、字体内联：url-loader。limit属性

## 多页面应用（MPA）打包
基本思路：每一个页面对应一个 entry ，一个 html-webpack-plugin

通用方案：利用 glob.sync() 动态获取 entry 和设置 html-webpack-plugin 数量
```js
const setMPA = () => {
  const entry = {}
  const htmlWebpackPlugins = []
  const entryFile = glob.sync(path.join(__dirname, 'src/*/index.js'))
  Object.values(entryFile).map(filePath => {
    const match = filePath.match(/src\/(.*)\/index/)
    const pageName = match && match[1]
    htmlWebpackPlugins.push(
      new HtmlWebpackPlugin({
        template: path.join(__dirname, `src/${pageName}/index.html`),
        filename: `${pageName}.html`,
        chunks: [`${pageName}`],
        // inject: true,
        // minify: {
        //   html5: true,
        //   collapseWhitespace: true,
        //   preserveLineBreaks: false,
        //   minifyCSS: true,
        //   minifyJS: true,
        //   removeComments: false
        // }
      })
    )
    entry[pageName] = filePath
  })
  return {
    entry,
    htmlWebpackPlugins
  }
}
```

## source map
1. 作用：通过 source map 定位到源码
2. 开发环境开启，线上环境关闭
    * 线上排查问题的时候可以将 source map 上传到监控系统
### source map 关键字
* source map: 产⽣ .map ⽂件
* eval: 使⽤ eval 包裹模块代码
* cheap: 不包含列信息
* inline: 将 .map 作为 DataURI 嵌⼊，不单独⽣成 .map ⽂件
* module: 包含 loader 的 sourcemap

参考：[使⽤ source map](https://blog.csdn.net/kaimo313/article/details/107007572)

[source map深入](../other/error.md)

## 提取页面公共资源
方法一：利用external + cdn，可参考[webpack系列-externals配置使用（CDN方式引入JS）](https://www.cnblogs.com/moqiutao/p/13744854.html)

方法二：利⽤ [SplitChunksPlugin](https://webpack.docschina.org/plugins/split-chunks-plugin/) 进⾏公共资源分离
```js
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: { // 缓存组
        commons: {
          test: /(react|react-dom)/,
          name: 'vendors', // 拆分 chunk 的名称
          chunks: 'all' // all 可能特别强大, chunk 可以在异步和非异步 chunk 之间共享
        }
      }
    }
  }
```
* minChunks: 默认(1) 拆分前必须共享模块的最小 chunks 数
* minSize: 默认(20000byte 约 20k ) 生成 chunk 的最小体积（以 bytes 为单位）
![分离前](@assets/webpack/10.png)
![分离后](@assets/webpack/11.png)

## tree shaking
Tree shaking 是一种通过清除多余代码方式来优化项目打包体积的技术，专业术语叫 Dead code elimination

1 个模块可能有多个⽅法，只要其中的某个⽅法使⽤到了，则整个⽂件都会被打到 bundle ⾥⾯去，tree shaking 就是<code>只把⽤到的⽅法打⼊ bundle</code>。webpack 在生产环境 默认支持 tree shaking.

### DCE (Dead code elimination)一般具有以下几个特征
* 代码不会被执⾏，不可到达
* 代码执⾏的结果不会被⽤到
* 代码只会影响死变量（只写不读）

CommonJS规范得在实际运行时才能确定需要或者不需要某些模块
### tree shaking原理
生产环境默认开发tree sharking。依赖于ES6 moudel特性
* 由于ES6 module <code>静态结构(static-module-structure)</code>的特点。在[静态编译](https://exploringjs.com/es6/ch_modules.html#static-module-structure)时，就能确定模块的依赖关系，从而知道加载了那些模块
* 静态分析程序流，判断那些模块和变量未被使用或者引用，进而删除对应代码

### 副作用
副作用：执行一个函数会、可能会对函数外部变量（全局变量、函数外的变量等） 产生影响，就叫副作用
1. webpack只会在压缩代码时才会起作用。eg: 生产环境或开发环境+terser
```js
const TerserPlugin = require("terser-webpack-plugin")
mode: 'development',
// 生产环境无需做如下配置，就能tree sharking
optimization: {
  usedExports: true,
  minimize: true,
  minimizer: [new TerserPlugin()],
},
```
2. babel的modules：false 。Setting this to false will preserve ES module 设置为false，babel编译后保留esm
```js
["@babel/preset-env", {
  "modules": false
  // "modules": "commonjs" // 这种无法tree sharking
}],
```
3. package.json中 "sideEffects": false。表示所有文件都没有副作用，全都可tree sharking
4. 由于<code>import '...（路径）'</code>会被tree sharking，如果引入全局样式，样式代码被sharking了，显然错误。
```js
// 不对数组的文件做tree sharking
"sideEffects": [
  "*.css",
  "*.less"
]
```

[聊一聊面试中经常被问到的Tree Shaking](https://mp.weixin.qq.com/s/n3nwV-OtLKB-_SHl8Tc3Sg)

## [scope hoisting](https://webpack.docschina.org/configuration/optimization/#optimizationconcatenatemodules)原理
原因：打包时webpack的权衡之一是将每个模块都将包裹在单独的函数闭包中。这些包装函数使您的JavaScript在浏览器中执行的速度变慢。
原理：相比之下，如Closure Compiler和RollupJS之类的工具可以 “提升(hoist)” 或将所有模块的代码按照引用顺序放在⼀个闭包函数中，从而使您的代码在浏览器中具有更快的执行时间

生产环境默认使用scope hoisting，打包后的代码对比如下。可以看出使用scope hoisting，减少了包裹代码，减少了打包后的bundle大小。

```js
plugins: [
  new webpack.optimize.ModuleConcatenationPlugin()
]
```
将mode设为 'none'，打包：

```js
/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 21:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "common": function() { return /* binding */ common; }
/* harmony export */ });
function common() {
  return 'common module';
}

/***/ }),

/***/ 20:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "helloworld": function() { return /* binding */ helloworld; }
/* harmony export */ });
function helloworld() {
  return 'Hello webpack';
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
!function() {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _helloworld__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);
/* harmony import */ var _common_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);


console.log('common', (0,_common_index_js__WEBPACK_IMPORTED_MODULE_1__.common)());
console.log('helloworld()', (0,_helloworld__WEBPACK_IMPORTED_MODULE_0__.helloworld)());
document.write((0,_helloworld__WEBPACK_IMPORTED_MODULE_0__.helloworld)());
}();
/******/ })()
;
```


将mode设为 'none' 并使用 new webpack.optimize.ModuleConcatenationPlugin()，打包：
```js
/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

;// CONCATENATED MODULE: ./src/test/helloworld.js
function helloworld() {
  return 'Hello webpack';
}
;// CONCATENATED MODULE: ./common/index.js
function common() {
  return 'common module';
}
;// CONCATENATED MODULE: ./src/test/index.js


console.log('common', common());
console.log('helloworld()', helloworld());
document.write(helloworld());
/******/ })()
;
```

### 进⼀步分析 webpack 的模块机制
[篇幅较多，单独讲](./__webpack_require__.md)

## 懒加载
也称 [按需加载](https://webpack.docschina.org/guides/lazy-loading/)
加快了应用的初始加载速度，减轻了它的总体体积，加快首屏渲染速度。因为某些代码块可能永远不会被加载
```js
// text.js
import React from 'react'
export default () => <div>动态 import</div>
```
```js
  loadComponent() {
    import('./text').then(Text => {
      console.log(Text);
      this.setState({
        Text: Text.default
      })
    })
  }
  // ...省略
  <img src={logo} onClick={ this.loadComponent.bind(this) } />
```
点击图片时，才动态加载
![lazy-load](@assets/webpack/15.png)

## 构建信息显示
stats：统计信息，生产模式直接设置 stats: "errors-only"，开发模式在 devServer: { stats: "xxx" }
1. errors-only：只在发生错误时输出
2. minimal：只在发生错误或新的编译开始时输出
3. none：没有输出
4. normal：标准输出
5. verbose：全部输出

## 优化命令行构建日志
使用 [friendly-errors-webpack-plugin](https://www.npmjs.com/package/friendly-errors-webpack-plugin)
* success：构建成功时的日志
* warning：构建警告时的日志
* error：构建失败时的日志
```js
module.exports = {
  plugins: [
    new FriendlyErrorsWebpackPlugin()
  ],
  stats: "errors-only"
}
```
![error](@assets/webpack/22.png)


## 构建异常中断处理
如何判断构建是否成功？
在 CI/CD 的 pipline 或者发布系统需要知道当前构建状态

每次构建完成后输⼊ echo $? 获取错误码

如何主动捕获并处理构建错误？
compiler 在每次构建结束后会触发 done 这个 hook
```js
function() {
  this.hooks.done.tap('done', stats => {
    // console.log('stats', stats)
    console.log('stats.compilation.errors', stats.compilation.errors)
    console.log('length', stats.compilation.errors.length)
    if(stats.compilation.errors && 
        stats.compilation.errors.length
    ) {
      console.log("Build Error");
      process.exit(1);  // 非 0 表示失败
    }
  })
}
```
![comiler-done](@assets/webpack/23.png)

## 构建分析
### 初级分析
运行命令，就会在根目录生成一个stats.json文件，可以查看分析结果。这种方式只是初级分析，颗粒度较大。
```js
"build:stats": "webpack --config webpack.prod.js --json > stats.json"
```
### 速度分析
```js
// 安装
npm install --save-dev speed-measure-webpack-plugin

// 使用方式
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
 
const smp = new SpeedMeasurePlugin();
const webpackConfig = smp.wrap({
  plugins: [
    new MyPlugin(),
    new MyOtherPlugin()
  ]
});
```
配置好之后，运行打包命令的时候就可以看到每个loader 和插件执行耗时

### 体积分析
```js
// 安装
npm install --save-dev webpack-bundle-analyzer

// 使用
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
 
module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ]
}
```

## 资源并行解析
### thread-loader
原理：每次 webpack 解析一个模块，thread-loader 会将它及它的依赖分配给 worker 线程中。
```js
// 使用方式
module.exports={
    ...
    module:{
        rules:[
        {
            test:/\.js$/,
            use:[{
                loader:'thread-loader',
                options:{
                    workers: 3
                }
            },
            'babel-loader'
            ]
        }]
    }
    ...
}
```
### terser-webpack-plugin
parallel: true，默认使用多进程并发运行以提高构建速度
```js
npm install terser-webpack-plugin --save-dev
const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },
};
```

## DLL
思路：分享基础包。将 react、react-dom、redux、react-redux 等打包成一个文件
方法：使用 <code>DLLPlugin</code> 进行分包，<code>DLLReferencePlugin</code> 对 manifest.json 引用
```js
// webpack.dll.js
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        library: [
            'react',
            'react-dom'
        ]
    },
    output: {
        filename: '[name]_[chunkhash].dll.js',
        path: path.join(__dirname, 'build/library'),
        library: '[name]'
    },
    plugins: [
        new webpack.DllPlugin({
            name: '[name]_[hash]',
            path: path.join(__dirname, 'build/library/[name].json')
        })
    ]
};
```

```js
// package.json
"dll": "webpack --config webpack.dll.js",
// webpack.conf.js
plugins: [
  new webpack.DllReferencePlugin({
    manifest: require('./build/library/library.json')
  })
]
```

## 缓存二次构建提速
利用缓存提升二次构建速度
* babel-loader 开启缓存
* terser-webpack-plugin 开启缓存
* 使用 cache-loader 或者 hard-source-webpack-plugin

## 缩小构建目标
1. 比如babel-loaader不去解析node_modules
```js
module.exports={
  module:{
    rules:[
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: 'node_modules'
      }
    ]
  }
}
```
2. 减少文件搜索范围
```js
module.exports = {
  resolve: {
    alias: {
      react: path.resolve(__dirname, "./node_modules/react/dist/react.min.js")
    },
    modules: [path.resolve(__dirname, "node_modules")],  // 减少模块搜索层级
    extensions: [".js"],
    mainFields: ["main"]  // 查找时直接找 package.json 的 main 字段
  }
}
```


## 面试
问：说说less-loader、css-loader、style-loader的作用

答：
style-loader：插入样式是一个动态的过程，你可以直接查看打包后的 html 源码并不会看到 html 有 style 样式的。style-loader 是webpack运行时动态的创建 style 标签，然后将 css style 插入到 style 标签里面去，对应的源码：https://github.com/webpack-contrib/style-loader/blob/master/src/runtime/injectStylesIntoStyleTag.js#L260

css-loader：将 css 转换成 commonjs 对象，也就是样式代码会被放到 js 里面去了。

问：为什么可以实现 Tree Shaking？

答：ES6 module 在静态编译时，就能确定模块的依赖关系，从而知道加载了那些模块
```js
// demo.js
export const a = 'a';
export const b = 'b';

// test.js
import { a } from './demo.js';

// 以上代码不运行，仅仅经过扫描分析，抛弃了 const b，代码缩减了 size
// 这就是 Tree Shaking 的静态分析基本原理：有引用就保留，没有引用就抛弃
```

问：下面哪种情况会 Tree Shaking？
```js
// 全部导入
import _ from 'lodash';

// 具名导入
import { debounce } from 'lodash';

// 直接导入具体模块
import debounce from 'lodash/lib/debounce';
```

答：
第一种的 全部导入 是不支持 Tree Shaking 的，其他都支持。

为什么呢？因为当你将整个库导入到单个 JavaScript 对象中时，就意味着你告诉 Webpack，你需要整个库，这样 Webpack 就不会摇它。

问：说说webpack懒加载原理

答：
[篇幅较多，单独讲](./lazy-load.md)