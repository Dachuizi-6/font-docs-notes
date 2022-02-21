/*
题目描述：给定一个二叉树，返回它的前序（先序）遍历序列。
示例:
输入: [1,null,2,3]
1   
 \   
  2   
 /  
3 
输出: [1,2,3]
进阶: 递归算法很简单，你可以通过迭代算法完成吗？

思路：
当一道本可以用递归做出来的题，突然不许你用递归了，此时我们本能的反应，就应该是往栈上想
题目中要求你输出的是一个遍历序列，而不是一个二叉树。因此大家最后需要塞入结果数组是结点的值
做这道题的一个根本思路，就是通过合理地安排入栈和出栈的时机、使栈的出栈序列符合二叉树的前序遍历规则
前序遍历的规则是，先遍历根结点、然后遍历左孩子、最后遍历右孩子——这正是我们所期望的出栈序列。按道理，入栈序列和出栈序列相反，我们似乎应该按照 右->左->根 这样的顺序将结点入栈

出入栈顺序：
1. 将根结点入栈 
2. 取出栈顶结点，将结点值 push 进结果数组 
3. 若栈顶结点有右孩子，则将右孩子入栈
4. 若栈顶结点有左孩子，则将左孩子入栈
重复 2、3、4 步骤，直至栈空，我们就能得到一个先序遍历序列
*/

const root = {
  val: "A",
  left: {
    val: "B",
    left: {
      val: "D"
    },
    right: {
      val: "E"
    }
  },
  right: {
    val: "C",
    right: {
      val: "F"
    }
  }
}

// 前序遍历。迭代解法。 根 -> 左 -> 右  变成  右 -> 左 -> 根
const preOrder = root => {
  const res = []
  const stack = []
  if (!root) return res // 空树，返回空列表
  stack.push(root)
  while(stack.length) {
    const currentVal = stack.pop()
    res.push(currentVal.val) // 栈顶结点 的值 放到结果数组
    if (currentVal.right) stack.push(currentVal.right) // 若栈顶结点有右孩子，则将右孩子入栈
    if (currentVal.left) stack.push(currentVal.left)
  }
  return res
}

// console.log(JSON.stringify(preOrder(root)))

// 后序遍历。迭代解法。 左 -> 右 -> 根.  变成 根 -> 右 -> 左
const postorderTraversal = root => {
  // 定义结果数组
  const res = []  
  // 处理边界条件
  if(!root) return res
  // 初始化栈结构
  const stack = [] 
  // 首先将根结点入栈
  stack.push(root)  
  // 若栈不为空，则重复出栈、入栈操作
  while(stack.length) {
      // 将栈顶结点记为当前结点
      const cur = stack.pop() 
      // 当前结点就是当前子树的根结点，把这个结点放在结果数组的头部
      res.unshift(cur.val)
      // 若当前子树根结点有左孩子，则将左孩子入栈
      if(cur.left) stack.push(cur.left)
      // 若当前子树根结点有右孩子，则将右孩子入栈
      if(cur.right) stack.push(cur.right)
  }
  // 返回结果数组
  return res
}

// console.log(JSON.stringify(postorderTraversal(root)))


const inorderTraversal = root => {
  // 定义结果数组
  const res = []  
  // 初始化栈结构
  const stack = []   
  // 用一个 cur 结点充当游标
  let cur = root  
  // 当 cur 不为空、或者 stack 不为空时，重复以下逻辑
  while(cur || stack.length) {
      // 这个 while 的作用是把寻找最左叶子结点的过程中，途径的所有结点都记录下来 
      while(cur) {
          // 将途径的结点入栈
          stack.push(cur)  
          // 继续搜索当前结点的左孩子
          cur = cur.left  
      }
      // 取出栈顶元素
      cur = stack.pop()  
      // 将栈顶元素入栈
      res.push(cur.val)  
      // 尝试读取 cur 结点的右孩子
      cur = cur.right
  }
  // 返回结果数组
  return res
}
console.log(JSON.stringify(inorderTraversal(root)))

