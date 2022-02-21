/*
示例: 输入: nums = [1,2,3]
输出:
[
[3],
[1],
[2],
[1,2,3],
[1,3],
[2,3],
[1,2],
[]
]

思路：穷举出现  -->  大概率会用DFS  -->  树形思维方式  --> 坑位：往往是不会变化的东西
      --> 不变的：可以参与组合的数字；变化的：每个数字在组合中的存在性

递归式：检查手里剩下的数字有哪些，选取其中一个填进当前坑里，或者干脆把这个坑空出来
递归边界：组合里数字个数的最大值。示例：只给了3个数，因此组合里数字最多也只有3个。超过3个则会触碰递归边界

*/
// 方法一
const subsets = function(nums) {
  const res = []
  const current = []
  const len = nums.length
  const dfs = (index) => {
    if (index === len) { // 递归边界:指针越界
      res.push(current.slice())
      return
    }
    current.push(nums[index]) // 选择这个数
    dfs(index + 1) // 基于该选择，继续往下递归，考察下一个数
    current.pop() // 上面的递归结束，撤销该选择
    dfs(index + 1)
  } 
  dfs(0) // 对第一个元素，进行 选 或 不选 的操作
  return res
}

console.log(JSON.stringify(subsets([1,2,3])))