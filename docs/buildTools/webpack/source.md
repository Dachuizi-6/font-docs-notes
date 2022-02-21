## webpack5 启动流程源码分析
```js
"build": "webpack --config ./config/webpack.config.js"
// npm run build 相当于直接在命令行输入 webpack xxxx
```
接下来分析<code>webpack xxxx</code>命令是如何启动的。webpack命令能执行，其实是因为<code>node_module/.bin/</code>目录下存在<code>webpack可执行文件</code>，该文件实际上执行的是<code>node_modules/webpack/bin/webpack.js</code>。执行下看看webpack.js
```js
// ./bin/目录下的webpack可执行文件
"$basedir/node"  "$basedir/../_webpack@5.30.0@webpack/bin/webpack.js" "$@"

// webpack.js
#!/usr/bin/env node
// 安装 webpack-cli, 使用子进程
const runCommand = (command, args) => {
	const cp = require("child_process");
	return new Promise((resolve, reject) => {
		const executedCommand = cp.spawn(command, args, {
			stdio: "inherit",
			shell: true
		});

		executedCommand.on("error", error => {
			reject(error);
		});

		executedCommand.on("exit", code => {
			if (code === 0) {
				resolve();
			} else {
				reject();
			}
		});
	});
};

const isInstalled = packageName => {
	try {
		require.resolve(packageName);

		return true;
	} catch (err) {
		return false;
	}
};

const runCli = cli => {
	const path = require("path");
  // 拿到 webpack-cli/package.json 文件的路径
	const pkgPath = require.resolve(`${cli.package}/package.json`);
	// eslint-disable-next-line node/no-missing-require
	const pkg = require(pkgPath);
	// eslint-disable-next-line node/no-missing-require
  // 通过 package.json 中 bin 命令，导入 bin/cli.js 这个 js 文件，相当于执行 bin/cli.js 文件
	require(path.resolve(path.dirname(pkgPath), pkg.bin[cli.binName]));
};

const cli = {
	name: "webpack-cli",
	package: "webpack-cli",
	binName: "webpack-cli",
	installed: isInstalled("webpack-cli"),
	url: "https://github.com/webpack/webpack-cli"
};

// 如果 webpack cli 没有安装，则会提示
if (!cli.installed) {
	const path = require("path");
	const fs = require("graceful-fs");
	const readLine = require("readline");

	const notify =
		"CLI for webpack must be installed.\n" + `  ${cli.name} (${cli.url})\n`;

	console.error(notify);

	let packageManager;
  // 选择安装 webpack-cli 的方式
	if (fs.existsSync(path.resolve(process.cwd(), "yarn.lock"))) {
		packageManager = "yarn";
	} else if (fs.existsSync(path.resolve(process.cwd(), "pnpm-lock.yaml"))) {
		packageManager = "pnpm";
	} else {
		packageManager = "npm";
	}

	const installOptions = [packageManager === "yarn" ? "add" : "install", "-D"];

	console.error(
		`We will use "${packageManager}" to install the CLI via "${packageManager} ${installOptions.join(
			" "
		)} ${cli.package}".`
	);

	const question = `Do you want to install 'webpack-cli' (yes/no): `;

	const questionInterface = readLine.createInterface({
		input: process.stdin,
		output: process.stderr
	});

	process.exitCode = 1;
	questionInterface.question(question, answer => {
		questionInterface.close();

		const normalizedAnswer = answer.toLowerCase().startsWith("y");

		if (!normalizedAnswer) {
			console.error(
				"You need to install 'webpack-cli' to use webpack via CLI.\n" +
					"You can also install the CLI manually."
			);

			return;
		}
		process.exitCode = 0;

		console.log(
			`Installing '${
				cli.package
			}' (running '${packageManager} ${installOptions.join(" ")} ${
				cli.package
			}')...`
		);
    // 执行 runCommand 函数来安装 webpack-cli
		runCommand(packageManager, installOptions.concat(cli.package))
			.then(() => {
        // 成功安装 webpack-cli 后将运行runCli, runCli去执行webpack-cli相关代码
				runCli(cli);
			})
			.catch(error => {
				console.error(error);
				process.exitCode = 1;
			});
	});
} else {
  // 如果我们在打包之前已安装 webpack-cli，则会直接调用 runCli(cli) 来运行 webpack 脚手架
	runCli(cli);
}
```
webpack.js 判断是否安装了 <code>webpack-cli</code>
1. 已安装，则调用<code>node_modules/webpack-cli/bin/cli.js</code>
2. 未安装，则先安装<code>webpack-cli</code>，再调用<code>node_modules/webpack-cli/bin/cli.js</code>
:::tip
上面的webpack.js源码非常简洁，值得一看！
:::

接下来看下<code>node_modules/webpack-cli/bin/cli.js</code>
```js
#!/usr/bin/env node
const Module = require('module');

const originalModuleCompile = Module.prototype._compile;

require('v8-compile-cache');

const importLocal = require('import-local');
const runCLI = require('../lib/bootstrap');
const utils = require('../lib/utils');

// 判断 webpack 包是否存在
if (utils.packageExists('webpack')) {
    runCLI(process.argv, originalModuleCompile);
} else {
    const { promptInstallation, logger, colors } = utils;
    // 提示用户需要安装 webpack
    promptInstallation('webpack', () => {
        utils.logger.error(`It looks like ${colors.bold('webpack')} is not installed.`);
    })
        .then(() => {
            logger.success(`${colors.bold('webpack')} was installed successfully.`);
            // 安装成功后，执行runCLI
            runCLI(process.argv, originalModuleCompile);
        })
        .catch(() => {
            logger.error(`Action Interrupted, Please try once again or install ${colors.bold('webpack')} manually.`);

            process.exit(2);
        });
}
```
cli.js 判断是否安装了 <code>webpack</code>
1. 已安装，则调用<code>../lib/bootstrap</code>的runCLI
2. 未安装，则先安装<code>webpack</code>，再调用<code>../lib/bootstrap</code>的runCLI

综上可见，webpack和webpack-cli，是你中有我，我中有你，缺一不可!

再来看看<code>../lib/bootstrap</code>
```js
const WebpackCLI = require('./webpack-cli');
const utils = require('./utils');

const runCLI = async (args, originalModuleCompile) => {
    try {
        const cli = new WebpackCLI();
        cli._originalModuleCompile = originalModuleCompile;
        await cli.run(args);
    } catch (error) {
        utils.logger.error(error);
        process.exit(2);
    }
};
module.exports = runCLI;
```
显然，实例化了一个<code>cli</code>对象，并执行<code>cli.run()</code>, 在 run 方法里面 => this.buildCommand => this.createCompiler => compiler
```js
    async createCompiler(options, callback) {
        this.applyNodeEnv(options);
        let config = await this.resolveConfig(options);

        config = await this.applyOptions(config, options);
        config = await this.applyCLIPlugin(config, options);
        let compiler;
        try {
          // 这里的 this.webpack 实际上是一个函数
          compiler = this.webpack(
              config.options,
              callback
                  ? (error, stats) => {
                        if (error && this.isValidationError(error)) {
                            this.logger.error(error.message);
                            process.exit(2);
                        }

                        callback(error, stats);
                    }
                  : callback,
          );
        } catch (error) {
            if (this.isValidationError(error)) {
                this.logger.error(error.message);
            } else {
                this.logger.error(error);
            }

            process.exit(2);
        }
        if (compiler && compiler.compiler) {
            compiler = compiler.compiler;
        }

        return compiler;
    }
```
核心就是 <code>compiler 函数</code>，它将我们的命令和 webpack 配置相合并

## webpack核心模块tapable用法简析
tapable是webpack的核心模块，也是webpack团队维护的，是webpack plugin的基本实现方式。他的主要功能是为使用者提供强大的hook机制，webpack plugin就是基于hook的
```js
const {
	SyncHook,
	SyncBailHook,
	SyncWaterfallHook,
	SyncLoopHook,
	AsyncParallelHook,
	AsyncParallelBailHook,
	AsyncSeriesHook,
	AsyncSeriesBailHook,
	AsyncSeriesWaterfallHook
 } = require("tapable");
```
* Sync: 同步的hook
* Async: 异步的hook
* Bail: 当一个hook注册了多个回调方法，返回了<code>undefined</code>，才能继续执行后面的回调方法。Bail在英文中的意思是保险，保障的意思，起到”保险丝“的作用
* Waterfall：当一个hook注册了多个回调方法，前一个回调执行完了才会执行下一个回调，而前一个回调的执行结果会作为参数传给下一个回调函数。
* Series：串行。前一个执行完了才会执行下一个。
* Parallel: 并行。当一个hook注册了多个回调方法，这些回调同时开始并行执行。

```js
const { SyncHook } = require("tapable");

// 实例化一个加速的hook
const accelerate = new SyncHook(["newSpeed"]);

// 注册第一个回调，加速时记录下当前速度
accelerate.tap("LoggerPlugin", (newSpeed) =>
  console.log("LoggerPlugin", `加速到${newSpeed}`)
);

// 再注册一个回调，用来检测是否超速
accelerate.tap("OverspeedPlugin", (newSpeed) => {
  if (newSpeed > 120) {
    console.log("OverspeedPlugin", "您已超速！！");
  }
});

// 再注册一个回调，用来检测速度是否快到损坏车子了
accelerate.tap("DamagePlugin", (newSpeed) => {
  if (newSpeed > 300) {
    console.log("DamagePlugin", "速度实在太快，车子快散架了。。。");
  }
});

// 触发一下加速事件，看看效果吧
accelerate.call(500);

// 测试
// LoggerPlugin 加速到500
// OverspeedPlugin 您已超速！！
// DamagePlugin 速度实在太快，车子快散架了。。。
```
<code>tap</code>和<code>call</code>这两个实例方法，其中tap接收两个参数，第一个是个字符串，并没有实际用处，仅仅是一个注释的作用，第二个参数就是一个回调函数，用来执行事件触发时的具体逻辑。

webpack的plguin就是用tapable实现的，第一个参数一般就是plugin的名字：[webpack的plugin](https://www.webpackjs.com/concepts/plugins/#%E5%89%96%E6%9E%90)
```js
const pluginName = 'ConsoleLogOnBuildWebpackPlugin';

class ConsoleLogOnBuildWebpackPlugin {
    apply(compiler) {
        compiler.hooks.run.tap(pluginName, compilation => {
            console.log("webpack 构建过程开始！");
        });
    }
}
```
webpack的plugin中一般不需要开发者去触发事件，而是webpack自己在不同阶段会触发不同的事件，比如beforeRun, run等等，plguin开发者更多的会关注这些事件出现时应该进行什么操作，也就是在这些事件上注册自己的回调。

```js
const { SyncBailHook } = require("tapable");
const accelerate = new SyncBailHook(["newSpeed"]);

accelerate.tap("LoggerPlugin", (newSpeed) =>
  console.log("LoggerPlugin", `加速到${newSpeed}`)
);
accelerate.tap("OverspeedPlugin", (newSpeed) => {
  if (newSpeed > 120) {
    console.log("OverspeedPlugin", "您已超速！！");
    return new Error('您已超速！！');
  }
});
accelerate.tap("DamagePlugin", (newSpeed) => {
  if (newSpeed > 300) {
    console.log("DamagePlugin", "速度实在太快，车子快散架了。。。");
  }
});
accelerate.call(500);
// 测试
// LoggerPlugin 加速到500
// OverspeedPlugin 您已超速！！
```

## webpack工作流程
![webpack](@assets/webpack/24.png)

基本流程
1. <code>初始化参数</code>：从配置文件和 Shell 语句中读取、合并参数，得出最终的参数
2. 开始编译：创建<code>compiler实例</code>，执行<code>compiler.run()</code>开始编译
3. 确定入口：根据配置中的 <code>entry</code> 找出所有的入口文件
4. 编译模块：从<code>入口文件(entry)</code>开始递归分析依赖，对每个依赖模块进行<code>编译(buildModule)</code>
5. 完成模块编译: 得到了每个模块被编译后的最终内容以及它们之间的依赖关系
6. 输出资源：生成<code>chunks</code>, 不同的入口，生成不同的chunks。根据配置确定输出的路径和文件名，输出资源。


[webpack5 启动流程部分源码分析](https://www.jianshu.com/p/a38cdd547f04)
[webpack核心模块tapable用法解析](https://juejin.cn/post/6939794845053485093#comment)
[webpack构建之webpack的构建流程是什么](https://blog.csdn.net/leelxp/article/details/108447050)
[webpack构建之webpack打包流程到底是什么](https://blog.csdn.net/leelxp/article/details/107209190)
[从Webpack源码探究打包流程，萌新也能看懂～](https://juejin.cn/post/6844903728735059976)
[【webpack进阶系列】Webpack源码断点调试：核心流程](https://github.com/amandakelake/blog/issues/92)
https://www.jianshu.com/p/c9c1ac61f8a4