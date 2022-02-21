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

function preOrder(root) {
  if (!root) return
  console.log('当前遍历的结点值是：', root.val)
  preOrder(root.left)
  preOrder(root.right)
}
console.log(preOrder(root))