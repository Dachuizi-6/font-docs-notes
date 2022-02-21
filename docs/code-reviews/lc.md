1. 1 & 3 === 1  注意：=== 的优先级比 & 高  [运算符优先级](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)、[318. 最大单词长度乘积](https://leetcode-cn.com/problems/maximum-product-of-word-lengths/)

2.  当n=2^31^ - 1时，计算 n+1 会导致溢出，因此我们可以使用整数除法 Math.floor(n/2)+1, Math.floor(n/2) 分别计算 (n+1)/2，(n-1)/2  [397. 整数替换](https://leetcode-cn.com/problems/integer-replacement/solution/zheng-shu-ti-huan-by-leetcode-solution-swef/)

3. 遍历map  [594. 最长和谐子序列](https://leetcode-cn.com/problems/longest-harmonious-subsequence/)
```js
const map = new Map()
map.set('a', 1)
map.set('b', 2)
map.size // 2
map.forEach((value, key) => {
  console.log(value, key)
})
// 1 'a'
// 2 'b'
map.has('a') // true
map.has('aa') // false
map.get('aa') // undefined
```
4. [859. 亲密字符串](https://leetcode-cn.com/problems/buddy-strings/)
* 对于字符串s，s[index] ='xx' 实际上不会改变s
```js
s = 'zcl'
s.split('') // ['z', 'c', 'l']
['z', 'c', 'l'].join() // 'z,c,l' 默认用,合并
['z', 'c', 'l'].join('') // 'zcl'
```
## ASI
* ASI(automatic semicolon insertion)自动分号插入是一种程序解析技术.  JavaScript 程序的语法分析 (parsing) 阶段起作用

用数组解析交换变量，出现错误。

![ssi](@assets/code-reviews/15.png)

利用自动分号插入，JS会自动为代码行补上缺失的分号；ASI 只在换行符处起作用；如果 JavaScript 解析器发现代码行可能因为缺失分号而导致错误，那么它就会自动补上分号。

实际应用上，本人不习惯也分号。不过也要注意，以中括号<code>[</code>, 小括号<code>(</code>开头的代码行，的前一行要加分号

[备胎的自我修养——趣谈 JavaScript 中的 ASI (Automatic Semicolon Insertion)](https://segmentfault.com/a/1190000002955405)

## Array.prototype.sort
```js
arr = [4, 2, 5, 1, 33];
Array.prototype.sort.call(arr) // [1, 2, 33, 4, 5]
arr.sort((a, b) => a - b) // [1, 2, 4, 5, 33] 从小到大
```
如果没有指明 compareFunction ，那么元素会按照转换为的字符串的诸个字符的Unicode位点进行排序。

比较的数字会先被转换为字符串，所以在Unicode顺序上 "33" 要比 "4" 要靠前。

## 三元运算符
```js
a = [1]
b = [2]
-1 ? a : b // [1] 易出错
-1 > 0 ? a : b

if (-1) {console.log('ab')} // 'ab' 会打印的！
```
注意：条件表达式，不要只用负数。用true、false、0、1
[165. 比较版本号](https://leetcode-cn.com/problems/compare-version-numbers/)

## 退出for循环
* continue: 退出当前循环迭代，开始循环的一次新迭代
* break: 退出for循环
* return: 退出函数
[860. 柠檬水找零](https://leetcode-cn.com/problems/lemonade-change/)

6. String.prototype.repeat()
```js
'z'.repeat(3) // 'zzz'
```

## 滑动窗口
[438. 找到字符串中所有字母异位词](https://leetcode-cn.com/problems/find-all-anagrams-in-a-string/)

## 动态规划
[1218. 最长定差子序列](https://leetcode-cn.com/problems/longest-arithmetic-subsequence-of-given-difference/)

## 单调栈
通常是一维数组，要寻找任一个元素的右边或者左边第一个比自己大或者小的元素的位置，此时我们就要想到可以用单调栈了。

为什么？能想到单调栈？

遍历数组入栈，不符合单调则出栈，那么遍历数组后，仍存在栈中的元素或下标，就是找不到比元素更大或更小的了，才会存在栈中。
不符合单调则出栈，出栈时，知道出栈元素和第一个比出栈元素大或小的元素（就是入栈元素!）

* [739. 每日温度](https://leetcode-cn.com/problems/daily-temperatures/)
* [496. 下一个更大元素 I](https://leetcode-cn.com/problems/next-greater-element-i/)
* [下一个更大元素 II](https://leetcode-cn.com/problems/next-greater-element-ii/)


## 排列&&组合
* [46. 全排列](https://leetcode-cn.com/problems/permutations/)
```js
/*
1. 三个坑位，每个坑位放数组的一个元素，不能重复放
2. dfs(0)：第一个坑放元素. 
3. dfs中，一个元素不能放多次，用一个map key为元素值， value为表示该元素值已经放到坑里了， 不能再放到坑里
4. dfs递归，终止条件：参数===nums.length
*/
```
<img src="@assets/code-reviews/16.png" style="width: 60%" />

* [47. 全排列 II](https://leetcode-cn.com/problems/permutations-ii/)
* [77. 组合](https://leetcode-cn.com/problems/combinations/)

## 贪心
局部最优 --> 全局最优
* [1005. K 次取反后最大化的数组和](https://leetcode-cn.com/problems/maximize-sum-of-array-after-k-negations/)
* [455. 分发饼干](https://leetcode-cn.com/problems/assign-cookies/)
* [121. 买卖股票的最佳时机](https://leetcode-cn.com/problems/lemonade-change/)
* [122. 买卖股票的最佳时机 II](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-ii/)


## 链表
* [206. 反转链表](https://leetcode-cn.com/problems/reverse-linked-list/)