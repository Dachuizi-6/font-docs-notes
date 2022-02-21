/*
示例: 输入: n = 4, k = 2
输出:
[
[2,4],
[3,4],
[2,3],
[1,2],
[1,3],
[1,4],
]

*/

const combine = function(n, k) {
  const res = []
  const current = []
  const dfs = (nth) => {
    if (current.length === k) {
      res.push(current.slice())
      return
    }
    for (let index = nth+1; index <= n; index++) {
      current.push(index) // 当前元素进行取值，填坑
      dfs(index) // 基于当前选择，继续往下递归，考察下一个数
      current.pop()
    }
  }
  dfs(0) // 第一个坑位赋值
  return res
}

console.log(JSON.stringify(combine(4, 2)))