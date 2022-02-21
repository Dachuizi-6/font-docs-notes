
### 文件指纹如何生成
* Hash：和整个项目的构建相关，webpack打包阶段会生成Compiler，Compilation。webpack启动那一次，会生成Compiler（初始化一次）。但是每一次只要项目文件有修改，，Compilation都会发生变化。Compilation变换就会影响Hash的变换，整个项目构建的 hash 值就会更改。
* Chunkhash：采用hash计算的话，每一次构建后生成的哈希值都不一样，即使文件内容压根没有改变。Chunkhash根据不同的入口文件(Entry)进行依赖文件解析、构建对应的chunk，生成对应的哈希值。公共库采用chunkhash的方式生成哈希值，那么只要我们不改动公共库的代码，就可以保证其哈希值不会受影响
* Contenthash：文件内容不变，则 contenthash 不变。通常对css资源使用Contenthash。这个时候可以使用mini-css-extract-plugin里的contenthash值，保证即使css文件所处的模块里就算其他文件内容改变，只要css文件内容不变，那么不会重复构建

### JS 的文件指纹设置
设置 output 的 filename，使用 [chunkhash]，或[contenthash]
```javascript
module.exports = {
    entry: {
        app: './src/app.js',
        search: './src/search.js'
    },
    output: {
        filename: '[name][chunkhash:8].js',
        path: __dirname + '/dist'
    }
};
```
### CSS 的文件指纹设置
设置 MiniCssExtractPlugin 的 filename，使用 [contenthash]
MiniCssExtractPlugin：将css资源提取到一个独立的文件。
```javascript
module.exports = {
    entry: {
        app: './src/app.js',
        search: './src/search.js'
    },
    output: {
        filename: '[name][chunkhash:8].js',
        path: __dirname + '/dist'
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: `[name][contenthash:8].css`
        }),
    ]
};
```
### 图片，字体文件的文件指纹设置
设置 file-loader（或url-loader） 的 name，使用 [hash]

| 占位符名称 | 含义 |
|  ----  | ----  |
| [ext]	| 资源后缀名
| [name] | 文件名称
| [path] | 文件的相对路径
| [floder] | 文件所在文件夹
| [contenthash] | 文件的内容hash，默认是md5生成
| [hash] | 文件内容hash，默认是md5生成。图片的hash和css/js资源的hash概念不一样，图片的hash是由图片内容决定的
| [emoji] | 一个随机的指代文件内容的emoji

:::tip
图片，字体文件的hash和css/js资源的hash概念不一样，图片，字体文件的hash是由内容决定的
:::

```javascript
const path = require('path');
module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: 'img/[name][hash:8].[ext] '
                    }
                }]
            }
        ]
    }
};
```
### Webpack 具体配置信息
```javascript
module.exports = {
    entry: {
        index: './test/test.js',
        about: './test/about.js'
    },
    output: {
        //打包文件名称  chunkhash:8设置js资源的文件指纹
        filename: '[name].[chunkhash:8].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [{ loader: MiniCssExtractPlugin.loader }, 'css-loader']
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'file-loader',
                query: {
                    // 设置图片资源的文件指纹 使用hash
                    name: '[name].[ext]?[hash]',
                    outputPath: 'static/img/',
                    publicPath: '/dist/static/img/'
                }
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,//解析字体
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name]_[hash:8].[ext]',//设置字体资源的文件指纹 使用hash
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            // 将css资源提取到一个独立的文件
            // 设置css资源的文件指纹 用contenthash
            filename: '[name].[contenthash:8].css',
            chunkFilename: '[id].css'
        }),
    ]
}
```

 ## 面试
 问：文件指纹是什么？怎么用？

 答：
 
 文件指纹是 打包后输出文件名的后缀。
 文件指纹的生成 有hash、chunkhash、contenthash三种方式。
 1. hash和整个项目的构建有关，只要项目文件有修改，hash值就会更改；
 2. chunkhash根据不同的入口文件【entry】进行依赖文件解析，构建对应的chunk，生成对应的哈希值，不同的entry会生成不同的chunkhash, entry入口依赖的文件有修改，则chunkhash也会更改；
 3. contenthash 文件内容不变，contenthash不变。

#### 实际应用上 
chunkhash: 生产环境里把公共库和程序入口文件 区分开，单独打包构建，使用chunkhash来生成公共库的文件指纹。只要我们不改动公共库的代码，就可以保证其文件指纹不会受影响
```javasciprt
  output: {
    filename: "[name][chunkhash:8].js",    // JS 指纹设置，设置 output 的 filename，用 chunkhash
    path: __dirname + '/dist'
  },
```
contenthash: 通常对css资源使用contenthash，可以使用mini-css-extract-plugin单独抽取的CSS文件，设置filename使用contenthash，那么只要css文件内容不变，那么不会重复构建
```javascript
new MiniCssExtracPlugin({
  filename: "[name][contenthash:8].css",// css 指纹设置, 设置 MiniCssExtracPlugin 的 filename，用contenthash
})
```
在使用图片，字体文件的hash和css/js资源的hash概念不一样，图片，字体文件的hash是由内容决定的。只要图片，字体不变，那么其文件指纹也不变
```javascript
rules: [
    {
        test: /\.(png|svg|jpg|gif)$/,
        use: [{
            loader: 'file-loader',
            options: {
                name: 'img/[name][hash:8].[ext] '
            }
        }]
    }
]
```