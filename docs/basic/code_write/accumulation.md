:::warning
add(2) = 2   add(2)(2)(2) = 6     add(3)(3) = 6实现一个类似这样的函数
:::

答：
```js
function add(oldNum) {
  let sum = oldNum
  const fn = (newNum) => {
    sum += newNum
    return fn
  }
  fn.toString = () => {
    return sum
  }
  return fn
}
```
技巧：<code>当打印函数时，实际上会执行函数的toString方法</code>

![toString](@assets/basic/code_write/16.png)
