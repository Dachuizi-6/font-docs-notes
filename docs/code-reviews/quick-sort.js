
// 

const arr = [6,22, 4,5,7,7888,32]
/*
[6,22, 4,5,7,7888,32] left 0 right 6
[5,22, 4,5,7,7888,32] left 0 right 3
[5,22, 4,22,7,7888,32] left 1 right 3
[5,4, 4,22,7,7888,32] left 1 right 2

left = right =2

*/
// 左指针向左 小于基准值；右指针向右，大于基准值
function quickSortDetail(arr, left, right) {
  let value = arr[left] // 基准值
  while (left < right) {
    // 小于基准值
    while (arr[right] > value && left < right) {
      right--
    }
    arr[left] = arr[right] // 交换
    while (arr[left] < value && left < right) {
      left++
    }
    arr[right] = arr[left]
  }
  arr[left] = value
  return left
}

function quickSort(arr, left, right) {
  if (left > right) { // 递归终止条件
    return
  }
  // 一次快排
  const key = quickSortDetail(arr, left, right)
  quickSort(arr, left, key-1) // 左边
  quickSort(arr, key+1, right) // 右边
}

quickSort(arr, 0, arr.length-1)
console.log('arr', arr)
