## 场景
H5开发过程中出现重复开发组件和功能，导致重复开发和测试。通过<code>vant3</code>, <code>vant-cli</code>，<code>vue3</code>开发移动端组件库，抽离公共组件的方式解决该问题。大大提高了H5的开发和测试效率。

## 实现
使用[vant-cli](https://github.com/youzan/vant/tree/dev/packages/vant-cli)搭建基础模版。通过 Vant Cli 可以快速搭建一套功能完备的 Vue 组件库
```js
yarn create vant-cli-app
```
在src目录开发组件即可。项目分为两部分：
1. 可视化组件页面。通过<code>npm run build-site</code>，构建文档站点，在 <code>site</code> 目录生成可用于生产环境的文档站点代码。再借助<code>GitHub Pages</code>，生成了文档页面: [zcl-mobile-ui](https://0zcl.github.io/zcl-mobile-ui/#/home)

![github_page](@assets/project/25.png)

2. 组件库。运行 build 命令会在 es 和 lib 目录下生成可用于生产环境的组件代码。
```js
// package.json
{
  "main": "lib/index.js",
  "module": "es/index.js",
  "files": ["es", "lib"]
}

// 在vue3业务h5中引用
import mobileUI from 'zcl-mobile-ui'
createApp(App).use(mobileUI)
```

## 难点
问题：如何修改webpack配置？

vant-cli中使用wepack进行打包。想使用<code>resolve.alias</code>添加路径别名，但不知how to do? 只能看vant-cli源码

## vant-cli源码简析
通过分析<code>vant-cli dev</code>: bin.js --> dev.js --> compile-site.js --> webpack.site.dev.js
```js
// @vant/cli/lib/common/constant.js
// 本地自定义的webpack
exports.ROOT_WEBPACK_CONFIG_FILE = path_1.join(exports.ROOT, 'webpack.config.js');

// @vant/cli/lib/common/index.js
const constant_1 = require("./constant")
function getWebpackConfig(defaultConfig) {
  if (fs_extra_1.existsSync(constant_1.ROOT_WEBPACK_CONFIG_FILE)) {
    const config = require(constant_1.ROOT_WEBPACK_CONFIG_FILE);
    // 如果是函数形式，可能并不仅仅是添加额外的处理流程，而是在原有流程上进行修改
    // 比如修改markdown-loader,添加options.enableMetaData
    if (typeof config === 'function') {
      return webpack_merge_1.merge(defaultConfig, config(defaultConfig));
    }
    // 配置合并
    return webpack_merge_1.merge(defaultConfig, config);
  }
  return defaultConfig;
}
exports.getWebpackConfig = getWebpackConfig;

// @vant/cli/compiler/compile-site.js
// 获取webpack配置
const config = webpack_site_dev_1.getSiteDevConfig()

// @vant/cli/lib/config/webpack.site.dev.js
const webpack_merge_1 = require("webpack-merge")
const common_1 = require("../common");
// webpack.base是vant-cli默认的基础webpack配置
const webpack_base_1 = require("./webpack.base")
function getSiteDevBaseConfig() {
// ...
  return webpack_merge_1.merge(webpack_base_1.baseConfig, {
    entry: {
      // ...
    },
    devServer: {
      port: 8080,
      host: '0.0.0.0',
      stats: 'errors-only',
      publicPath: '/',
      hot: true,
      open: true,
      disableHostCheck: true,
    }
    // ...
  }
}
function getSiteDevConfig() {
  // 重点！！
  return common_1.getWebpackConfig(getSiteDevBaseConfig());
}
exports.getSiteDevConfig = getSiteDevConfig
```
1. <code>getSiteDevBaseConfig</code>函数中，通过<code>webpack-merge</code>做webpack配置合并，因此<code>npm run dev</code>启动本地服务时，端口8080，就是在源码这里配置的。
2. <code>getWebpackConfig</code>函数中，如果项目根目录存在<code>webpack.config.js</code>，会把1步骤输出的配置和项目根目录的<code>webpack.config.js</code>做合并。得到最终的webpack配置。

:::tip
<strong>版本</strong>："@vant/cli": "^3.9.0"  "vant": "^3.2.3"

vant-cli中做了两次webpack配置的合并。
* 第一次是把基础配置和代码中写死的配置合并；
* 第二次，判断项目根目录是否存在webpack.config.js，如果存在，就把第一次输出的配置和本地自定义的配置合并
:::

### 解决
在项目根目录下，新建<code>webpack.config.js</code>
```js
// zcl-mobile-ui/webpack.config.js
const path = require('path');

module.exports = {
  devServer: {
    // 不用默认的8080端口，自定义端口
    port: 9999
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      src: path.resolve(__dirname, 'src'),
      utils: path.resolve(__dirname, 'utils'),
      assets: path.resolve(__dirname, 'assets'),
    },
  }
}
```

## 总结
H5开发过程中出现重复开发组件和功能，导致重复开发和测试。我负责组件库从0到1的搭建开发。通过<code>vant3</code>, <code>vant-cli</code>，<code>vue3</code>开发移动端组件库，抽离公共组件的方式解决该问题。大大提高了H5的开发和测试效率。
