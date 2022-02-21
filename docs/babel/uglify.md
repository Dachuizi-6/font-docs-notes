可以在 [AST Explorer](https://astexplorer.net/)中直观感受到，如下图：

![ast](@assets/babel/1.png)

babel，eslint，v8的逻辑均与此类似，下图是我们引用了babel的转化示意图：

![babel](@assets/babel/2.png)

### 代码压缩原理
1. 将源代码转换为AST
2. 将AST通过一定的规则进行优化，转换成更简洁的AS
3. 将新生成的AST再转化成code

```js
const uglify = require('uglify-js');
const sourceCode = `
    function testFun() {
        var a = 1;
        var b = 2;
        return a + b;
    }
`;
const resultCode = uglify.minify(sourceCode);
console.log(resultCode.code); // function testFun(){return 3}
```
压缩后的代码，因为变量已经有了明确的值，直接将两个变量声明的代码去掉了，函数直接返回了两个明确的值相加的结果。查看[压缩规则](https://github.com/mishoo/UglifyJS#readme)

参考：
[浅谈JavaScript代码压缩](https://juejin.cn/post/6970655400211251213)