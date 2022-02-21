::: warning
说说 JS 继承有几种方式和优缺点
:::


## 继承的优点
* 继承可以使得子类具有父类别的各种属性和方法，而不需要再次编写相同的代码
* 子类继承父类别的同时，也可以重新定义某些属性，并重写某些方法，即覆盖父类别的原有属性和方法，使其获得与父类别不同的功能

## JS 常见的继承方式
常见有<code>6种继承</code>方式
* 原型链继承
* 构造函数继承
* 组合继承
* 原型式继承
* 寄生式继承
* 寄生组合式继承

### 1、原型链继承
```js
function SuperType() {
  this.colors = ["red", "blue", "green"]
}
function SubType() {}
SubType.prototype = new SuperType()

// 测试
var instance1 = new SubType()
instance1.colors.push('black')
console.log(instance1.colors) // ["red", "blue", "green", "black"]
var instance2 = new SubType()
console.log(instance2.colors) // ["red", "blue", "green", "black"]
```

![inherit](@assets/basic/code_write/4.png)

优点：简单

缺点：
1. 多个子类实例 共享 一个子类构造函数的原型。会导致数据污染，影响其它子类实例
2. 创建子类实例时，无法向父类构造函数传参


### 2、构造函数继承
```js
function SuperType() {
  this.colors = ["red", "blue", "green"]
}
function SubType() {
  SuperType.call(this)
}

// 测试
var instance1 = new SubType()
instance1.colors.push('black')
console.log(instance1.colors) // ["red", "blue", "green", "black"]
var instance2 = new SubType()
console.log(instance2.colors) // ["red", "blue", "green"]
```

核心代码是<code>SuperType.call(this)</code>，创建子类实例时调用SuperType构造函数，于是SubType的每个实例都会将SuperType中的属性复制一份

优点：解决 多个子类实例 共享 一个子类构造函数的原型，导致的数据污染问题

缺点：
1. 只能继承父类的实例属性和方法，不能继承父类的原型的属性和方法
2. 无法实现父类实例方法的复用。每个子类都有父类实例方法的副本，多少会影响性能

### 3、组合继承
组合上述两种方法就是组合继承。<code>用原型链实现对原型属性和方法的继承，用构造函数技术来实现实例属性的继承</code>
```js
function SuperType(name) {
  this.name = name
  this.colors = ["red", "blue", "green"]
}
function SubType(name, age) {
  SuperType.call(this, name) // 用构造函数技术来实现实例属性的继承
  this.age = age
}
SubType.prototype = new SuperType() // 用原型链实现对原型属性和方法的继承
SubType.prototype.constructor = SubType // 重写SubType.prototype的constructor属性，指向自己的构造函数SubType

// 测试
var instance1 = new SubType('zcl', 26)
instance1.colors.push("black")
console.log(instance1.colors) // ["red", "blue", "green", "black"]
```
![inherit](@assets/basic/code_write/5.png)

优点：是 JS 中最常用的继承模式
1. 原型链实现对父类的原型属性和方法的继承
2. 用构造函数技术来实现对父类实例属性的继承

缺点：
1. 调用了父类函数两次，存在一定的性能问题
* 第一次调用SuperType()：给SubType.prototype写入两个属性name，color
* 第二次调用SuperType()：给instance1写入两个属性name，color

### 4、原型式继承
```js
// 类型Object.create()
function createObj(obj) {
  function F() {}
  F.prototype = obj
  return new F()
}
```
原型式继承原理和 [Object.create](./create.md) 基本一样。返回一个对象，对象的__proto__ 指向 object 传入的参数

优点：简单

缺点：(同原型式继承）
1. 多个子类实例 共享 一个子类构造函数的原型。会导致数据污染，影响其它子类实例
2. 创建子类实例时，无法向父类构造函数传参

### 5、寄生式继承
核心：<code>在原型式继承的基础上，增强对象，返回构造函数</code>
```js
function createObj(obj) {
  const newObj = Object.create(obj)
  newObj.sayHi = function() {
    console.log('hi, zcl')
  }
  return newObj
}

// 测试
var person = {
  name: "Nicholas",
  friends: ["Shelby", "Court", "Van"]
}
var anotherPerson = createObj(person)
anotherPerson.sayHi() // hi, zcl
```
优点：有原型式继承的基础上，有所改进改

缺点：(同原型式继承）

### 6、寄生组合式继承
重复下组合继承
```js
function SuperType(name) {
  this.name = name
  this.colors = ["red", "blue", "green"]
}
function SubType(name, age) {
  SuperType.call(this, name) 
  this.age = age
}
SubType.prototype = new SuperType()
SubType.prototype.constructor = SubType
var instance1 = new SubType('zcl', 26)
```
组合继承，作为最常用的继承方式，有个缺点，就是调用了两次父类构造函数。
* 一次是设置子类构造函数的原型的时候：
```js
SubType.prototype = new SuperType()
```
* 一次在创建子类型实例的时候:
```js
var instance1 = new SubType('zcl', 26)
```
在 [手写new](./new.md) 中知道，new的实现中会 执行一次 构造函数. 

那么我们该如何精益求精，避免这一次重复调用呢？

如果我们不使用 Child.prototype = new Parent() ，而是间接的让 SubType.prototype 访问到 SuperType.prototype 呢？
```js
function SuperType(name) {
  this.name = name
  this.colors = ['red', 'blue', 'green']
}
function SubType(name, age) {
  SuperType.call(this, name)
  this.age = age
}
fucntion F() {}
F.prototype = SuperType.prototype
SubType.prototype = new F()
```
最后我们封装一下这个继承方法：
```js
function createObj(obj) {
  function F(){}
  F.prototype = obj
  return new F()
}
function inherit(SubType, SuperType) {
  const prototype = createObj(SuperType.prototype)
  SubType.prototype = prototype
  prototype.constructor = SubType
}

// 测试
function SuperType(name) {
  this.name = name
  this.colors = ['red', 'blue', 'green']
}
SuperType.prototype.sayHi = () => {
  console.log('hi, zcl')
}
function SubType(name, age) {
  SuperType.call(this, name)
  this.age = age
}
inherit(SubType, SuperType)
var instance1 = new SubType('zcl', 26)
```
![inherit](@assets/basic/code_write/6.png)

优点：
1. 寄生组合式继承和组合继承相比。只调用了父类构造函数一次，节约了性能。
2. 保证了原型链上下文不变。子类的prototype只有子类通过prototype声明的属性和方法，父类的prototype只有父类通过prototype声明的属性和方法


参考：
[这样回答继承，面试官可能更满意](https://juejin.cn/post/6844904013096288269)