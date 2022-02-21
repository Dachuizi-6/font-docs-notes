
## Array.prototype.reduce
<code>arr.reduce(callback(accumulator, currentValue[, index[, array]])[, initialValue])</code>

* accumulator: 累计器。上一次执行回调返回的累计值。如果是第一次执行的话将会采用initialValue，initialValue不存在的话将会采用数组的第一个元素
* currentValue：当前值
* index：索引
* array: 数组
计算数组各个元素相加的和
```js
const numbers = [1, 2, 3, 4]
const sum = numbers.reduce((accumulator, currentVal) => accumulator + currentVal)
// 初始值为 10
const sum2 = numbers.reduce((accumulator, currentVal) => accumulator + currentVal, 10)
console.log(sum) // 10
console.log(sum2) // 20
```

## 手写Array.prototype.reduce
:::warning
实现Array.prototype.reduce
:::
答：
```js
Array.prototype.myReduce = function(callback, initVal) {
  let accumulator = initVal ? initVal : this[0]
  for (let index=initVal ? 0 : 1, len=this.length; index < len; index++) {
    accumulator = callback(accumulator, this[index])
  }
  return accumulator
}
// 测试
const sum2 = numbers.myReduce((accumulator, currentVal) => accumulator + currentVal, 10)
console.log(sum) // 10
console.log(sum2) // 20
```
思路：
* reduce接口返回<code>accumulator</code>累加值
* 如果<code>initVal</code>存在，累加值初始为initVal；如果不存在，累加值初始为数组的第一个元素
* 循环数组，调用reduce传入的函数callback, callback返回值为新的累加值

## 手写Array.prototype.flat
:::warning
实现数组扁平化：Array.prototype.flat
:::
答：Array.prototype.flat([depth]), depth默认为1
```js
Array.prototype.flatten = function(depth = 1) {
  let res = []
  // 终止条件
  if (depth <= 0) {
    res = this.slice() // 浅拷贝
  } else {
    res = this.reduce((accumulator, currentVal) => {
      return accumulator.concat(currentVal instanceof Array ? currentVal.flatten.call(currentVal, depth - 1) : currentVal)
    }, [])
  }
  return res
}
// 测试
var arr = ['zcl', [1, 2, 2], [3, 4, 5, 5], [6, 7, 8, 9, [11, 12, [12, 13, [14] ] ] ], 10]
```
![reduce](@assets/basic/code_write/15.png)

思路：需要使用递归
* 如果depth<=0, 则浅拷贝后返回
* 若depth>0，使用reduce进行遍历，initVal为[]，即把遍平后的数据放入initVal。
  * 当前值为数组，表明还未拉平，需使用递归
  * 当前值不为数组，表明已拉平，把当前值加入累加值

手写flat，基本理解，感觉让我再写一次，可能写不出来了！
:::tip
ES6的 <code>Array.prototype.flat()</code>有兼容性问题， 不建议使用。可以使用自己实现的flat
:::

参考：
[Array.prototype.reduce](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce)