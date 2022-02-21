在单核 CPU 系统之上我们采用 单进程 + 单线程 的模式来开发。

在多核 CPU 系统之上，可以通过 child_process.fork 开启多个进程（Node.js 在 v0.8 版本之后新增了Cluster 来实现多进程架构） ，即 多进程 + 单线程 模式。

注意：开启多进程不是为了解决高并发，主要是解决了单进程模式下 Node.js CPU 利用率不足的情况，充分利用多核 CPU 的性能
## cluster原理
集群模块可以轻松创建共享服务器端口的子进程。[cluster](http://nodejs.cn/api/cluster.html)
```js
const http = require('http')
const numCpus = require('os').cpus().length
const cluster = require('cluster')
if (cluster.isMaster) {
  console.log('Master process id is: ', process.pid)
  // fork workers
  for (let i=0; i<numCpus; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  })
} else {
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

![cluster](@assets/node/8.png)

cluster模块调用fork方法来创建子进程，该方法与child_process中的fork是同一个方法。cluster模块采用的是经典的主从模型，Cluster会创建一个master，然后根据你指定的数量复制出多个子进程，可以使用 <code>cluster.isMaster</code>属性判断当前进程是master还是worker(工作进程)。

由master进程来管理所有的子进程，主进程不负责具体的任务处理，主要工作是负责调度和管理。

如果多个Node进程监听同一个端口时会出现 Error:listen EADDRIUNS的错误，而cluster模块为什么可以让多个子进程监听同一个端口呢?

原因是master进程内部启动了一个<code>TCP服务器</code>，而真正监听端口的只有这个服务器，当来自前端的请求触发服务器的connection事件后，<code>master会将对应的socket具柄发送给子进程</code>。


## Node.js进程通信原理
IPC: inter-process communication. [进程间通信](https://juejin.cn/post/6844903911556382728)有哪些？
1. 管道（父子进程、兄弟进程之间）: 创建子进程时，默认使用管道[pip](http://nodejs.cn/api/child_process.html#optionsstdio)
2. 信号量
3. 共享内存
4. 消息队列

IPC通信管道是如何创建的？

![pip](@assets/node/9.png)

父进程在创建子进程前，会创建IPC管道并监听它，然后再创建出子进程，同时会通过环境变量（NODE_CHANNEL_FD）告诉子进程这个IPC通道的文件描述符。子进程启动时，根据文件描述符去连接IPC管道。从而完成父子进程之间的连接


send句柄发送的时候，真的是将服务器对象发送给了子进程？

![pip](@assets/node/10.png)

发送到IPC管道中的实际上是我们要发送的<code>句柄文件描述符</code>, JSON.stringfy()序列化再发送到IPC管道，子进程JSON.parse()解析还原为对象。个人理解：主进程发送句柄到管道，子进程接收句柄并创建对应的服务。虽然看起来像是主进程的服务在处理的，但实际上是通过句柄，子进程创建的服务在处理的。


### 实现一个多进程架DEMO
master.js
:::details
```js
// master.js
const fork = require('child_process').fork;
const cpus = require('os').cpus();

const server = require('net').createServer();
server.listen(3000);
process.title = 'node-master'

const workers = {};
const createWorker = () => {
    const worker = fork('worker.js')
    worker.on('message', function (message) {
        if (message.act === 'suicide') {
            createWorker();
        }
    })
    worker.on('exit', function(code, signal) {
        console.log('worker process exited, code: %s signal: %s', code, signal);
        delete workers[worker.pid];
    });
    worker.send('server', server);
    workers[worker.pid] = worker;
    console.log('worker process created, pid: %s ppid: %s', worker.pid, process.pid);
}

for (let i=0; i<cpus.length; i++) {
    createWorker();
}

process.once('SIGINT', close.bind(this, 'SIGINT')); // kill(2) Ctrl-C
process.once('SIGQUIT', close.bind(this, 'SIGQUIT')); // kill(3) Ctrl-\
process.once('SIGTERM', close.bind(this, 'SIGTERM')); // kill(15) default
process.once('exit', close.bind(this));

function close (code) {
    console.log('进程退出！', code);

    if (code !== 0) {
        for (let pid in workers) {
            console.log('master process exited, kill worker pid: ', pid);
            workers[pid].kill('SIGINT');
        }
    }

    process.exit(0);
}
```
:::

worker.js
:::details
```js
// worker.js
const http = require('http');
const server = http.createServer((req, res) => {
	res.writeHead(200, {
		'Content-Type': 'text/plan'
	});
	res.end('I am worker, pid: ' + process.pid + ', ppid: ' + process.ppid);
	throw new Error('worker process exception!'); // 测试异常进程退出、重启
});

let worker;
process.title = 'node-worker'
process.on('message', function (message, sendHandle) {
	if (message === 'server') {
		worker = sendHandle;
		worker.on('connection', function(socket) {
			server.emit('connection', socket);
		});
	}
});

process.on('uncaughtException', function (err) {
	console.log(err);
	process.send({act: 'suicide'});
	worker.close(function () {
		process.exit(1);
	})
})

```
:::


[深入理解 Node.js 进程与线程](https://mp.weixin.qq.com/s/VzXnnfn4gCBMd5wea3LRIg)