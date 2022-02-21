
使用rollup来打包业务组件。组件采用Vue编写，example目录为本地的webpack devServer服务，用来快速测试编写的组件。整体架构如下图

![hll-compoment](@assets/project/6.png)

## rollup构建
1. rollup构建。这部分主要参考[rollup官网配置](https://rollupjs.org/guide/en/)即可。
```js
// rollup.config.js
const { isProduction, logger } = require("./config/utlils");
const loadConfigFile = require("rollup/dist/loadConfigFile");
const path = require("path");
const rollup = require("rollup");
const ora = require("ora");

let watcher;
loadConfigFile(path.resolve(__dirname, "config/index.js")).then(
  async ({ options, warnings }) => {
    process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
      // application specific logging, throwing an error, or other logic here
    });
    console.log(`We currently have ${warnings.count} warnings\n`);
    warnings.flush();
    const bundle = await rollup.rollup(options[0]);
    await Promise.all(options[0].output.map(bundle.write));
    if (!isProduction()) {
      watcher = rollup.watch(options);
      const spinner = ora("Loading unicorns");
      spinner.color = "green";
      watcher.on("event", (event) => {
        switch (event.code) {
          case "START":
            spinner.start("开始编译");
            break;
          case 'BUNDLE_START':
          case 'BUNDLE_END':
            spinner.text = '编译中';break;
          case "END":
            spinner.succeed("编译成功\n");
            logger.success("持续监听文件更新...");
            break;
          case "FATAL":
            spinner.fail("编译失败");
            break;
        }
      });
    }
  }
)
```
配置文件
```js
import visualizer from "rollup-plugin-visualizer";
const path = require("path");
const commonjs = require("rollup-plugin-commonjs");
const resolve = require("rollup-plugin-node-resolve");
const babel = require("rollup-plugin-babel");
const vue = require("rollup-plugin-vue");
const json = require("rollup-plugin-json");
const alias = require("rollup-plugin-alias");
const {
  terser
} = require("rollup-plugin-terser");
const scss = require("rollup-plugin-scss");
const CleanCSS = require("clean-css");
const image = require("@rollup/plugin-image");

const {
  isProduction
} = require("./utlils");
const {
  writeFileSync,
  existsSync,
  mkdirSync
} = require("fs");
const projectRootDir = path.resolve(__dirname, '../');

const inputOptions = {
  input: "src/main.js",
  external: [
    'axios', 'moment', 'html2canvas', 'echarts', 'v-viewer', 'vue', '@i61/element-ui', 'clipboard'
  ],
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    }),
    alias({
      resolve: ['.scss', '.js', '.vue'],
      entries: [{
        find: "@",
        replacement: path.resolve(projectRootDir, "./"),
      }, ],
    }),
    json({
      compact: true,
    }),
    vue({
      css: false
    }),
    image({
      exclude: ["node_modules/**"],
      include: ["./**"],
    }),
    scss({
      output(style) {
        if (!existsSync("dist")) {
          mkdirSync("dist");
        }
        writeFileSync("dist/library.min.css", new CleanCSS().minify(style).styles);
      },
    }),
    resolve({
      extensions: [".js", ".json", ".vue", ".scss"]
    }),
    babel({
      extensions: [".js", ".vue", ".jsx"],
      exclude: ["node_modules/**"],
    }),
    commonjs(),
    isProduction && terser(),
  ],
};

const output = {
  file: "dist/library.umd.js",
  name: "library",
  format: "umd"
};
const exportModule = {
  ...inputOptions,
  output,
};
isProduction() &&
  (exportModule["watch"] = {
    include: "src/**",
  });

module.exports = exportModule;
```
<code>rollup配置属于团队技术积累</code>。上面这份配置是反复看官网有及实践得来的。但也不能迷信配置，一些配置方案也是会随着版本升级做相应修改的，重要是去查看官方文档添加修改配置。

目前打包结果。<code>library.umd.js为600k</code>

![rollup](@assets/project/7.png)

## rollup构建优化
* 代码压缩。不使用<code>isProduction && terser()</code>。打包结果：

![rollup](@assets/project/8.png)

结论：rollup使用代码压缩可以减少一半体积

* 外部引用。和webpack一样，rollup也提供了external。externals 配置选项提供了「从输出的 bundle 中排除依赖」的方法。不使用<code>external</code>
```js
external: [
  'axios', 'moment', 'html2canvas', 'echarts', 'v-viewer', 'vue', '@i61/element-ui', 'clipboard'
]
```

![rollup](@assets/project/9.png)

结论：rollup使用external把第三方库不打包到库，可减少3/4体积。2.4M --> 600K

## 组件库初始化
* 抛出install函数。hll-common-component组件库抛出对象 { install, init, ... }。install函数是<code>Vue.use(hllCommonComponent)</code>插件注册时会执行的。原理见[插件注册原理](../../vue/whole-process/use.md)
```js
const components  = [
  // 你编写的组件
]
// 注册所有的组件至全局Vue上
const install = function(Vue, opts = {}) {
  Vue.use(Viewer)
  // Vue.use(commonSelector)
  components.forEach(component => {
    Vue.component(component.name, component)
  })
}
```

* 请求初始化。组件库中有的组件会发起接口调后端接口，自然而然的就需要对接口地址做环境的区分。
```js
const envConfig = {
  LOCAL: "//gw-mg-test.61info.cn",
  DEV: "//gw-mg-dev.61info.cn",
  TEST: "//gw-mg-test.61info.cn",
  PRE: "//gw-mg-preprod.61info.cn",
  PROD: "//gw-mg.61info.cn",
}
```
因此，在组件注册之后，还需要对组件内请求做初始化。

在main.js抛出init函数
```js
// 初始化
const init = (token, env) => {
  let accessToken = ''
  if (token) {
    accessToken = token
  } else if (window.localStorage.getItem('loginInfo')) {
    accessToken = JSON.parse(window.localStorage.getItem('loginInfo') || '{}').accessToken
  }
  initHttp(accessToken, env)
}

// src/utils/request.js
let env = 'PROD'
// 创建axios实例
const request = axios.create({
  baseURL: envConfig[env], // api 的 base_url
  timeout: 20000, // 请求超时时间
});
function initHttp(token, envNew) {
  console.log('initHttp -> envNew', envNew)
  accessToken = token
  env = envNew.toUpperCase() || 'PROD'
  window.localStorage.setItem('studentRecordEnv', env)
  request.defaults.baseURL = envConfig[env]
}
```
## 使用业务组件库
* 全局注册组件
```js
Vue.use(hllCommonComponent)
// HllCommonComponent.install(Vue)
```

* 业务中按需引入组件
```js
import { packageManagement } from 'hll-common-component'
```

```js
import hllCommonComponent from '@i61/hll-common-component'
Vue.use(hllCommonComponent)
register((props) => {
  // ...
  // 组件库请求初始化
  hllCommonComponent.init('', process.env.GTD_ENV)
  let app = new Vue({
    el: '#app',
    router,
    store,
    render: h => h(App)
  })
  return () => {
    app.$destroy()
    app = null
  }
}, {})
```

## 总结
在开发多个B端项目时，会面临开发相同功能，导致代码重复开发，冗余。希望封装业务组件库，把B端业务上公用的组件统一维护。我负责<code>rollup的搭建</code>以及<code>业务组件的开发维护</code>。通化代码压缩和添加external外部引用，减少3/4体积大小；开发的组件大大提高了开发效率。

