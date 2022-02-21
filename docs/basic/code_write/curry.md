* [计算机科学中的定义](https://zh.wikipedia.org/wiki/%E6%9F%AF%E9%87%8C%E5%8C%96)：柯里化是一种将使用多个参数的一个函数转换成一系列使用一个参数的函数的技术.
* [JS中的定义](https://juejin.cn/post/6939160922170605604)：当函数有多个参数的时候，我们可以对函数进行改造。我们可以调用一个函数，只传递部分的参数（这部分参数以后永远不变），然后让这个函数返回一个新的函数。新的函数传递剩余的参数，并且返回相应的结果

```js
function add(a, b, c) {
  return a + b + c
}
add(1, 2, 3)
// 假设有一个 curry 函数可以做到柯里化, 返回一个新的函数addCurry
var addCurry = curry(add)
addCurry(1)(2)(3)
addCurry(1)(2, 3)
addCurry(1, 2)(3)
```

:::warning
实现curry函数
:::
答：
```js
function curry(fn) {
  let args = []
  return function() {
    args = args.concat([...arguments])
    if (args.length >= fn.length) { // 终止条件
      const res = fn.apply(this, args)
      args = [] // 清空收集的参数
      return res
    } else {
      return arguments.callee
    }
  }
}
// 测试
function add(a, b, c) {
  return a + b + c
}
var addCurry = curry(add)
addCurry(1)(2)(3) // 6
addCurry(1)(2, 3) // 6
addCurry(1, 2)(3) // 6
```
思路：闭包把参数保存起来，当参数的数量足够执行函数了，就开始执行函数
1. curry柯里化 传入函数A，柯里化后返回一个新的函数
2. 利用闭包，收集参数
3. 使用递归。如果闭包收集的参数与函数A的参数相同【终止条件】，则执行函数A，如果小于，则返回一个函数，继续收集参数，直到达到终止条件，跳出递归

注意点：
1. 使用[arguments.callee](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/arguments/callee)，调用匿名函数本身
2. 达到终止条件时，会清空收集的参数。否则多次调用<code>addCurry(1)(2)(3)</code>会出错。

![error](@assets/basic/code_write/12.png)

这是因为执行<code>addCurry(1)(2)(3)</code>此时args为[1,2,3]，再执行<code>addCurry(1)(2, 3)</code>，addCurry(1)返回6，并不是函数，因此爆错。故这里我加了清空, 但还是有问题的，比如执行下方的应用场景

最终版：
```js
function curry(fn) {
  return function curriedFn() {
    const args = [...arguments]
    if (args.length >= fn.length) { // 终止条件
      return fn.apply(this, args)
    } else {
      return function() {
        return curriedFn.apply(this, args.concat([...arguments]))
      }
    }
  }
}
// 测试
function add(a, b, c) {
  return a + b + c
}
var addCurry = curry(add)
addCurry(1)(2)(3) // 6
addCurry(1)(2, 3) // 6
addCurry(1, 2)(3) // 6
```
思路与上面基本一致的，只是改进了收集参数的方式。


## 应用场景
工作中经常遇到各种需要正则校验的需求，一般我们会这样做：
```js
// 非柯里化版本
function checkByRegExp(regExp,string) {
  return regExp.test(string);  
}

checkByRegExp(/^1\d{10}$/, '15010001000'); // 校验电话号码
checkByRegExp(/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/, 'test@163.com'); // 校验邮箱
```
缺点：某个电话号的正则检验出现了改变，就需要去修改<code>checkByRegExp(/^1\d{10}$/, '15010001000')</code>，代码中有100处使用到了电话较验，那就得 修改100个地方了!! 这显然存在冗余! 

能不能只修改一个地方的电话正则即可？
```js
//进行柯里化
let _check = curry(checkByRegExp);
//生成工具函数，验证电话号码
let checkCellPhone = _check(/^1\d{10}$/);
//生成工具函数，验证邮箱
let checkEmail = _check(/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/);

checkCellPhone('18642838455'); // 校验电话号码
checkEmail('test@gmail.com'); // 校验邮箱
```

参考：
[【深入理解】柯里化&手写 Lodash 中 curry 函数｜ 技术点评](https://juejin.cn/post/6939160922170605604)
[JavaScript专题之函数柯里化](https://github.com/mqyqingfeng/Blog/issues/42)