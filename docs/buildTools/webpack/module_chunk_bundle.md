
### module、chunk、bundle的区别
1. module: 指文件模块(eg: .js文件/.css文件/图片文件等)
2. chunk: webpack 会根据入口文件引用关系生成 chunk 文件，webpack 会对这个 chunk 文件进行一些操作
3. bundle：webpack 处理好 chunk 文件后，最后会输出 bundle 文件，这个 bundle 文件包含了经过加载和编译的最终源文件，所以它可以直接在浏览器中运行
![webpack打包过程](@assets/webpack/1.png)

webpack 的配置
```javascript
{
    entry: {
        index: "../src/index.js",
        utils: '../src/utils.js',
    },
    output: {
        filename: "[name].bundle.js", // 输出 index.js 和 utils.js
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader, // 创建一个 link 标签
                    'css-loader', // css-loader 负责解析 CSS 代码, 处理 CSS 中的依赖
                ],
            },
        ]
    }
    plugins: [
        // 用 MiniCssExtractPlugin 抽离出 css 文件，以 link 标签的形式引入样式文件
        new MiniCssExtractPlugin({
            filename: 'index.bundle.css' // 输出的 css 文件名为 index.css
        }),
    ]
}
```
打包结果

![webpack打包过程](@assets/webpack/2.png)

index.css 和 common.js 在 index.js 中被引入，打包生成的 index.bundle.css 和 index.bundle.js 都属于 chunk index【chunk name: index】，utils.js 因为是独立打包的，它生成的 utils.bundle.js 属于 chunk utils【chunk name: utils】

![webpack打包过程](@assets/webpack/3.png)


## 面试
问：module、chunk、bundle的区别？

答：
module，chunk 和 bundle 其实就是同一份逻辑代码在不同转换场景下的取了三个名字：

1. module是开发时编写的文件模块；
2. webpack 根据entry入口文件的依赖图，生成chunk，webpack再对 chunk 做相关处理；
3. bundle 是最终生成文件，浏览器可以直接运行

参考：https://www.cnblogs.com/skychx/p/webpack-module-chunk-bundle.html