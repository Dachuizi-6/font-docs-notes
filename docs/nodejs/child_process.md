## Node.js和JavaScript的区别？
Node.js 是一个<code>非阻塞式I/O</code>的、<code>事件驱动</code>的JavaScript运行环境

## Node.js 是单线程的还是多线程的？
大家常说的Node是单线程指的是<code>JS的执行是单线程的</code>，但JS的宿主环境，无论是Node还是浏览器都是多线程的。

```js
setInterval(() => {
  console.log(new Date().getTime())
}, 3000)
```
![process](@assets/node/6.png)

可以看到 Node 进程占用了 7 个线程。为什么会有 7 个线程呢？ <code>Node启动后，会创建v8实例，v8实例是多线程的。</code>

## cluster 是多线程吗？
cluster是什么？

cluster是Node提供的一个<code>多进程集群模块</code>。通过对child_process的封装，实现cluster.fork()创建子进程

为什么需要cluster？
1. 提高CPU利用率。Node是单进程的，因此在多CPU环境下，会出现CPU利用率不足
![process](@assets/node/7.png)、
2. 保证程序运行稳定。(单个)[进程中的任一线程出错，都会导致整个进程崩溃](../browser/theory/#说说浏览器的架构)。eg: 某个未捕获的异常可能会导致整个程序的退出

## Node创建进程的方法和区别？
Node提供child_process模块来创建子进程。创建子进程常用的有：<code>exec、spawn、fork</code>、
1. exec: 使用子进程执行命令。输出有maxBuffer限制，因此exec不建议用来返回很多数据
2. spawn: 创建子进程。子进程返回大量数据给主进程时，建议使用spawn，比如说图像处理，读取二进制数据等等
3. fork:  创建子进程。fork会在父进程与子进程之间，建立一个通信管道，用于进程之间的通信
```js
const iconv = require('iconv-lite')
const child_process = require('child_process')
const path = require('path')
const util = require('util');
const exec = util.promisify(child_process.exec);

// 1
const child_exec = child_process.exec('dir', { encoding: 'buffer' }, (err, stdout, stderr) => {
  if (err) {
    console.log('err', err)
  }
  console.log('data end')
})
// 每个子进程总是带有三个流对象：child.stdin, child.stdout 和child.stder
child_exec.stdout.on('data', data => {
  // 在 window 下需要使用 iconv.decode 将其输出解码为 gbk, 否则会乱码.
  process.stdout.write('data: ' + iconv.decode(data, 'gbk'))
})

async function lsExample() {
  const { stdout, stderr } = await exec('dir', { encoding: 'buffer' });
  console.log('stdout:', iconv.decode(stdout, 'gbk'));
  console.error('stderr:', stderr);
}
lsExample()

// 2
const child_spawn = child_process.spawn('ping', ['127.0.0.1'])
child_spawn.stdout.on('data', data => {
  process.stdout.write(iconv.decode(data, 'gbk'))
})
child_spawn.on('exit', code => {
  console.log(`退出码${code}`)
})

// 3
console.log('parent pid: ' + process.pid)
const child_fork = child_process.fork(path.join(__dirname, './child.js'))
console.log('fork return pid: ' + child_fork.pid)
child_fork.on('message', msg => {
  console.log('parent get message: ' + JSON.stringify(msg))
})
child_fork.send({ key: 'parent value' })
```

## spawn和exec的区别？
1. spawn 返回一个流对象，而 exec 返回子进程的整个缓冲区输出
2. child_process.exec是异步的（"synchronously asynchronous"-->同步的异步）， 但实际上是同步的异步，它<code>会等待子进程结束再返回所有缓冲的数据</code>。默认情况下，缓冲区大小设置为 200k。如果 exec 的缓冲区大小设置得不够大，则会失败并显示“maxBuffer exceeded”错误。
3. child_process.spawn 异步的 （"asynchronously asynchronous"）, 只要子进程开始执行，子进程就会通过流发回数据给主进程

当您希望子进程向 Node 返回大量二进制数据时使用 spawn，当您希望子进程返回简单的状态消息时使用 exec

参考：[spawn vs child_process](https://gist.github.com/devarajchidambaram/8b3ffe8337a310ee367390cc49419f26)

对child_process.exec默认情况下，缓冲区大小设置为 200k。产生怀疑。看了源码是1M, 于是查看官方文档
:::tip
maxBuffer 标准输出或标准错误上允许的最大数据量（以字节为单位）。 如果超过，则子进程将终止并截断任何输出。 请参阅 maxBuffer 和 Unicode 的注意事项。 默认值: 1024 * 1024
:::
对比[node v8.x](https://www.nodeapp.cn/child_process.html#child_process_child_process_exec_command_options_callback)和[node v16.8.0](http://nodejs.cn/api/child_process.html#child_process_child_process_exec_command_options_callback)最新版本，原来maxBuffer从200K 扩大到 1M了

## 源码浅析+面试5问
以child_process.exec的maxBuffer为抛砖引玉，接下来看看child_process.exce是如何实现的。

带着问题看源码
1. .exec()、.execFile()、.fork()底层都是通过.spawn()实现的。真的吗？
2. spawn 返回一个流对象，而 exec 返回子进程的整个缓冲区输出。真的吗？如何实现？
3. child_process.exec的缓冲区大小设置得不够大，则会失败并显示“maxBuffer exceeded”错误。如何实现？
4. [所有流都是 EventEmitter的实例](https://nodejs.org/api/stream.html#stream_types_of_streams)。真的吗？如何实现？

.exec()、.execFile()、.fork()底层都是通过.spawn()实现的

执行exec先执行了初始化参数 之后执行了execFile方法
```js
// lib/child_process.js
function exec(command, options, callback) {
  const opts = normalizeExecArgs(command, options, callback);
  return module.exports.execFile(opts.file,
                                 opts.options,
                                 opts.callback);
}
```
execFile是重点。execFile里调用了spawn。由此可见<code>1 .exec()、.execFile()、.fork()底层都是通过.spawn()实现的</code>
```js
// lib/child_process.js
function execFile(file /* , args, options, callback */) {
  options = {
    encoding: 'utf8',
    timeout: 0,
    maxBuffer: MAX_BUFFER,
    killSignal: 'SIGTERM',
    cwd: null,
    env: null,
    shell: false,
    ...options
  };

  options.killSignal = sanitizeKillSignal(options.killSignal);

  const child = spawn(file, args, {
    cwd: options.cwd,
    env: options.env,
    gid: options.gid,
    shell: options.shell,
    signal: options.signal,
    uid: options.uid,
    windowsHide: !!options.windowsHide,
    windowsVerbatimArguments: !!options.windowsVerbatimArguments
  });

  let encoding;
  const _stdout = [];
  const _stderr = [];
  let stdoutLen = 0;
  let stderrLen = 0;

  function exithandler(code, signal) {
    // merge chunks
    let stdout;
    let stderr;
    if (encoding ||
      (
        child.stdout &&
        child.stdout.readableEncoding
      )) {
      stdout = ArrayPrototypeJoin(_stdout, '');
    } else {
      stdout = Buffer.concat(_stdout);
    }
    callback(ex, stdout, stderr);
  }

  if (child.stdout) {
    if (encoding)
      child.stdout.setEncoding(encoding);

    child.stdout.on('data', function onChildStdout(chunk) {
      const encoding = child.stdout.readableEncoding;
      const length = encoding ?
        Buffer.byteLength(chunk, encoding) :
        chunk.length;
      const slice = encoding ? StringPrototypeSlice :
        (buf, ...args) => buf.slice(...args);
      stdoutLen += length;

      if (stdoutLen > options.maxBuffer) {
        const truncatedLen = options.maxBuffer - (stdoutLen - length);
        ArrayPrototypePush(_stdout, slice(chunk, 0, truncatedLen));

        ex = new ERR_CHILD_PROCESS_STDIO_MAXBUFFER('stdout');
        kill();
      } else {
        ArrayPrototypePush(_stdout, chunk);
      }
    });
  }

  child.addListener('close', exithandler);

  return child;
}
```
问：2. spawn 返回一个流对象，而 exec 返回子进程的整个缓冲区输出。真的吗？如何实现？

答：
execFile中，这里创建的2个数组<code>_stdout, _stderr</code>，<code>execFile监听子进程child.stdout输出流，调用ArrayPrototypePush把stream push到stdout, stderr这两个数组中。等到子进程的close事件触发时，调用exitHandler, exitHandler再通过callback(ex, stdout, stderr)把缓冲区(buffer或者字符串)一次性输出</code>

问：3. child_process.exec的缓冲区大小设置得不够大，则会失败并显示“maxBuffer exceeded”错误。如何实现？

答：<code>MAX_BUFFER = 1024 * 1024;</code>默认设置max_fuffer为1M，child_process.exec在监听子进程输出流并收集输出流时，如果收集到的数据大于1M，则抛错。新的Node版本，缓存大小为1M。

问：child.stdout.on是如何接收到data的呢？
```js
// internal/child_process
function createSocket(pipe, readable) {
  return net.Socket({ handle: pipe, readable, writable: !readable });
}
// lib/net.js
function Socket(options) {
  ......
    initSocketHandle(this);
  ......
}
function initSocketHandle(self) {
  self._undestroy();
  self._sockname = null;

  // Handle creation may be deferred to bind() or connect() time.
  if (self._handle) {
    self._handle[owner_symbol] = self;
    self._handle.onread = onStreamRead;
    self[async_id_symbol] = getNewAsyncId(self._handle);

    let userBuf = self[kBuffer];
    if (userBuf) {
      const bufGen = self[kBufferGen];
      if (bufGen !== null) {
        userBuf = bufGen();
        if (!isUint8Array(userBuf))
          return;
        self[kBuffer] = userBuf;
      }
      self._handle.useUserBuffer(userBuf);
    }
  }
}
function onStreamRead(arrayBuffer) {
  ......
  // 这里能看到 会把信息push到流里
  const offset = streamBaseState[kArrayBufferOffset];
  const buf = new FastBuffer(arrayBuffer, offset, nread);
  result = stream.push(buf);
  ......
}
```
<code>stream.push(buf) --> Readable.prototype.push --> readableAddChunk --> addChuck --> stream.emit('data', chunk)</code>

答：子进程把输出信息push到stream时，调用一系列的方法，最终会触发steam.emit('data', chunk). 而child.stdout.on，只需监听就能每次子进程push到流的信息。本质上是利用了eventEmit


问：4. [所有流都是 EventEmitter的实例](https://nodejs.org/api/stream.html#stream_types_of_streams)。真的吗？如何实现？

从上一问可知，steam有on, emit方法。官网也说流是eventEmitter的实例。来看下源码
```js
// lib/internal/streams/readable.js
const { Stream, prependListener } = require('internal/streams/legacy');
function Readable(options) {
  Stream.call(this, options);
}
// lib/internal/streams/legacy.js
const EE = require('events')
function Stream(opts) {
  EE.call(this, opts);
}
ObjectSetPrototypeOf(Stream.prototype, EE.prototype);
ObjectSetPrototypeOf(Stream, EE);
```
答：可读流和可写流通过Stream.call(this)继承了Stream，而Steam[继承](../basic/code_write/extends.md)了EventEmitter。即Stream.\_\_proto__ = EventEmitter, Stream.prototype.\_\_proto__ = EventEmitter.prototype



参考：
[真-Node多线程](https://juejin.cn/post/6844903775937757192#heading-3)
[Node.js 子进程](https://github.com/liucaieson/MY-ESON/issues/5)