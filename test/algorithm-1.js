/*
示例：   
输入: [1,2,3]
输出: [
[1,2,3],
[1,3,2],
[2,1,3],
[2,3,1],
[3,1,2],
[3,2,1]
]

在以上的“填坑”过程中，我们重复地做了以下事情：  
检查手里剩下的数字有哪些
选取其中一个填进当前的坑里    

坑位的个数是已知的，我们可以通过记录当前坑位的索引来判断是否已经走到了边界：
比如说示例中有 n 个坑，假如我们把第 1 个坑的索引记为 0 ，那么索引为 n-1 的坑就是递归式的执行终点，索引为 n  的坑（压根不存在）就是递归边界
*/

const permute = function(nums) {
  const len = nums.length
  const current = []
  const visited = {}
  const res = []
  const dfs = nth => {
    if (nth === len) { // 递归边界：坑位已经填满，将对应的排列记录下来
      res.push(current.slice())
      return
    }
    for (let index = 0; index < len; index++) {
      const visitNum = nums[index]
      if (!visited[visitNum]) {
        visited[visitNum] = 1
        current.push(visitNum) // 将元素放进坑
        dfs(nth + 1) // 基于该选择，继续往下递归，考察下一个数
        current.pop() // 让出当前坑位
        visited[nums[index]] = 0
      }
    }
  }
  dfs(0) // 对第一个坑位进行赋值
  return res
}

console.log(JSON.stringify(permute([1,2,3])))