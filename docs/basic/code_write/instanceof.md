::: warning
实现instanceOf
:::

答：

```js
function instanceOf(A, B) {
  if (typeof A !== 'object' || A === null) return false
  while (A.__proto__) {
    if (A.__proto__ === B.prototype) return true
    else A = A.__proto__
  }
  return false
}

// 测试
instanceOf([], Array) // true
instanceOf({}, Object) // true
instanceOf(123, Number) // false
123 instanceof Number // false
```

::: warning
typeof 和 instanceof 区别
:::
两者都是用来判断 类型的。
* typeof: 能准确判断除 <code>null</code> 以外的基本类型；注意 <code>typeof null === 'object'</code>
* instaceof: 原理是 判断构造函数的原型 是否是 实例对象 的原型链上