::: warning
手写 Object.create
:::

答：
原理：本质上是返回一个对象，对象的构造函数的原型是create传入的第一个参数。
```js
function create(obj, propertiesObject = {}) {
  function F() {}
  const res = new F()
  res.__proto__ = obj
  Object.defineProperties(res, propertiesObject)
  return res
}

// 或者
// fucntion F() {}
// F.prototype = obj
// const res = new F()

// 测试
create({}, { name: { value: 'zcl' } })
Object.create({}, { name: { value: 'zcl' } })
```

![create](@assets/basic/code_write/3.png)