## 流程
![zcl-pack](@assets/webpack/25.png)

## 代码解析
配置文件, 只要入口和出口就够了
```js
module.exports = {
  entry: path.join(__dirname, 'src/index.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js'
  }
}
```

compiler.js
```js
class Compiler {
  constructor(options) {
    const { entry, output } = options
    this.entry = entry
    this.output = output
    this.modules = []
  }

  run() {
    const entryModule = this.buildModule(this.entry, true)
    this.modules.push(entryModule)
    this.modules.map(_module => {
      _module.dependencies.map(dependency => {
        this.modules.push(this.buildModule(dependency))
      })
    })
    this.emitFiles()
  }
  
  buildModule(filename, isEntry) {
    let ast
    if (isEntry) {
      ast = getAST(filename)
    } else {
      let absolutePath = path.join(process.cwd(), './src', filename)
      ast = getAST(absolutePath)
    }
    
    return {
      filename,
      dependencies: getDependencies(ast),
      transformCode: transform(ast)
    }
  }

  emitFiles() {
    // ......
  }
}
```

parse.js模块, 实现三个功能，生成AST语法树、traverse遍历、代码转换。[parseSync](https://babeljs.io/docs/en/babel-core#parsesync), [transformFromAst](https://babeljs.io/docs/en/babel-core#transformfromast)
```js
const babel = require('@babel/core')
const traverse = require('@babel/traverse').default
const fs = require('fs')

module.exports = {
  getAST: (path) => {
    const content = fs.readFileSync(path, 'utf-8')
    return babel.parseSync(content)
  },
  getDependencies: (ast) => {
    const dependencies = []
    traverse(ast, {
      ImportDeclaration: ({ node }) => {
        dependencies.push(node.source.value)
      }
    })
    return dependencies
  },
  transform: (ast) => {
    const { code, map } = babel.transformFromAst(ast, null, {
      'presets': ['@babel/preset-env']
    })
    console.log('code', code)
    console.log('map', map)
    return code
  }
}
```
附[Github](https://github.com/0zcl-free/zcl-pack), parse模块需要对AST和Babel有一定了解，看不懂可以先看[babel原理](../../babel/plugin.md)

