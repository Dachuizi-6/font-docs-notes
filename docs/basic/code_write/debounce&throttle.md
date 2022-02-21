* 防抖：点击之后，必须隔一段，再点击才会生效。时间无论持续触发了多少次事件，都只执行最后一次
* 节流：持续触发事件，隔一段时间执行一次

防抖和节流会返回 <code>防抖函数</code> 和 <code>节流函数</code>

## debounce 防抖
:::warning
实现一个防抖
:::
```js
function debounce(func, wait, immediate) {
  let timer = null
  // 防抖函数. 注意：这里用箭头函数的话，箭头函数没有自己的arguments
  return function() {
    const args = [...arguments]
    // 持续触发时，不执行。就算clearTimeout，timer依旧会存在!
    if (timer) clearTimeout(timer)
    // 立即执行
    if (immediate && !timer) {
      func.apply(this, args)
    }

    timer = setTimeout(() => {
      return func.apply(this, args)
    }, wait)
  }
}

// 测试
var debounceFn = debounce((...args) => console.log('防抖函数', args), 1000, true)
document.addEventListener('scroll', debounceFn)
```
注意：
1. debounce返回的是防抖函数。
2. 防抖函数的this指向(推调用防抖函数this指向谁)，传参，返回值
3. immediate, 立即执行防抖函数
4. cancel, 取消防抖, 再去触发，又可以立刻执行
```js
function debounce(func, wait, immediate) {
  let timer = null
  // 防抖函数. 注意：这里用箭头函数的话，箭头函数没有自己的arguments
  const debounced = function() {
    const args = [...arguments]
    // 持续触发时，不执行。就算clearTimeout，timer依旧会存在!
    if (timer) clearTimeout(timer)
    // 第一闪，立即执行
    if (immediate && !timer) {
      return func.apply(this, args)
    }

    timer = setTimeout(() => {
      return func.apply(this, args)
    }, wait)
  }
  // 执行cancel后，再触发，第一次会立即执行
  debounced.cancel = function() {
    clearTimeout(timer)
    timer = null
  }
  return debounced
}
```

## throttle 节流
:::warning
实现一个节流
:::
### 方法一：使用时间差
```js
function throttle(func, wait) {
  let previous = 0
  return function() {
    const args = [...arguments]
    let now = new Date().getTime()
    // 当鼠标移入的时候，事件立刻执行
    if (now - previous > wait) {
      previous = new Date().getTime()
      return func.apply(this, args)
    }
  }
}

// 测试
var throttleFn = throttle((...args) => console.log('防抖函数', args), 1000)
document.addEventListener('scroll', throttleFn)
```
![throttle_1](@assets/basic/code_write/9.gif)

我们可以看到：当鼠标移入的时候，事件立刻执行，每过 1s 会执行一次，如果在 4.2s 停止触发，以后不会再执行事件

### 方法二：使用定时器
```js
function throttle(func, wait) {
  let timer = null
  return function() {
    if (!timer) {
      const args = [...arguments]
      timer = setTimeout(() => {
        timer = null
        return func.apply(this, args)
      }, wait)
    }
  }
}
```
![throttle_2](@assets/basic/code_write/10.gif)

当鼠标移入的时候，事件不会立刻执行，晃了 3s 后终于执行了一次，此后每 3s 执行一次，当数字显示为 3 的时候，立刻移出鼠标，相当于大约 9.2s 的时候停止触发，但是依然会在第 12s 的时候执行一次事件

<strong>时间戳方法，有头无尾；定时器方法，有尾无头</strong>

## 节流优化(待整理)
在 <code>underscore</code> 中的节流函数, 默认是有头有尾的。即：鼠标移入能立刻执行，停止触发的时候还能再执行一次！

战术放弃!

参考：
[JavaScript专题之跟着 underscore 学节流 ](https://github.com/mqyqingfeng/Blog/issues/26)
[深入浅出节流函数](https://muyiy.cn/blog/7/7.1.html#%E5%BC%95%E8%A8%80)