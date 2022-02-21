* 数组的浅拷贝方式
1. concat: const copy_arr = arr.concat()
2. slice: const copy_arr = arr.slice()
3. 解析赋值：const copy_arr = [...arr]

* 对象的浅拷贝
1. Object.assign(): const copy_obj = Object.assign({}, obj)
2. 解析赋值：const copy_obj = {...obj}

* 深拷贝
1. JSON.parse(JSON.stringify(xxx))
2. 自已实现一个
3. 用第三方库

::: warning
JSON.parse(JSON.stringify(xxx)) 实现深拷贝，会有什么问题吗？
:::

答：
原理：用<code>JSON.stringify</code>把JS对象转成<code>JSON字符串</code>，再用<code>JSON.parse</code>把JSON字符串转成 JS对象
<strong>存在问题</strong>
1. 会忽略 <code>undefined</code>, <code>Symbol</code>。会忽略
2. 不能序列化函数。会忽略
3. 处理循环引用的对象会出错
4. 不能正确处理new Date()。把对象变成了string
5. 不能处理正则. 正则会变成空对象 {}

```js
// 1 & 2
obj = {
  name : 'dayday',
  h1 : undefined,
  h2 : Symbol('dayday'),
  h3 : function () {},
}
JSON.parse(JSON.stringify(obj))
// {name: "dayday"}

// 3
// Uncaught TypeError: Converting circular structure to JSON

// 4
JSON.parse(JSON.stringify(new Date()))
// "2021-06-15T03:11:55.656Z"
JSON.parse(JSON.stringify(new Date()))
// "2021-06-15T03:11:56.231Z"

// 5
let demo = {
    name: "daydaylee",
    a: /'123'/
}
JSON.parse(JSON.stringify(demo))
// {
//   a: {}
//   name: "daydaylee"
// }
```

::: warning
请实现浅拷贝
:::

答：
```js
function isObject(obj) {
  return typeof obj === 'object' && obj !== null
}
function shallowCopy(value) {
  if (!isObject(value)) return value
  const newValue = value instanceof Array ? [] : {}
  for (let key in value) {
    newValue[key] = value[key]
  }
  return newValue 
}

// 测试
newValue = shallowCopy(34)
// 34
newValue = shallowCopy([1,2,4])
// [1, 2, 4]
```

::: warning
请实现深拷贝
:::

答：
```js
function isObject(obj) {
  return typeof obj === 'object' && obj !== null
}
function deepCopy(value) {
  if (!isObject(value)) return value
  const newValue = value instanceof Array ? [] : {}
  for (let key in value) {
    newValue[key] = isObject(value[key]) ? deepCopy(value[key]) : value[key]
  }
  return newValue
}
// 测试
newValue = deepCopy(34)  // 34
newValue = deepCopy([1,2,4])  // [1, 2, 4]
obj = { a: 1 }
obj2 = { b: 2, c: [1,2,4], d: obj }
newValue = deepCopy(obj2)
obj2.d.a = 22
obj // { a: 22 }
newValue // {b: 2, c: Array(3), d: {a: 1}}  注意这里已经实现深拷贝了，d对应的value没有变化
```


存在问题：
* 循环引用，导致爆栈

![max_stack](@assets/basic/code_write/2.png)

::: warning
请实现深拷贝。如何解决循环引用导致的爆栈问题？
:::
原理：设置一个数组或者哈希表存储已拷贝过的对象，当检测到当前对象已存在于哈希表中时，取出该值并返回即可

答：
```js
function isObject(obj) {
  return typeof obj === 'object' && obj !== null
}
function deepCopy2(value, hash = new WeakMap()) {
  // 终止条件
  if (!isObject(value)) return value
  if (hash.has(value)) return hash.get(value) // 哈希表找得到
  const newValue = value instanceof Array ? [] : {}
  hash.set(value, newValue) // 找不到，需添加到哈希
  for (let key in value) {
    newValue[key] = isObject(value[key]) ? deepCopy2(value[key], hash) : value[key]
  }
  return newValue
}
// 测试
var a = {
  name: "muyiy",
  book: {
      title: "You Don't Know JS",
      price: "45"
  },
  a1: undefined,
  a2: null,
  a3: 123
}
a.circleRef = a;
var b = cloneDeep3(a);
console.log(b);
// {
// 	name: "muyiy",
// 	a1: undefined,
//	a2: null,
// 	a3: 123,
// 	book: {title: "You Don't Know JS", price: "45"},
// 	circleRef: {name: "muyiy", book: {…}, a1: undefined, a2: null, a3: 123, …}
// }
```
使用WeakMap的好处？为什么不使用Map？

答：WeakMap是弱引用，Map是强引用。比如说:
```js
const weakMap = new WeakMap()
let obj = { name: zcl }
weakMap.set(obj, obj)
obj = null
```
weakMap 和 obj 是弱引用关系。当下一次垃圾回收机制执行时，obj对象占用的内存就会被释放掉。



::: warning
能否不用递归，用循环实现？
:::
面试说：当我提出用循环来实现时，基本上90%的前端都是写不出来的代码的，这其实让我很震惊。

我：不服，让我来试试

答：

不会。

参考：
[深拷贝的终极探索（99%的人都不知道）](https://segmentfault.com/a/1190000016672263)
[面试题之如何实现一个深拷贝](https://muyiy.cn/blog/4/4.3.html#%E7%AC%AC%E4%BA%94%E6%AD%A5%EF%BC%9A%E7%A0%B4%E8%A7%A3%E9%80%92%E5%BD%92%E7%88%86%E6%A0%88)