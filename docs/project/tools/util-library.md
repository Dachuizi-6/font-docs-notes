## 实现
工程上还是很全面的。采用了tsc做<code>类型检查</code>，ts来做<code>代码编译</code>。当然使用babel来做代码编译也是可以的，babel方案可见h5-sdk

![project](@assets/project/4.png)

![project](@assets/project/5.png)

1. 构建。缩短构建时间。使用webpack来打包，ts-loader进行代码编译，<code>transpileOnly: true</code>关闭打包构建时ts-loader的类型检查，然后使用<code>fork-ts-checker-webpack-plugin插件</code>，fork-ts插件会在单独的进程来做ts类型检查。缩短构建时间

```js
// build/webpack.config.js
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const path = require('path')

module.exports = {
  entry: './src/index.ts',
  output: {
    libraryTarget: 'umd',
    library: 'utilsLibrary',
    libraryExport: 'default',
    filename: 'utils-library.js',
    path: path.resolve(__dirname, '../dist')
  },
  // devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/i,
        use: [{
          loader: 'ts-loader',
          options: {
            // 使用此选项，会关闭类型检查. 缩短使用 ts-loader 时的构建时间.
            transpileOnly: true,
            configFile: path.resolve(__dirname, '../tsconfig.json')
            // 给.vue文件加上.ts后缀，方便ts-loader处理
            // appendTsSuffixTo: [/\.vue$/]
          }
        }],
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin()
  ]
}
```
注意了。<code>libraryExport: 'default'</code>是必需的，因为src/index.ts中，是通过<code>export default</code>导出的
```js
import { Obj } from '../types'
const cache: Obj = {}

function importAll (r: __WebpackModuleApi.RequireContext): void {
  r.keys().forEach((key: string) => {
    if (key === './index.ts') return
    const fnName: string = key.split('/').pop() || ''
    const fnKey: string = fnName.split('.')[0]
    cache[fnKey] = r(key).default
  })
}

importAll(require.context('./', true, /\.ts$/))

export default cache
```
2. 拓展性强。在index.ts中，使用了webpack的[require.context](https://webpack.docschina.org/guides/dependency-management/#requirecontext)，最终导出的对象的<code>key是src目录下的文件名，value是文件对应的函数</code>。在添加新的函数时，只需创建新的文件，并在文件中导出函数即可。



## 总结
在开发进程中，经常在一个或者多项目开发时多次使用常用的函数，导致代码冗余，维护困难。希望封装公共函数库，统一维护常用的函数。我独立负责函数库的开发，并且发包。使用了webpack+ts-loader进行构建打包；采用一个.ts文件对应一个函数的形式，最终在src/index抛出封装好的对象，key为文件名，value为文件对应的函数。函数库上线后，在B端和H5广泛使用，提高了开发效率。
