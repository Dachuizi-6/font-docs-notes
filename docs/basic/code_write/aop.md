:::warning
实现一个AOP装饰函数
:::

答：
```js
Function.prototype.before = function(beforeFn) {
  const context = this // 原函数
  return function() { // 返回一个装饰函数
    beforeFn.apply(this, arguments)
    return context.apply(this, arguments)
  }
}

Function.prototype.after = function(afterFn) {
  const context = this
  return function() {
    const res = context.apply(this, arguments)
    afterFn.apply(this, arguments)
    return res
  }
}
// 测试
function test() {
  console.log(2, arguments)
}
var aopTest = test
.before(function(){
  console.log(1, arguments)
})
.after(function() {
  console.log(3, arguments)
})
console.log(aopTest('zcl'))
```
![aop](@assets/basic/code_write/11.png)

注意：
1. 执行<code>Function.prototype.before</code>、<code>Function.prototype.after</code>函数，会返回装饰函数
2. 注意<code>this</code>指向，aop函数的beforeFn，afterFn的<code>this</code>指向和<code>参数</code>，与最终执行的装饰函数是一致的

## 应用场景
* 数据上报，埋点
```js
const submit = function() {
  console.log('点击提交')
}
const log = function() {
  console.log('记录点击次数')
}
submit.after(log)()
```
分离<code>业务代码</code>和<code>埋点代码</code>
* 表单验证
```js
Function.prototype.beforeValidate = function(beforeFn) {
  const context = this
  return function() {
    // beforefn 返回 false 的情况直接 return，不再执行后面的原函数
    if (beforeFn.apply(this, arguments) === false) return
    return context.apply(this, arguments)
  }
}
// 较验用户密码不能为空
const validate = function() {
  if (userName === '') return false
  if (password === '') return false
  return true
}
const submit = function () {
  // ..... 业务操作
}
submit.beforeValidate(validate)()
```
分离<code>较验输入</code>和<code>业务代码</code>

参考：
[JavaScript设计模式与开发实践]