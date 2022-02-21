JS <code>call</code>、<code>apply</code>和<code>bind</code> 的区别？
* call 接受多个参数，apply 接受 一个包含多个参数的数组
* call和apply本质上是直接调用了函数，而bind是返回一个绑定了上下文的函数

```js
var value = 1;
function bar() {
    console.log(this.value);
}
bar.call(null); // 1

var foo = {
    value: 1
};
function bar(name, age) {
    return {
		value: this.value,
		name: name,
		age: age
    }
};
bar.call(foo, "Jack", 20); // {value: 1, name: "Jack", age: 20}
var bindFoo1 = bar.bind(foo, "Jack", 20); // 返回一个函数
bindFoo1(); // {value: 1, name: "Jack", age: 20}
```
<strong>this 参数可以传 null，当为 null 的时候，视为指向 window</strong>

思路：A.call(B, args) 和 A.apply(B, [args]) 本质上是执行A，A的this指向是B。那其实 B.A() 的形式来调用A函数, 即可

## 手写call、apply
::: warning
实现call
:::

答：
```js
Function.prototype.call2 = function(context) { // context 相当于 B
  context = context || window // this 相当于 A
  context.fn = this  // 相当于 B.A()
  const args = [...arguments].slice(1)
  const res =  context.fn(...args)
  delete context.fn
  return res
}

// 测试
var value = 1;
var foo = {
  value: 2
};
function bar() {
  console.log(this.value);
}
bar.call2(foo) // 2
bar.call2(null) // 1
```
根据思路来，其实实现call也很简单，注意：B.A() 给B额外添加属性方法A，执行方法A后，要给B去除这个属性 

::: warning
实现apply
:::
答：实现了call，实现apply也基本一样的. A.apply(B, [args]) 转成 B.A()
```js
Function.prototype.apply2 = function(context) {
  context = context || window
  context.fn = this
  const args = [...arguments].slice(1)
  const res = context.fn(args)
  return res
}

// 测试
var value = 1;
var foo = {
  value: 2
};
function bar() {
  console.log(this.value);
}
bar.apply2(foo) // 2
bar.apply2(null) // 1
```
注意：直接调类数组 arguments.slice() 会爆错

## 手写bind（待整理）
::: warning
实现bind
:::
先来看下bind的使用，最近初学写react, 也常用到bind
```js
var value = 2;
var foo = {
    value: 1
};
function bar(name, age) {
    return {
		value: this.value,
		name: name,
		age: age
    }
};

bar.call(foo, "Jack", 20); // {value: 1, name: "Jack", age: 20}
var bindFoo1 = bar.bind(foo, "Jack", 20); // 返回一个函数
bindFoo1(); // {value: 1, name: "Jack", age: 20}
var bindFoo2 = bar.bind(foo, "Jack"); // 返回一个函数
bindFoo2(20); // {value: 1, name: "Jack", age: 20}
```
四个特点：
* 可以指定this
* 返回一个函数
* 可以传入参数
* 柯里化: 在函数调用时只传递一部分参数进行调用，函数会返回一个新函数去处理剩下的参数


参考：[前端必会的手写实现面试题——bind](https://blog.csdn.net/weixin_45494904/article/details/108202657)