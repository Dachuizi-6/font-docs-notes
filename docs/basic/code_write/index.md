::: warning
如何使 if(a==1&&a==2&&a==3) {console.log('true')}; 正确打印'true'

请写出a
:::

答：
```js
const a = {
  value: 0
  toString() {
    this.value++
    return this.value
  }
}
```


对象转原始类型，会调用内置的[ToPrimitive]函数，对于该函数而言，其逻辑如下：

* 是否已经是原始类型，是则直接返回
* 调用<code>valueOf()</code>，如果转换为原始类型，则返回
* 调用<code>toString()</code>，如果转换为原始类型，则返回
* 也可以重写<code>Symbol.toPrimitive()</code>方法，优先级别最高
* 如果都没有返回原始类型，会报错
```js
var obj = {
  value: 0,
  valueOf() {
    return 1;
  },
  toString() {
    return '2'
  },
  [Symbol.toPrimitive]() {
    return 3
  }
}
console.log(obj + 1); // 输出4
```


::: warning
堆和栈有什么区别？
:::
* 堆：保存对象。空间较小。一种树状结构。
* 栈：保存基本数据类型，及对象的引用。空间较大。先进后出。


```js
var a = {n: 1};
var b = a;
a.x = a = {n: 2};
a.x 	// 这时 a.x 的值是多少
b.x 	// 这时 b.x 的值是多少
```
![stack](@assets/basic/code_write/7.png)
