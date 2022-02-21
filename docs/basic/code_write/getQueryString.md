:::warning
给定一段URL和参数的名称，获取此参数的值
:::

答：比较常见的公共函数了，[utilsLibrary函数库](https://0zcl.github.io/utils-library/modules/url_parsequerystring.html)封装了<code>parseQueryString</code>，把链接参数转成对象

```js
function getQueryString(url, queryKey) {
  const index = url.indexOf('?')
  if (index === -1) return '' // 找不到，链接无参数
  const queryStr = url.substring(index+1)
  const queryArr = queryStr.split('&')
  for (let idx = 0, len = queryArr.length; idx < len; idx++) {
    const temp = queryArr[idx].split('=')
    if (temp[0] === queryKey) return temp[1]
  }
  return '' // 找不到
}

// 测试
var url = 'https://www.baidu.com/s?id=123&name=why&phone=13876769797'
getQueryString(url, 'name') // "why"
getQueryString(url, 'zcl') // ''
getQueryString('https://www.baidu.com/s', 'name') // ''
```

取出 <code>id=123&name=why&phone=13876769797</code>, 再通过 & 切割 成数组