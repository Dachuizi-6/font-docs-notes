## 冒泡
```js
function bubbleSort(arr) {
  for (let i=0; i<arr.length-1; i++) {
    for (let j=1; j<=arr.length-1-i; j++) {
      if (arr[j] < arr[j-1]) {
        [arr[j], arr[j-1]] = [arr[j-1], arr[j]]
      }
    }
  }

  return arr
}

bubbleSort([1, 3, 5, 2, 8, 5, 1])
```
1. 第一个for循环：将i个数排好序好，移到数组尾部
2. 第二个for循环：len-i 表示 有len-i个数未排序，len-i-1表示要比较len-i-1次，才能找到最大值

优化：O(n) 当数组有序时，冒泡排序时间复杂序为O(n)
```js
function bubbleSort(arr) {
  for (let i=0; i<arr.length-1; i++) {
    let flag = true
    for (let j=1; j<=arr.length-1-i; j++) {
      if (arr[j] < arr[j-1]) {
        flag = false
        [arr[j], arr[j-1]] = [arr[j-1], arr[j]]
      }
    }
    if (flag) break
  }

  return arr
}

bubbleSort([1, 2, 3])
```

## 选择
```js
function selectSort(arr) {
  for (let i=0; i<arr.length; i++) {
    for (let j=1+i; j<arr.length; j++) {
      if (arr[j] < arr[i]) {
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
    }
  }
  return arr
}

arr = [5,4,3,2,1,6]
selectSort(arr)
```
1. 从数组选最小的，和数组头部交换。每次交换，数组头指针向前移一步

## 插入
```js
function insertSort(arr) {
  for (let i=1; i<arr.length; i++) {
    let j = i-1
    let tempVal = arr[i]
    while (j >=0 && tempVal < arr[j]) {
      arr[j+1] = arr[j]
      j--
    }
    arr[j+1] = tempVal
  }
  return arr
}


let arr = [1, 3, 5, 2, 8, 5, 1]
insertSort(arr)
```
1. 头指针指向数组下标i。arr[i]插入下标0到i-1的有序数组中
2. 要用tempVal暂存要插入的值。因为在插入比对的过程中，数据后移，会覆盖


## 快排
```js
function quickSort(arr, head, tail) {
  if (head >= tail) return

  const quickSortDetail = (head, tail) => {
    while (head < tail) {
      while (arr[tail] >= arr[head] && head < tail) { // 1
        tail--
      }
      [arr[tail], arr[head]] = [arr[head], arr[tail]]
      while (arr[head] <= arr[tail] && head < tail) { // 2
        head++
      }
      [arr[tail], arr[head]] = [arr[head], arr[tail]]
    }

    return head
  }
  
  const key = quickSortDetail(head, tail)
  quickSort(arr, head, key-1)
  quickSort(arr, key+1, tail)
  return arr
}

let arr = [1, 3, 5, 2, 8, 5, 1]
// let arr = [6,22, 4,5,7,7888,32]
quickSort(arr, 0, arr.length-1)
```
1. 一次快排：左边不大于基准值；右边不小于基准值。返回一次快排后基准值下标
2. 头指针head，尾指针tail。初始设基准值为头指针的值：temp = arr[head]。 比较，不断交换头尾指针，直到相遇
3. 1，2 至少要有一处 >= , <=, 否则会死循环
4. 这种做法，头尾指针必有一个是基准值。对比头尾指针，也是和基准值对比，达到左边不大于基准值；右边不小于基准值

时间复杂度：nlog(n). log(n)次快排，每次O(n)

## 归并
```js
function arrayMerge(left, right) {
  let result = []
  while (left.length && right.length) {
    if (left[0] < right[0]) {
      result.push(left.shift())
    } else {
      result.push(right.shift())
    }
  }
  if (left.length) {
    result = result.concat(left)
  } else {
    result = result.concat(right)
  }
  return result
}

function mergeSort(arr) {
  if (arr.length <= 1) return arr
  const middleIndex = Math.floor(arr.length/2)

  const left = mergeSort(arr.slice(0, middleIndex))
  const right = mergeSort(arr.slice(middleIndex))

  return arrayMerge(left, right)
}



let arr = [1, 3, 5, 2, 8, 5, 1]
console.log(mergeSort(arr))
```
1. 先一分二，直至只有一个元素；再组合，数组合并

## 二叉树遍历
```js
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
  console.log(root.val)
  preOrder(root.left)
  preOrder(root.right)
}

function middleOrder(root) {
  if (!root) return
  middleOrder(root.left)
  console.log(root.val)
  middleOrder(root.right)
}

function postOrder(root) {
  if (!root) return
  postOrder(root.left)
  postOrder(root.right)
  console.log(root.val)
}

// 测试
preOrder(root) // A B D  E C F
middleOrder(root) // D B E A C F
postOrder(root) // D E B F C A
```