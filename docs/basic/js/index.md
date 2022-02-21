## 变量提升
JS 引擎把变量的声明部分和函数声明部分 提升到代码开头的行为。变量被提升后，会给变量设置默认值： undefined

实际上变量和函数声明在代码里的位置是不会改变的，而且是在<code>编译阶段</code>被 JS 引擎放入内存中
```js
showName()
console.log(myname)
var myname = '极客时间'
function showName() {
    console.log('函数showName被执行');
}
// 测试
// 函数showName被执行
// undefined
```
![hoisting](@assets/basic/js/1.png)
## 执行上下文与变量环境
输入一段代码，经过编译，生成两部分
1. 执行上下文。变量和函数会被存放到<code>变量环境</code>中
2. 可执行代码

## 考一考
:::warning
执行下面代码，打印出啥？
```js
showName()
var showName = function() {
    console.log(2)
}
showName()
function showName() {
    console.log(1)
}
```
:::
答：
```js
编译过程：
var showName = undefined
function showName() {
  console.log(1)
}
执行阶段：
showName() // 输出1
showName = function() {
  console.log(2)
}
showName() // 输出2
// 如果后面再有showName执行的话，就输出2因为这时候函数引用已经变了
```
变量提升和函数提升的优先级，函数提升高于变量提升，<strong>当存在同名时，在变量赋值之前函数声明还是函数声明，不会被覆盖</strong>，当变量赋值之后，函数声明将被变量覆盖。[JavaScript变量提升和函数提升](https://zhuanlan.zhihu.com/p/364416036)
## 为什么 JS 代码会出现栈溢出？
每调用一个函数，JS引擎为其创建<code>执行上下文</code>，并压入栈中，而调用栈是有大小的，当栈的执行上下文超过一定数量时，就会出现<code>栈溢出</code>。

<img src="@assets/basic/js/2.png" style="width: 50%;" />

## var缺陷以及如何解决？
var缺陷：
1. 变量提升
2. 污染全局变量
```js
function foo(){
  for (var i = 0; i < 7; i++) {
  }
  console.log(i); 
}
foo() // 7
```
解决var缺陷：
ES6引入 <code>let</code> 和 <code>const</code> 关键字, 使其拥有<code>块级作用域</code>
```js
function letTest() {
  let x = 1;
  if (true) {
    let x = 2;  // 不同的变量
    console.log(x);  // 2
  }
  console.log(x);  // 1
}
```

## 块级作用域与词法环境
在编译阶段，通过 var 声明的变量放到了<code>变量环境</code>中，通过 let、const 声明的变量放到了<code>词法环境</code>中
```js
function foo(){
  var a = 1
  let b = 2
  {
    let b = 3
    var c = 4
    let d = 5
    console.log(a) // 1
    console.log(b) // 3
  }
  console.log(b) // 2
  console.log(c) // 4
  console.log(d) // 出错
}   
foo()
```
<img src="@assets/basic/js/3.png" style="width: 60%;" />
<img src="@assets/basic/js/4.png" style="width: 39%;" />

1. 词法环境中也维护了一个栈结构，栈底是函数最外层的变量
2. 沿着词法环境的栈顶向下查询，如果没找到，在变量环境中查找
3. 当<code>作用域</code>执行结束后，该作用域的信息就会从栈顶弹出

## 作用域链与词法作用域
```js
function bar() {
  console.log(myName)
}
function foo() {
  var myName = "极客邦"
  bar()
}
var myName = "极客时间"
foo() // 极客时间
```
在每个<code>执行上下文的变量环境</code>中，都包含了一个<code>外部引用</code>，用来<strong>指向外部的执行上下文</strong>，我们把这个外部引用称为<code>outer</code>

当使用了一个变量时，js 引擎首先在当前上下文中查找，找不到就继续在outer指向的上下文中查找。这个查找的链条就作用域链

![outer](@assets/basic/js/5.png)

问：foo 函数调用的 bar 函数，那为什么 bar 函数的外部引用是全局执行上下文，而不是 foo 函数的执行上下文？

答：JS的作用域链是由<code>词法作用域</code>决定的，词法作用域又由代码中函数声明的位置来决定的。词法作用域是代码编译阶段就决定好的，和函数怎么调用没有关系。


## 闭包【重要】
定义：在JS中，根据词法作用域的规则，内部函数总是可以访问其外部函数声明的变量。当通过调用一个<code>外部函数</code>返回一个<code>内部函数</code>后，即使外部函数已经执行结束了，但由于存在内部函数对外部函数变量的引用，因此这些变量依然保存在内存中，<code>变量的集合就称为闭包</code>

![closure](@assets/basic/js/6.png)

闭包如何回收？
* 引用闭包的函数是一个全局变量：闭包会一直存在直到页面关闭。
* 引用闭包的函数是一个局部变量：函数销毁后，在下次 JavaScript 引擎执行垃圾回收时，判断闭包这块内容如果已经不再被使用了，那么 JavaScript 引擎的垃圾回收器就会回收这块内存
:::tip
1. 闭包不会造成内存泄漏。闭包可能会常驻在内存中。程序写错了才会造成内存泄漏
2. 如果该闭包会一直使用，那么它可以作为全局变量而存在；但如果使用频率不高，而且占用内存又比较大的话，那就尽量让它成为一个局部变量
:::

## this的设计缺陷及应对方案
执行上下文中包含了<code>变量环境</code>、<code>词法环境</code>、<code>外部环境</code>和<code>this</code>

<img src="@assets/basic/js/7.png" style="width: 40%;" />

1. 嵌套函数中的 this 不会从外层函数中继承
```js
var myObj = {
  name : "极客时间", 
  showThis: function(){
    console.log(this) // {name: "极客时间", showThis: ƒ}
    function bar(){console.log(this)} // window
    bar()
  }
}
myObj.showThis()
```
* self=this
* 箭头函数: 箭头函数没有自己的执行上下文，所以它会继承调用函数中的 this

2. 普通函数中的 this 默认指向全局对象 window
* 在严格模式下，默认执行一个函数，其函数的执行上下文中的 this 值是 undefined

## 考一考
```js
let userInfo = {
  name:"jack.ma",
  age:13,
  sex:male,
  updateInfo:function(){
    setTimeout(function(){
      this.name = "pony.ma"
      this.age = 39
      this.sex = female
    },100)
  }
}
userInfo.updateInfo()
```
问：通过 updateInfo 来更新 userInfo 里面的数据信息，但是这段代码存在一些问题，你能修复这段代码吗？

答：
```js
let userInfo = {
  name:"jack.ma",
  age:13,
  sex:'male',
  updateInfo:function(){
    setTimeout(() => {
      this.name = "pony.ma"
      this.age = 39
      this.sex = 'female'
    },100)
  }
}
```

## 垃圾数据是如何自动回收的
```js
function foo(){
  var a = 1
  var b = {name:"极客邦"}
  function showName(){
    var c = 2
    var d = {name:"极客时间"}
  }
  showName()
}
foo()
```
1. 调用栈中的数据如何被销毁

答：当一个函数执行结束后，js引擎会通过向下移动<code>ESP指针</code>来销毁该函数保存在栈中的<code>执行上下文</code>

![esp](@assets/basic/js/8.png)

2. 堆中的数据如何被销毁
回收堆的垃圾数据，需要用到 JS 的<code>垃圾回收器</code>

代际假说
* 大部分对象在内存中存活时间很短
* 不死的对象会活的更久

因此，V8 把堆分为 <code>新生代</code> 和 <code>老生代</code>。
1. 新生代中存放的是生存时间短的对象。新生区通常只支持 1～8M 的容量。新生代使用<code>副垃圾回收器</code>
2. 老生代中存放的生存时间久的对象。老生区支持的容量就大很多了。老生代使用<code>主垃圾回收器</code>

垃圾回收处理逻辑
1. 新生代：把新生代空间对半划分为两个区域，一半是<code>对象区域</code>，一半是<code>空闲区域</code>; 新加入的对象都会存放到对象区域，当对象区域快被写满时，回收非存活的对象，再把存活的对象有序地放入空闲区域，对象区域与空闲区域进行角色翻转。经过两次垃圾回收依然还存活的对象，会被移动到老生区中。

<img src="@assets/basic/js/11.png" style="width: 70%">

2. 老生代：
* 标记 - 清除：回收不能到达的对象
* 标记 - 整理：让所有存活的对象都向一端移动，不产生大量不连续的内存碎片

<img src="@assets/basic/js/9.png" style="width: 48%">
<img src="@assets/basic/js/10.png" style="width: 48%">


## 描述一下 V8 执行一段JS代码的过程
编译型语言和解释型语言
1. 编译型语言: 在程序执行之前，需要经过编译器的编译过程，并且编译之后会直接保留机器能读懂的<code>二进制文件</code>，这样每次运行程序时，都可以直接运行该二进制文件，而不需要再次重新编译了。比如 C/C++、GO 等都是编译型语言。
2. 解释型语言: 在每次运行时都需要通过解释器对程序进行动态解释和执行。比如 Python、JAVA、JavaScript 等都属于解释型语言。

![](@assets/basic/js/12.png)

### v8如何执行一段代码
![v8](@assets/basic/js/13.png)

1. 生成AST抽象语法树和执行上下文。通过<code>词法分析</code> -> <code>语法分析</code> 
2. 生成字节码。字节码就是介于 AST 和机器码之间的一种代码；字节码需要通过解释器将其转换为机器码后才能执行。

![code](@assets/basic/js/14.png)

机器码所占用的空间远远超过了字节码，所以<code>使用字节码可以减少系统的内存使用</code>。

3. 执行代码。在执行字节码的过程中，如果发现有热点代码（HotSpot），比如一段代码被重复执行多次，这种就称为<code>热点代码</code>。把热点的字节码转换为机器码，并把转换后的机器码保存起来，以备下次使用

![v8](@assets/basic/js/15.png)

总结：V8 依据 JavaScript 代码生成 AST 和执行上下文，再基于 AST 生成字节码，然后通过解释器执行字节码，通过编译器来优化编译字节码。


## 考一考
问：如何理解 V8 执行时间越久，执行效率越高

答：因为更多的代码成为热点代码之后，转为了机器码来执行