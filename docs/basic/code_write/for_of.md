## for in 和 for of 的区别
1. for ... in 循环返回的值都是数据结构的 键值名
2. for ... of 循环用来获取一对键值对中的值

ES6规定，一个数据结构只要部署了 <code>Symbol.iterator</code> 属性, 就被视为具有 iterator 接口, 就可以使用 for of循环。

## 哪些数据结构部署了 Symbol.iteratoer属性？
* 数组
* Map
* Set
* arguments类数组
* NodeList对象。即获取的dom列表集合
```js
const container = document.getElementsByTagName('li')
for (let node of container) {
    console.log(node)
}
```


:::warning
输出打印题
:::
```js
// 题一
const arr = ['a', 'b']
arr.name = 'qiqingfu'
for (let i in arr) {
  console.log(i)
}

// 题二
const obj = { a: 1, b: 2, c: 3 }
for (let i of obj) {
  console.log(i)
}

// 答
// 题一
0
1
name

// 题二
会爆错。因为对象没有 Symbol.iterator 属性
```

:::warning
自定义对象属性值迭代器，使之能使用for of循环遍历对象属性的值
:::

答:
```js
function iterator(obj) {
  Object.defineProperty(obj, Symbol.iterator, {
    value: function() {
      let index = 0
      // console.log('obj', obj, this)
      const keyList = Object.keys(obj)
      return {
        next: function() {
          return {
            done:  index >= keyList.length,
            value: obj[keyList[index++]]
          }
        }
      }
    }
  })
}
// 测试
var obj = {
  name: 'AAA',
  age: 23,
  address: '广州'
}
iterator(obj)
for (const val of obj) {
  console.log(`属性值为：${val}`);
}
// 属性值为：AAA
// 属性值为：23
// 属性值为：广州
```

iterator(遍历器) 的遍历过程
1. 创建一个指针对象，指向当前数据结构的起始位置
2. 第一次调用指针对象的<code>next</code>方法，可以将指针指向数据结构的第一个成员。
3. 第二次调用指针对象的next方法，指针就指向数据结构的第二个成员。
4. 不断调用指针对象的next方法，直到它指向数据结构的结束位置

每一次调用next方法, 都会返回一个包含<code>value</code>和<code>done</code>两个属性的对象。value属性是当前成员的值，done属性是一个布尔值，表示遍历是否结束
```js
let arr = ['a', 'b', 'c'];
let iter = arr[Symbol.iterator]();

iter.next() // { value: 'a', done: false }
iter.next() // { value: 'b', done: false }
iter.next() // { value: 'c', done: false }
iter.next() // { value: undefined, done: true }
```
执行对象的Symbol.iterator函数会返回一个对象，对象有next方法属性，执行next函数，会返回 { value: xx, done: xx }

知识点：需要熟练掌握Object.defineProperty, 及深入理解iterator。:lollipop:

参考：
[百度前端面试题：for in 和 for of的区别详解以及为for in的输出顺序](https://juejin.cn/post/6854573212039151629)