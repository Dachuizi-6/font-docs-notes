## loader介绍
默认情况下，在遇到import或者require加载模块的时候，webpack只支持对js 和 json 文件打包（真的吗？？）

像css、sass、png等这些类型的文件的时候，webpack则无能为力，这时候就需要配置对应的loader进行文件内容的解析

loader支持链式调用，链中的每个loader会处理上一个loader处理过的资源，最终变为js代码。
```js
// 配置。执行顺序：sass-loader、css-loader、style-loader
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          },
          { loader: 'sass-loader' }
        ]
      }
    ]
  }
};
```

Loader的上下文，Loader函数可接收三个参数content(模块内容), map, meta. 函数中的上下文this有很多运行时的信息，eg: <code>this.emitFile</code>、<code>this.async</code>, 具体见[Loader上下文](https://webpack.js.org/api/loaders/#the-loader-context)
```js
// 同步Loader
module.exports = function (content, map, meta) {
  return someSyncOperation(content);
};

// 异步Loader
module.exports = function (content, map, meta) {
  var callback = this.async(); // 标识该 loader 是异步处理的
  someAsyncOperation(content, function (err, result) {
    if (err) return callback(err);
    callback(null, result, map, meta);
  });
};
```

[Pitching Loader](https://webpack.js.org/api/loaders/#pitching-loader), Pitching: 投球


## 面试
问：是否写过 Loader？简单描述一下编写 Loader 的思路？
1. Loader通过链式操作，执行顺序从后往前
2. 每个Loader最好只做一件事，“单一职责”，拿到源文件，输出处理后的源文件
3. loader函数的this上下文由webpack提供，包含很多运行时的信息与API接口