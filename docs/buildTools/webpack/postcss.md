由于浏览器的标准没有完全统一，所以CSS3 的属性需要前缀
![postcss](@assets/webpack/5.png)

### postcss 相关插件autoprefixer
PostCSS 插件 autoprefixer 自动补齐 CSS3 前缀
css样式存在兼容问题，可上 [Can I Use](https://caniuse.com/) 查看，如：
```css
.box {
  display:-webkit-box;
  display:-webkit-flex;
  display:-ms-flexbox;
  display:flex
}
```
### postcss实践
postcss.config.js
```javascript
module.exports = {
  plugins: [
    require("autoprefixer")
  ]
}
```
.browserslistrc
```javascript
last 2 version
>1%
ios 7
```
webpack.config.js
```javascript
      {
        test: /.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          "postcss-loader",
          'less-loader'
        ]
      },
```
### 打包结果
![postcss](@assets/webpack/8.png)

## 面试
问：说下postcss原理

答：postCSS利用自身的parser可以将css代码解析为AST，再利用众多插件(上文介绍的autoprefixer就是一种)改写AST，最终输出改写后的css代码

![postcss](@assets/webpack/6.png)


与Less这样的「css预处理器」的不同 —— postCSS的输入与输出产物都是css文件。
因此，postCSS也被称为「<code>后处理器</code>」，因为其通常在css处理链条的最后端

![postcss](@assets/webpack/7.png)

loader顺序：postcss-loader 执行顺序必须保证在 css-loader 之前，建议还是放在 less或者 sass 等预处理器之后更好。即 loader 顺序：
less-loader -> postcss-loader -> css-loader -> style-loader 或者 MiniCssExtractPlugin.loader

参考：https://developer.51cto.com/art/202103/650265.htm