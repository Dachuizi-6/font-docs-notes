:::warning
实现数组去重
:::

答：
1. 使用ES6，工作中常用
```js
const arr = [1, 2, 3, 1, 3, 4, 5, 4]
console.log([...new Set(arr)]) // [1, 2, 3, 4, 5]
```
2. 使用For循环，常见思路
```js
function unique(arr) {
  const res = []
  for (let index=0, len=arr.length; index<len; index++) {
    if (res.indexOf(arr[index]) === -1) {
      res.push(arr[index])
    }
  }
  return res
}
// 测试
const arr = [1, 2, 3, 1, 3, 4, 5, 4]
unique(arr) // [1, 2, 3, 4, 5]
```
3. 上一节复习了[reduce](./flat.md), 下面用reduce来实现
```js
function unique(arr) {
  return arr.reduce((accumulator, currentVal) => {
    if (accumulator.indexOf(currentVal) === -1) accumulator.push(currentVal)
    return accumulator
  }, [])
}
// 测试
const arr = [1, 2, 3, 1, 3, 4, 5, 4]
unique(arr) // [1, 2, 3, 4, 5]
```