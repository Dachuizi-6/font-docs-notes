## 为什么需要vite? 

问题：本地开发时，构建时间长；修改文件后，热更新时间也长。

vite方案解决：利用esbuild，预构建更快；利用浏览支持ES模块，实现按需加载，热更新更快。

## 特性
* 浏览器支持[JS模块](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules?fileGuid=DDr3GGh6QRvQgWQC)。主流浏览器支持<code>import</code>和<code>export</code>
* 开发环境使用[esbuild](https://esbuild.github.io/getting-started/#download-a-build)预构建依赖。Esbuild 使用 Go 编写，并且比以 JavaScript 编写的打包器预构建依赖快 10-100 倍
* 生产环境使用rollup打包。rollup更成熟和灵活。

<div>
  <img src="@assets/news/1.png" style="width: 48%" />
  <img src="@assets/news/2.png" style="width: 48%" />
</div>

<code>Vite</code> 只需要在浏览器请求源码时进行转换并按需提供源码。即只在当前屏幕上实际使用时才会被处理。


## 源码浅析
### 启动时
和webpack类型，启动时创建了两个服务。
1. ws服务。createServer函数中调用<code>createWebSocketServer</code>创建web socket服务器，用于热更新通迅。
2. http服务。server.listen()会调用<code>startServer</code>启动node模块的 http server。
```js
// node_module/vite/dist/node/cli.js
const server = await createServer({
  // ...
});
await server.listen();

// node_module/vite/dist/node/cli.js
async function createServer(inlineConfig = {}) {
    const config = await resolveConfig(inlineConfig, 'serve', 'development');
    const httpsOptions = await resolveHttpsConfig(config);
    // web socket服务器
    const ws = createWebSocketServer(httpServer, config, httpsOptions);
    const server = {
      // ...
      listen(port, isRestart) {
          return startServer(server, port, isRestart);
      }
    }
    // ...
    return server
}
```

### 配置文件
和webpack类似，找配置文件的处理。最终找到项目根目录的<code>vite.config.ts</code>
```js
// node_module/vite/dist/node/chunks/dep-55830a1a.js
async function loadConfigFromFile(configEnv, configFile, configRoot = process.cwd(), logLevel) {
  // ...
  if (!userConfig) {
    // 2. if we reach here, the file is ts or using es import syntax, or
    // the user has type: "module" in their package.json (#917)
    // transpile es import syntax to require syntax using rollup.
    // lazy require rollup (it's actually in dependencies)
    const bundled = await bundleConfigFile(resolvedPath);
    dependencies = bundled.dependencies;
    userConfig = await loadConfigFromBundledFile(resolvedPath, bundled.code);
    debug$1(`bundled config file loaded in ${getTime()}`);
  }
  // ...
  return {
    path: normalizePath$4(resolvedPath),
    config,
    dependencies
  };
}

// node_module/vite/dist/node/chunks/dep-55830a1a.js
async function resolveConfig(inlineConfig, command, defaultMode = 'development') {
  // ...
  if (configFile !== false) {
      const loadResult = await loadConfigFromFile(configEnv, configFile, config.root, config.logLevel);
      if (loadResult) {
          config = mergeConfig(loadResult.config, config);
          configFile = loadResult.path;
          configFileDependencies = loadResult.dependencies;
      }
  }
  // ...
}
```

### 热更新
热更新主体流程如下：
1. 服务端基于 watcher 监听文件改动，根据类型判断更新方式，并编译资源
2. 客户端通过 WebSocket 监听到一些更新的消息类型和资源路径
3. 客户端根据消息类型执行热更新逻辑

![vite](@assets/news/3.png)

* 配置文件<code>vite.config.ts</code>发生修改时，会触发服务重启
* html 文件更新时，ws发送full-reload，将会触发页面的重新加载
* 热更新，ws发送update标志
```js
// node_module/vite/dist/node/chunks/dep-55830a1a.js
async function handleHMRUpdate(file, server) {
  const isConfig = file === config.configFile;
  if (isConfig || isConfigDependency || isEnv) {
      // auto restart server
      await restartServer(server);
      return;
  }
  // ...
  // html file cannot be hot updated
  if (file.endsWith('.html')) {
      ws.send({
          type: 'full-reload',
          path: config.server.middlewareMode
              ? '*'
              : '/' + normalizePath$4(path__default.relative(config.root, file))
      });
  }
  updateModules(shortFile, hmrContext.modules, timestamp, server);
}

function updateModules(file, modules, timestamp, { config, ws }) {
  const updates = [];
  updates.push(...[...boundaries].map(({ boundary, acceptedVia }) => ({
    type: `${boundary.type}-update`,
    timestamp,
    path: boundary.url,
    acceptedPath: acceptedVia.url
  })));
  // ...
  if (needFullReload) {
    ws.send({
      type: 'full-reload'
    });
  }
  else {
    ws.send({
      type: 'update',
      updates
    });
  }
}
```

![update](@assets/news/4.png)

浏览器收到ws消息后。
* 收到full-reload标志时，调用location.reload()重载页面
* 收到update标志时，使用import加载更新后的模块
```js
async function handleMessage(payload) {
  switch (payload.type) {
    case 'update':
      payload.updates.forEach((update) => {
        if (update.type === 'js-update') {
          queueUpdate(fetchUpdate(update))
        }
      }
    case 'full-reload':
      // ...
        location.reload();
    }
    break;
  }
}

async function fetchUpdate({ path, acceptedPath, timestamp }: Update) {
  const newMod = await import(
    /* @vite-ignore */
    base +
      path.slice(1) +
      `?import&t=${timestamp}${query ? `&${query}` : ''}`
  )
}
```

为什么<code>watcher.on('change', async (file) => {})</code>能监听到文件变化？
本质上和webpack是一样的，利用eventEmitter。<code>watcher._watched</code>是一个收集文件的Map。watcher继承了eventEmitter, 因此watcher.on能监听变化。不过是在哪里emit的？？源码中没找到...
```js
class FSWatcher extends EventEmitter$2 {
  // Not indenting methods for history sake; for now.
  constructor(_opts) {
    super();
    /** @type {Map<String, DirEntry>} */
    this._watched = new Map();
  }
}

const watch = (paths, options) => {
  const watcher = new FSWatcher(options);
  watcher.add(paths);
  return watcher;
}
```


参考：
[esbuild](https://github.com/evanw/esbuild)
[Vite 特性和部分源码解析](https://juejin.cn/post/6979716166545571871#heading-0)