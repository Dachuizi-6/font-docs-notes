## 场景
发现团队成员在开发新项目时，需要发费时间在新项目的搭建上，不熟悉<code>前端工程化</code>的同事花在项目搭建的时间会很长。为了提效，统一维护各种模版，利用<code>zcl-cli脚手架</code>快速选择合适脚手架下载到本地，并自动安装依赖包。

<code>zcl-cli脚手架</code>后续可添加功能来支撑开发。

## 实现
第三方工具库：
* [commander](https://github.com/tj/commander.js/blob/HEAD/Readme_zh-CN.md#%e5%bf%85%e5%a1%ab%e9%80%89%e9%a1%b9): node.js命令行工具
* [inquirer](https://github.com/SBoudrias/Inquirer.js#readme)：交互式命令行集合
* [chalk](https://github.com/chalk/chalk): 命令行字符样式美化
* [ora](https://www.npmjs.com/package/ora)：命令行Loading动画效果
* [download-git-repo](https://www.npmjs.com/package/download-git-repo): 下载git仓库
* [metalsmith](https://www.npmjs.com/package/metalsmith): 静态资源生成器。有插件机制
* [Handlebars](https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access): 模版编译。
* [fs-extra](https://www.npmjs.com/package/fs-extra)：fs有的fs-extra都有，很多的支持Async/await

设计
![zcl-cli](@assets/project/zcl-cli.png)

:::tip
package.json的[bin字段](https://www.npmjs.cn/files/package.json/#bin)：bin字段提供命令名到本地<code可执行文件</code>的映射。cmd下输入<code>zcl</code>，即可执行<code>./bin/zcl</code>文件。

./bin/zcl 前面要加上<code>#!/usr/bin/env node</code>，确保用node来执行文件
```js
  "bin": {
    "zcl": "./bin/zcl"
  }
```
:::
## 难点
### 1. 本地测试

![link](@assets/project/29.png)

本地调试代码是必须的，总不能改一下代码，再发包测试吧。要实现本地测试很简单，不过这里和各位深入理解下<code>package.json的bin字段</code>和<code>npm link</code>

前面官网说了，有了bin字段，就可以在命令行输入<code>zcl</code>，即可执行<code>./bin/zcl</code>文件。深入一下，为什么命令行输入zcl就能执行<code>./bin/zcl</code>？

* 实际上, 如果包的package.json存在bin字段，局部安装时，会在<code>./node_modules/.bin/</code>下，生成zcl可执行文件；全局安装时，会在<code>C:\Users\zhangchengliang\AppData\Roaming\npm</code>下生成可执行文件<code>zcl.cmd</code>，zcl.cmd会去执行<code>\node_modules\zcl-cli\bin\zcl</code>文件。

![zcl.cmd](@assets/project/30.png)
```js
// C:\Users\zhangchengliang\AppData\Roaming\npm\zcl.cmd
"%_prog%"  "%dp0%\node_modules\zcl-cli\bin\zcl" %*
```
* 在<code>zcl-cli</code>包内，执行npm link，会在全局npm/node_modules/下生成软链接，指向<code>zcl-cli</code>包

本地测试：只需在<code>zcl-cli</code>包执行npm link，然后在代码中打断点，就可以本地调试了

### 2. 模版编译
Metalsmith works in three simple steps:
1. Read all the files in a source directory.
2. Invoke a series of plugins that manipulate the files.
3. Write the results to a destination directory!

模版使用template分支来维护模版，为了编译时替换，用括号括起来
```js
{
  "name": "{{projectName}}",
  "version": "{{projectVersion}}",
  "description": "{{projectDescription}}",
  // ...
}
```
Metalsmith做资源的生成；Handlebars做编译，替换package.json中的变量。
```js
const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const { logger } = require('./utils')
const rm = require('rimraf').sync
const path = require('path')

class Generator {
  constructor() {
    this.metalsmith = Metalsmith(process.cwd())
    this.config = {}
  }
  
  run(config) {
    this.config = config
    const { metadata, sourceName, destination } = this.config
    this.metalsmith = this.metalsmith.metadata(metadata) // metadata 为用户输入的内容
      .clean(false)
      .source(sourceName)
      .destination(destination)
      .use(this.generateTemplate)
      .build(err => {
        rm(path.resolve(process.cwd(), sourceName))
        if (err) {
          logger.error(`Metalsmith build error: ${err}`)
         }
      })
  }

  generateTemplate(files, metalsmith, done) {
    console.log('metadata', metalsmith.metadata())
    Object.keys(files).forEach(fileName => { //遍历替换模板
      try {
        // 字体文件、图片等不能用 handlebar 替换: https://www.jianshu.com/p/a8804047d4ed
        // if (!/\.(ico|png|jpe?g|gif|svg)$/.test(fileName) || !/\.(woff2?|eot|ttf|otf)$/.test(fileName)) {
        // 只替换package.json部分
        if (fileName === 'package.json') {
          const fileContentsString = files[fileName].contents.toString()
          files[fileName].contents = new Buffer.from(Handlebars.compile(fileContentsString)(metalsmith.metadata()))
        }
      } catch (err) {
        logger.error(`fileName------------${fileName}`);
        logger.error(`err -------------${err}`);
      }
     })
    done()
  }
}

module.exports = Generator
```

## 总结
在开发新项目时，需要花费较长的时间在搭建项目上，通过维护公用的模版，开发团队内部使用的脚手架(命令行工具)，达到快速下载模版，减少项目搭建时间，提高开发效率。


1. 怎么实现一个自定义脚手架？
2. 怎么自定义一个Vue-Cli的项目模版？

<style>
img {
    max-width: 100%!important;
}
</style>


[基于node.js的脚手架工具开发经历](https://juejin.cn/post/6844903526947110919#heading-9)