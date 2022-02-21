## plugin介绍
plugin赋予其各种灵活的功能，例如打包优化、资源管理、环境变量注入等，它们会运行在 webpack 的不同阶段（钩子 / 生命周期），贯穿了webpack整个编译周期

```js
// webpack/lib/Compiler.js
if (Array.isArray(plugins)) {
  for (const plugin of plugins) {
    plugin.apply(childCompiler);
  }
}
```
由上面部分源码，可知plugin本质上是一个拥有<code>apply方法</code>的JS对象，apply 方法 传入<code>compiler</code>参数

明白了插件的结构后，接下来以webpack hook的emit钩子为例，讲下异步事件钩子([async event hooks](https://webpack.js.org/contribute/writing-a-plugin/#tapasync))
```js
// tapAsync: 异步事件钩子
compiler.hooks.emit.tapAsync('HelloAsyncPlugin', (compilation, callback) => {
    // Do something async...
    setTimeout(function () {
      console.log('Done with async work...');
      callback();
    }, 1000);
  }
)
// tapPromise 也是异步事件钩子
compiler.hooks.emit.tapPromise('HelloAsyncPlugin', (compilation, callback) => {
    // Do something async...
    return new Promise((resolve, reject) => {
      setTimeout(function () {
        console.log('Done with async work...');
        resolve();
      }, 1000);
    })
  }
)
```

webpack编译过程的hook钩子。更多[Compiler Hooks](https://webpack.js.org/api/compiler-hooks/)
* beforeRun: 在运行编译器之前添加一个钩子
* run: Hook into the compiler before it begins reading records
* compiler: 在创建新的compilation之前，在beforeCompile之后立即调用
* compilation: Runs a plugin after a compilation has been created. (compilation创建之后)
* make: 在compilation完成之前执行
* emit: 在将内存中 assets 内容写到output目录之前
* after-emit: 在将内存中 assets 内容写到磁盘文件夹之后
* done: 完成所有的编译过程
* fail: 编译失败的时候


插件[demo](https://github.com/0zcl-free/webpack-loader-vs-plugin)
```js
const JSZip = require('jszip')
const path = require('path')
const RawSource = require('webpack-sources').RawSource
const zip = new JSZip()

module.exports = class ZipPlugin {
  constructor(options) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('ZipPlugin', (compilation, callback) => {
      console.log('options', this.options, compilation.assets)
      const folder = zip.folder(this.options.filename)
      for (let filename in compilation.assets) {
        const source = compilation.assets[filename].source()
        folder.file(filename, source)
      }

      zip.generateAsync({
        type: 'nodebuffer'
      }).then(content => {
        console.log('content', content)
        const outputPath = path.join(compilation.options.output.path, this.options.filename + '.zip')
        console.log('outputPath', outputPath)
        const outputRelativePath = path.relative(
          compilation.options.output.path,
          outputPath
        )
        console.log('outputRelativePath', outputRelativePath)
        compilation.assets[outputRelativePath] = new RawSource(content)
        
        callback()
      })

    })
  }
}
```


## 面试
问：是否写过 Plugin？简单描述一下编写 Plugin 的思路？
* 插件是在webpack编译的不同的生命周期做功能扩展
* 插件本质上是一个拥有apply方法的JS对象。因为webpack源码中是遍历plugins数组，执行每个plugin.apply(compiler), 并给apply方法传入compiler对象
* compiler对象提供了webpack整个生命周期相关的钩子(compiler hooks), 因此可以利用compiler.hooks在不同生命周期做功能扩展

问：webpack 中 loader 和 plugin 的区别是什么

答：
* loader是做文件转换，把A文件转换成B文件
* plugin基于tapable事件机制，在webpack编译的生命周期节点做功能扩展