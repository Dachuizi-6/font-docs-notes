:::warning
实现一个原生的Ajax请求
:::
一个完整的AJAX请求一般包括以下步骤：
1. 创建XMLHttpRequest对象
2. open方法初始化一个请求
3. send发送数据
4. 监听readyState属性变化

[XMLHttpRequest.readyState](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/readyState)
* 0: <code>UNSENT</code>  未调用open
* 1: <code>OPENED</code>  open已经被调用
* 2: <code>HEADERS_RECEIVED</code>  send已经被调用, and headers and status are available.
* 3: <code>LOADING</code> 下载中
* 4: <code>DONE</code>

答: 
Get请求：
```js
var xhr = new XMLHttpRequest()
xhr.open('get', 'https://api.github.com/users/0zcl')
xhr.send()
xhr.onreadystatechange = function() {
  if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
    console.log(xhr.response)
  }
}
```

Post请求
```js
var xhr = new XMLHttpRequest()
xhr.open('post', 'http://gw-mg-test.61info.cn/manager-api/o/paint/material/create/paintMaterialInfo/list.json')
xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded')
xhr.setRequestHeader('Authorization', 'eyJhbGciOiJIUzI1NiJ9.eyJkYXRhIjoiWGcrY0NySlZ0eEg5N0FqQzVJUEV2bVhySFQ2YTY2T0cxVk5uTUdNK3R1Y2pVVU9nSTExQVRPaFZLU1N3VjhIb1VpRUh5WUp4SkRZNnBvendVRjIvYkNGQ0ZiRmhIM1JOR0VjR1RiOFl1SGN3SnBLLzBFRHBXRmVnMU1KcStGekVLejltSmR1Y3dPSXRJcmJvK3I2Q1lwNmtQUCtqRVlIQWdTVXl1UTBocVdiMDBRT0RHY0NzMGVHNzZsam1tN1BDb1RVRXRpL3VhcWZxT0Qxb3IxaktHbDhMeTA2YzZheldsM1RIcmRyQTJudz0iLCJleHAiOjE2MzY3NzI4Nzd9.cf4fVe9fIc0-hkGiQHq3zqcWjfKsGJrw7uK-EPuSrc0')
xhr.send('pageSize=6&page=1')
xhr.onreadystatechange = function() {
  if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
    console.log(xhr.response)
  }
}
```

知识点：熟悉[XMLHttpRequest](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest), 顺手发现了一篇知乎文章：[前端面试时总让写原生Ajax真的很有意义吗？](https://www.zhihu.com/question/41986174)