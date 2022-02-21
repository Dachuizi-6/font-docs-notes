::: warning
实现ES6 extends继承
:::

答：

```js
function SuperType(name) {
  this.name = name
}
SuperType.sayHi = () => {
  return 'hi, super'
}
SuperType.prototype.sayHello = () => {
  return 'hello, super'
}
function SubType(name, age) {
  SuperType.call(this, name)
  this.age = age
}
function inherit(SubType, SuperType) {
  SubType.prototype = Object.create(SuperType.prototype)
  SubType.prototype.constructor = SubType
  SubType.__proto__ = SuperType
}
inherit(SubType, SuperType)

// 测试
new SubType('zcl', 26)
SubType.sayHi() // hi, super
```

![extends](@assets/basic/code_write/extends.png)

ES6的 <code>extends</code>实现，与[JS寄生式组合继承](./inherit.md)十分相似，唯一不同的是 extends 把子类构造函数 <code>\_\_proto__</code> 指向父类构造函数，继承父类的静态方法