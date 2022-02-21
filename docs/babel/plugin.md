## babel流程
<img src="@assets/babel/3.png" style="width: 100%" />

1. 解析(parsing)，得到AST语法树
    * 词法解析(Lexical Analysis): 得到一个包含词法信息的<code>Tokens</code>数组。每个Token元素包含了语法片段、位置信息、以及类型信息
    * 语法解析(Syntactic Analysis): 把<code>Tokens</code>数组转换为<code>抽象语法树AST</code>
2. 转换(transform)，得到新的AST语法树: 转换阶段会对AST进行遍历，可对AST进行增删改查。Babel插件都是在这个阶段工作的
3. 生成(generate)，生成JS代码，同时会生成Source Map

词法解析生成的Tokens数组

![词法Tokens](@assets/babel/4.png)

<code>console.log('hello world')</code>对应的AST语法树。<code>Program</code>、<code>CallExpression</code>、<code>Identifier</code> 这些都是节点的类型，每个节点都是一个有意义的语法单元。 这些节点类型定义了一些属性来描述节点的信息。插件开发者会利用 [astexplorer](https://astexplorer.net/) 来审查解析后的AST树

![AST](@assets/babel/5.png)

## babel的架构
Babel 和 Webpack 为了适应复杂的定制需求和频繁的功能变化，都使用了 [微内核](https://juejin.cn/post/6844903943068205064#heading-10) 的架构风格。也就是说它们的核心非常小，大部分功能都是通过<code>插件扩展</code>实现的

![babel](@assets/babel/6.png)

1. <code>@babel/core</code>是Babel的核心。负责加载插件；调用<code>Parser</code>进行解析，生成AST树；调用<code>Traverser</code>遍历AST；生成代码，包括SourceMap转换和源代码生成
2. Parser(@babel/parser): 将源代码解析成AST
3. Traverser(@babel/traverser): 实现了<code>访问者模式</code>，对AST进行遍历，<code>转换插件</code>会通过它获取感兴趣的AST节点，对节点进行操作
4. Generator(@babel/generator): 将AST转换为源代码，支持SourceMap
5. 转换插件：Babel仓库将转换插件划分为两种(只是命名上的区别)
    * <code>@babel/plugin-transform-*</code>： 普通的转换插件
    * <code>@babel/plugin-proposal-*</code>： 还在’提议阶段’(非正式)的语言特性
6. 插件预调：插件集合，方便对插件进行管理和使用。<code>@babel/preset-env</code>智能预设，允许你使用最新的JavaScript。无需关心语法转换的细节
7. <code>@babel/types</code>： AST 节点构造器和断言. 插件开发时使用很频繁
8. @babel/node: 可直接支行需要Babel处理的JS文件
0. @babel/cli: Cli工具

## 访问者模式(了解)
访问者模式平时基本没接触，可以看[访问者模式](https://fanerge.github.io/2017/js%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F-%E8%AE%BF%E9%97%AE%E8%80%85%E6%A8%A1%E5%BC%8F.html)加深理解。个人理解：<code>访问者(Visitor)定义好visit方法，参数为被访问的对象</code>。想象一下，Babel 有那么多插件，如果每个插件自己去遍历AST，对不同的节点进行不同的操作，维护自己的状态。这样子不仅低效，它们的逻辑分散在各处，会让整个系统变得难以理解和调试， 最后插件之间关系就纠缠不清，乱成一锅粥。

所以转换器操作 AST 一般都是使用访问器模式，由这个访问者(Visitor)来
1. 进行统一的遍历操作
2. 提供节点的操作方法
3. 响应式维护节点之间的关系
4. 访问者(即插件)只需要定义自己感兴趣的节点类型，当访问者访问到对应节点时，就调用插件的访问(visit)方法

访问者会以深度优先的顺序, 或者说递归地对 AST 进行遍历，其调用顺序如下图所示: 绿线表示进入该节点，红线表示离开该节点。

![traverser](@assets/babel/7.png)

当访问者进入一个节点时就会调用 enter(进入) 方法，反之离开该节点时会调用 exit(离开) 方法。 一般情况下，插件不会直接使用enter方法，只会关注少数几个节点类型，所以具体访问者也可以这样声明访问方法:
```js
const traverse = require('@babel/traverse').default
const babel = require('@babel/core')
const generate = require('babel-generator').default
const code = `function hello(v) {
  console.log('hello' + v + '!')
}`
const ast = babel.parseSync(code)

traverse(ast, {
  Identifier(path) {
    console.log(`enter Identifier`)
  },
  CallExpression(path) {
    console.log(`enter CallExpression`)
  },
  BinaryExpression: {
    enter(path) {
      console.log('enter binaryExpression')
    },
    exit(path) {
      console.log('exit binaryExpression')
    },
  }
})
const output = generate(ast)
/*
enter Identifier
enter Identifier
enter CallExpression
enter Identifier
enter Identifier
enter binaryExpression
enter binaryExpression
enter Identifier
exit binaryExpression
exit binaryExpression

{
  code: 'function hello(v) {\n  console.log(\'hello\' + v + \'!\');\n}',
  map: null,
  rawMappings: null
}
*/
```

```js
// 将console.log('hello' + v + '!')语句替换为return "hello" + v;, 下图是遍历的过程：
traverse(ast, {
  ExpressionStatement(path) {
    // 将 `console.log('hello' + v + '!')` 替换为 `return ‘hello’ + v`
    const rtn = t.returnStatement(t.binaryExpression('+', t.stringLiteral('hello'), t.identifier('v')))
    path.replaceWith(rtn)
  },
})
```
![replace](@assets/babel/8.png)

## 面试
问：说说你对Babel的了解？

答：
Babel的原理：是解析源代码，经过词法分析和语法分析，得到AST树；对AST树进行遍历转换，得到新的AST树；通过新的AST生成新的源代码。

Babel的架构：是微内核架构，和webpack, postcss类型。babel的核心非常小，大部分功能是通过插件扩展的。

Babel插件有很多，比如：@babel/core：babel的核心、@babel/parser: 将源代码转换成AST、@babel/traverser: 遍历AST、@babel/generator: 将AST转换成源代码、@babel/cli: babel的cli工具、@babel/preset-env：智能预设插件集合。。。。等等


问：写过Babel插件吗？说下原理

答：
写过一个[去除debugger语法](https://github.com/0zcl-free/babel-plugin-transform-remove-debugger)的babel插件。

原理：
1. 解析源代码，经过词法分析和语法分析，得到AST树
2. 对AST树进行遍历转换，得到新的AST树；
3. 通过新的AST生成新的源代码。
插件是在第二步，对AST树做增删查改的处理。第二步中，使用了访问者模式，AST树相当于被访问者，而插件访问AST，做处理，所以是访问者。访问者实现一个visit接口，参数为被访问的对象（即AST节点)
```js
module.exports = function() {
  return {
    visitor: {
      DebuggerStatement(path) {
        path.remove()
      }
    }
  }
}
```

参考：
[深入浅出 Babel 上篇：架构和原理 + 实战](https://bobi.ink/2019/10/01/babel/)
[astexplorer](https://astexplorer.net/)
[Babel插件手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md)
[访问者模式](https://fanerge.github.io/2017/js%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F-%E8%AE%BF%E9%97%AE%E8%80%85%E6%A8%A1%E5%BC%8F.html)