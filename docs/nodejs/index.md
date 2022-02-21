需求：在前端工程化的过程中，不可避免地会用 Node.js 来读取文件，例如想找到 src 目录下所有 js 和 jsx 文件
```js
const glob = require('glob')
const files = glob.sync('src/**/*.js{,x}')
console.log(files)
```
## 单个星号
概念：单个星号 * 用于匹配单个片段中的零个或多个字符
* src/*.js 表示 src 目录下所有以 js 结尾的文件，但是不能匹配 src 子目录中的文件，例如 src/login/login.js
* /home/*/.bashrc 匹配所有用户的 .bashrc 文件
```
需要注意的是，* 不能匹配分隔符 /，也就是说不能跨片段匹配字符
```

## 问号
概念：? 匹配单个片段中的单个字符
* test/?at.js 匹配形如 test/cat.js、test/bat.js 等所有3个字符且后两位是 at 的 js 文件，但是不能匹配 test/flat.js
* src/index.?? 匹配 src 目录下以 index 打头，后缀名是两个字符的文件，例如可以匹配 src/index.js 和 src/index.md，但不能匹配 src/index.jsx

## 中括号
概念：同样是匹配单个片段中的单个字符，但是字符集只能从括号内选择，如果字符集内有 -，表示范围。
* test/[bc]at.js 只能匹配 test/bat.js 和 test/cat.js
* test/[c-f]at.js 能匹配 test/cat.js、test/dat.js、test/eat.js 和 test/fat.js

## 惊叹号
概念：表示取反，即排除那些去掉惊叹号之后能够匹配到的文件。
* test/[!bc]at.js 不能匹配 test/bat.js 和 test/cat.js，但是可以匹配 test/fat.js
* !test/tmp/**' 排除 test/tmp 目录下的所有目录和文件

## 两个星号
概念：两个星号 ** 可以跨片段匹配零个或多个字符。即 ** 是递归匹配所有文件和目录
* /var/log/** 匹配 /var/log 目录下所有文件和文件夹，以及文件夹里面所有子文件和子文件夹
* /var/log/**/*.log 匹配 /var/log 及其子目录下的所有以 .log 结尾的文件
* /home/*/.ssh/**/*.key 匹配所有用户的 .ssh 目录及其子目录内的以 .key 结尾的文件

参考：https://juejin.cn/post/6876363718578405384