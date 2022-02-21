::: warning
请写出new的实现
:::

答：
```js
function myNew() {
  const obj = new Object()
  const constructor = Array.prototype.shift.call(arguments)
  obj.__proto__ = constructor.prototype
  const res = constructor.apply(obj, arguments)
  return res instanceof Object ? res : obj
}
```
![new](@assets/basic/code_write/1.png)

1. 创建一个空对象，作为返回的实例
2. 把空对象的<code>__proto__</code>指向构造函数的<code>prototype</code>
3. 把空对象 赋值给 构造函数的<code>this</code>, 并执行构造函数。(如：this.name = 'zcl'，此时this为新建对象obj，相当于给obj赋于构建函数的属性)
4. 如果 第三步的构造函数 没有返回 对象