::: warning
实现一个JSONP
:::

答：
回调形式：
```js
function objectToQuery(data) {
  let str = ''
  for (let key in data) {
    str = str + `&${decodeURIComponent(key)}=${decodeURIComponent(data[key])}`
  }
  return str.substring(1)
}

function JSONP(url, data, callback) {
  const container = document.getElementsByTagName('head')[0]
  const script = document.createElement('script')
  const callBackName = 'callback_' + new Date().getTime()
  script.src = `${url}?${objectToQuery}&callback=${callBackName}`
  window[callBackName] = res => {
    callback && callback(res)
    container.removeChild(script)
    delete window[callBackName]
  }
  container.appendChild(script)
  // 异常处理
  script.onerror = () => {
    console.error('error happen in JSONP')
    container.removeChild(script)
    delete window[callBackName]
  }
}

// 测试
JSONP('https://www.runoob.com/try/ajax/jsonp.php', { name: 'zcl' }, (data) => {
  console.log(data)
})
```

Promise形式
```js
function objectToQuery(data) {
  let str = ''
  for (let key in data) {
    str = str + `&${decodeURIComponent(key)}=${decodeURIComponent(data[key])}`
  }
  return str.substring(1)
}

function JSONP(url, data) {
  const container = document.getElementsByTagName('head')[0]
  const script = document.createElement('script')
  const callBackName = 'callback_' + new Date().getTime()
  script.src = `${url}?${objectToQuery}&callback=${callBackName}`

  container.appendChild(script)
  return new Promise((resolve, reject) => {
    window[callBackName] = res => {
      container.removeChild(script)
      delete window[callBackName]
      resolve(res)
    }
    // 异常处理
    script.onerror = () => {
      console.error('error happen in JSONP')
      container.removeChild(script)
      delete window[callBackName]
      reject('error happen in JSONP')
    }
  })
}

// 测试
JSONP('https://www.runoob.com/try/ajax/jsonp.php', { name: 'zcl' }).then(res => {
  console.log(res)
})
```

注意：
1. 不要 对script.src 的异常处理
2. 在head标签 添加 script标签后，记得移除。回调执行后 也要移除 window 上的回调函数