## 基础
### 类型
基础类型：boolean, number, string, array, object, tuple(元组), enum, any, void(表示没有任何类型), null, undefined, never(永不存在的值的类型)

还有：interface, class, 函数类型，symbol, enum, namespace, 泛型

```ts
// 元组类型允许表示一个已知元素数量和类型的数组，各元素的类型不必相同
let x: [string, number];
x = ['hello', 10] // ok
x = [10, 'hello'] // error

// 数组
let arr: number[]
let arr: Array<number>

// 对象。注意也可以用Record
let obj: { x: number, y: number } = { x: 1, y: 2 }
let obj: Record<number, number> = { x: 1, y: 2 }

const s1: symbol = Symbol()
```
### never应用场景
1. 总会抛出错误的函数(error)
2. 从来不返回值的函数(while)
```ts
const error: () => never = () => {
  throw new Error('error')
}

const endless: () => never = () => {
  while(true) {}
}
```

### enum原理
enum有三种，分别是数字枚举，字符串枚举和异构枚举
:::details
```js
// 1. 数字枚举
enum Role {
  Reporter = 1,
  Developer,
  Maintainer,
  Owner,
  Guest
}
console.log(Role.Reporter) // 1
console.log(Role[1]) //  "Reporter" 

// 2. 字符串枚举
enum Message {
  Success = '恭喜你，成功了',
  Fail = '抱歉，失败了'
}
console.log(Message)
// {
//   "Success": "恭喜你，成功了",
//   "Fail": "抱歉，失败了"
// } 

// 3. 异构枚举
enum Answer {
  N,
  Y = 'yes',
}
console.log(Answer)
// {
//  "0": "N",
//  "N": 0,
//  "Y": "yes"
// } 
```
:::
原理：实际上枚举类型会被编译成一个<code>双向映射对象</code>
```js
enum Direction {
    Up,
    Down,
    Left,
    Right
}
// 编译后
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Down"] = 1] = "Down";
    Direction[Direction["Left"] = 2] = "Left";
    Direction[Direction["Right"] = 3] = "Right";
})(Direction || (Direction = {}));
```

### interface
接口可以包含一个或多个声明
1. 声明对象。有可选属性，只读属性，可索引类型
2. 声明函数
3. 接口之间可以继承(extends)
3. 类可以实现(implements)接口。接口约束类的结构。不同类之间可以有一些共有的特性，这时候就可以把特性提取成接口
:::details
```js
// 1
interface List {
  readonly id: number, // 只读类型
  name: string,
  age?: number, // 可选类型
  [index: number]: string // 可索引类型
}
// 2
interface SearchFunc {
  (source: string, subString: string): boolean;
}
let mySearch: SearchFunc = (source: string, subString: string) => {
  return true
}
// 3
interface Shape {
  color: string;
}
interface Square extends Shape {
  sideLength: number;
}
let square = {} as Square
square.color = "blue"
square.sideLength = 10
// 4
interface Alarm {
  alert(): void;
}
class Door {
}
class SecurityDoor extends Door implements Alarm {
  alert() {
    console.log('SecurityDoor alert');
  }
}
```
:::

### 函数
1. 声明函数时，需要声明参数和返回值类型
2. 可选参数
3. 函数重载：精确的定义放在前面
```js
// rest是一个由number类型组成的数组
function add(x: number, ...rest: number[]) {
  return x + rest.reduce((pre, cur) => pre + cur)
}
console.log(add(1, 2, 3, 4, 5)) // 15

function add8(...rest: number[]): number;
function add8(...rest: string[]): string;
function add8(...rest: any[]) {
  let first = rest[0]
  if (typeof first === 'number') {
    return rest.reduce((pre, cur) => pre + cur)
  }
  if (typeof first === 'string') {
    return rest.join()
  }
}
console.log(add8(1, 2))
console.log(add8('a', 'b', 'c'))
```

### 类
相比Js，Ts的类添加了修饰符(public, protect, private)和抽象类(abstract)
* 默认public
* protected: 只能在类内部及子类中访问
* private: 只能在类内部访问  
* 不能实例化抽象类；继承抽象类，也需要实现继承的抽象方法
:::details
```js
// 修饰符
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name
  }
  run() {
    this.pri()
    console.log('run...')
    this.pri() // private只在类内部使用
  }
  private pri() {
    console.log('pri')
  }
  protected pro() {}
  static food: string = 'sunning'
}

console.log(Animal.prototype)

let animal = new Animal('dog')
console.log(animal)
// animal.pri() // error
// animal.pro() // error
console.log(Animal.food)
console.log(Animal.prototype.run())

// 抽象类
abstract class Animal {
  eat() {
    console.log('eat...')
  }
  abstract sleep(): void
}

// 抽象类 不能 实例化
// const animal2 = new Animal2()

class Dog extends Animal {
  public name: string
  constructor(name: string) {
    super()
    this.name = name
  }
  // 继承抽象类，也需要实现继承的抽象方法
  sleep() {
    console.log('dog2 sleep..')
  }
}
class Cat extends Animal {
  sleep() {
      console.log('Cat sleep')
  }
}
const dog2 = new Dog('朝宇')
const cat = new Cat()

const animals: Animal2[] = [dog2, cat]
animals.forEach(item => item.sleep()) // 多态
```
:::
:::tip
<strong>多态</strong>：Cat类和 Dog类 都继承自 抽象Animal，但是分别实现了自己的 sleep 方法。我们无需了解它是 Cat 还是 Dog，就可以直接调用实例 eat 方法，程序会自动判断出来应该如何执行 sleep
:::

### 泛型
定义函数，接口或者类的时候，不预先定义好具体的类型，而在使用的时候在指定类型的一种特性。泛型的应用主要有三种
* 泛型接口
* 泛型函数
* 泛型类

```js
// 泛型函数
function log<T>(value: T): T {
  console.log(value)
  return value
}
log('zcl')
// 泛型接口
interface Log<T> {
  (arg: T): T;
}
const myLog: Log<number> = log
myLog(123)
// 泛型类
class Log2<T> {
  run(value: T) {
    console.log(value)
    return value
  }
}
const log1 = new Log2<number>()
log1.run(123)
```
注意：类的静态属性不能使用这个泛型类型。

泛型指使用时，可以传入任意类型。可以对泛型做约型，即<code>泛型约束</code>

```js
function logAdvance<T extends Length> (value: T): T {
  console.log(value, value.length)
  return value
}

logAdvance([1])
logAdvance('123')
logAdvance({ length: 3 })
```

### 高级类型
高级类型
1. 交叉类型：&
2. 联合类型: |
3. 类型别名： type. 可以用type xxx = number | string 定义一个新的类型xxx
4. 类型索引： keyof。可以获取一个接口中 key 的联合类型
5. 映射类型：in. 遍历联合类型。P in keyof T。相当于P遍历联合类型T
```js
1. keyof T：通过类型索引 keyof 的得到联合类型 'a' | 'b'
2. P in keyof T：等同于 p in 'a' | 'b'，相当于执行了一次 forEach 的逻辑，遍历 'a' | 'b'
```
6. 条件类型：extends
:::details
```js
interface DogInterface {
  run(): void
}
interface CatInterface {
  jump(): void
}
// 1. 交叉类型声明
const pet: DogInterface & CatInterface = {
  run() {},
  jump() {}
}
// 2. 联合类型声明
const a1: number | string = 1
// 3. 类型别名
type xxx = number | string
// 4. 类型索引
interface Person {
  name: string;
  gender: string;
  age: number;
}
let p: keyof Person  // 'name' | 'gender' | 'age'
// 5. 映射类型
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};
interface Obj {
  a: string
  b: string
}
type ReadOnlyObj = Readonly<Obj>
// 6. 条件类型
// 如果 T 是 U 的子集，就是类型 X，否则为类型 Y
T extends U ? X : Y
```
:::

### namespace与模块
背景：ts中，如果文件使用了<code>export/import</code>，那么这个文件就是一个模块；如果不使用<code>export/import</code>，那么文件内容是全局的。

问题：在不同文件声明同一个变量名，会提示”无法重复声明“

解决：
1. 使用export/import, 用法和es6 module一样
2. 使用namespace

###  namespace的原理
namespace是为了解决变量重复声明的问题。namespace实际上是一个对象，将相关的变量赋给对象的属性
```js
namespace Letter {
  export let a = 1;
  export let b = 2;
  export let c = 3;
  // ...
  export let z = 26;
}
// 编译后
var Letter;
(function (Letter) {
    Letter.a = 1;
    Letter.b = 2;
    Letter.c = 3;
    // ...
    Letter.z = 26;
})(Letter || (Letter = {}));
```

## 面试
问1：ts和js的区别？

答：
1. ts是js的超集。js有的ts都有，ts还有interface, enum, 类型断言，namespace等特性
2. js是动态语言，运行时才确定变量类型，因此可能会导致未致错误；ts是静态语言，代码编译阶段就能查出类型错误
3. 拓展名不同。.ts文件可以编译成.js文件（tsc或者ts-loader或者babel)


问2：说说接口和类的关系？

答：
1. 接口可以继承接口(extends)
2. 接口可以继承类
3. 类可以实现一个或多个接口。接口来约束类的结构（implements）

问3：为什么 TypeScript 会支持接口继承类呢？

答：定义类时，不仅创建了类；还创建了类的类型；因此接口继承类 和 接口继承接口，没本质区别
```js
// 同时也声明了Point类型
class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

interface Point3d extends Point {
    z: number;
}

let point3d: Point3d = {x: 1, y: 2, z: 3};
```


问4：type interface 区别？ 
 1. interface有三个作用：声明对象，声明函数，被类实现(implements)，从而来约束类。而interface不止这三个作用，更强大。type能支持声明 联合类型，索引类型，映射类型等等高级类型。而interface不能
 2. interface声明可以合并
 3. type声明函数更简洁
 4. 实际开发中，优先使用interface；type更适用于创建类型别名，如：联合类型，条件类型等
 
问5：any, unknow, never, void区别？
1. any: 任意类型
2. unknown: 未知类型。和any差不多，但类型检查比any严格。主要有两点：
* unknown类型只赋值给any或者unknown类型
```js
const uncertain: unknown = 'Hello'!;
const notSure: any = uncertain; // ok
const nnn: string = uncertain // Type 'unknown' is not assignable to type 'string'.
```
* 不能执行unknown类型属性和方法
```js
let uk: unknown = 'abc'
uk.toString() // error, 用any是可以的
```
3. never: 永不存在的值的类型, 强调永不能执行到终点的函数返回值（<code>returning never must not have a reachable end point</code>）。常用于抛出异常的函数和死循环的函数。
4. void: 表示没有任何类型。常用于函数没有返回值

问6：TS有哪些内置的类型？

答：
1. Readonly：把对象属性都变成只读
2. Partial：把对象属性都变成可选
3. Pick: 以将某个类型中的子属性挑出来
4. ReturnType: 获取方法的返回值类型。注意：参数只能是函数类型

```js
interface Person {
    name: string;
    age: number;
}
type Partial<T> = {
  [P in keyof T]?: T[P]
}
// 使用：type NewPerson = Partial<Person>
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}
// 使用：type NewPerson = Readonly<Person>
type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}
// 使用：type NewPerson = Pick<Person, 'name'>; // { name: string; }
type ReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : any 
// 使用：type fnType = gReturnType<() => number>
```

问7: 实现returnType
### infer
infer表示类型推断。在条件类型(extends)中使用，可以用来推断变量类型，参数类型，返回值类型
```js
type MyReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : any 

function TestFn() {
  return '123123';
}
type fnType = MyReturnType<typeof TestFn>
```

问8：手写题
:::warning
我在项目中遇到这样一种场景，需要获取一个类型中所有 value 为指定类型的 key。例如，已知某个 React 组件的 props 类型，我需要 “知道”（编程意义上）哪些参数是 function 类型。
:::
```js
interface SomeProps {
    a: string
    b: number
    c: (e: MouseEvent) => void
    d: (e: TouchEvent) => void
}
// 如何得到 'c' | 'd' ？ 
```
答：
```js
{
  a: never
  b: never
  c: 'c'
  d: 'd'
}
never | never | 'c' | 'd'

type GetValueByKey<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}
type ResultObj = GetValueByKey<SomeProps, (e: any) => void>
type ResultType = ResultObj[keyof ResultObj]
// 或者
type GetValueByKey<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]
type ResultType = GetValueByKey<SomeProps, (e: any) => void>
```

问9：.ts和.d.ts的区别

答：
1. 两者都表示用ts编写的。.ts编译成.js，用来运行使用的
2. .d.ts给IDE做智能提示用的

参考：
[TypeScript 中文手册](https://typescript.bootcss.com/)

Function, Object不建议再使用，编译会出错。[ban-type](https://github.com/typescript-eslint/typescript-eslint/blob/v4.11.1/packages/eslint-plugin/docs/rules/ban-types.md)

[Ts-in-action仓库](https://github.com/0zcl-free/TS-in-action)