## 同源策略
同源指<code>协议、域名、端口相同</code>，同源策略是浏览器的安全机制。
不允许指不同源的DOM进行操作。场景：iframe跨域情况，不同的iframe是限制互相访问的
不允许XHR对象向不同源的服务器地址发起HTTP请求

## JSONP原理
JSONP(json with padding)。script标签不受浏览器同源策略的限制，允许跨域访问资源。

<strong>
浏览器通过 Script 标签 发起 Get 请求，将浏览器定义的 回调函数名 传给后端，后端收到浏览器的 Get 请求后，去查询获取数据，返回 JS 数据。JS数据 即请求的 Script 标签内容。包含之前定义的 回调函数名，参数是后端 获取的数据
</strong>

![dfd](@assets/browser/browser/1.png)


```js
<script type="text/javascript">
  // 浏览器定义：回调函数
  function callback(data) {
      alert(data.message);
  }
</script>
<script type="text/javascript" src="http://localhost:20002/test.js?callback=callback"></script>
```
请求服务器，获取的 script 标签内容。callback的参数是 服务端返回的数据
```js
// 调用callback函数，并以json数据形式作为参数传递，完成回调
callback({message:"success"});
```

## 面试
问：说下JSONP的原理

答：script标签不受浏览器同源策略的限制


问：实现一个高质量JSONP函数(字节面试题)

具体的实现上有几个关键点：
1. 服务端返回的数据不是 JSON，而是 JavaScript，也就是说 contentType 为 application/javascript ，内容格式为callbackFunction(JOSN) 。
2. callbackFunction 需要注册在 window 对象上，因为 script 加载后的执行作用域是window作用域。
3. 需要考虑同时多个 JSONP 请求的情况，callbackFunction 挂在 window 上的属性名需要唯一。
4. 请求结束需要移除本次请求产生的 script 标签和window上的回调函数。
5. 最好支持 Promise 。


函数定义：
```js
function jsonp ({url, data, callback}) {
    
}
```
url 是请求地址，data（Object类型） 是请求参数，callback（Function类型） 是回调函数。

使用方法：
```js
jsonp({
  url: 'url',
  data: {  
    key1: 'value1'  
  },  
  callback (data) {  
    // data 是服务端返回的数据  
  }  
})
```

答：
```js
function jsonp({ url, data, callback }) {
  const objectToQuery = obj => {
    const tempArr = []
    for (let key in obj) {
      tempArr.push(decodeURIComponent(key) + '=' + decodeURIComponent(obj[key]))
    }
    return tempArr.join('&')
  }
  const container = document.getElementsByTagName('head')[0]
  const callbackFunc = `callbacl_${new Date().getTime()}` // 唯一
  const script = document.createElement('script')
  script.src = `${url}?${objectToQuery(data)}&callback=${callbackFunc}`
  console.log(script.src)
  script.type = 'text/javascript'
  container.appendChild(script)

  window[callbackFunc] = res => {
    callback && callback(res) // 执行回调。res是服务器返回的数据
    container.removeChild(script)
    delete window[callbackFunc]
  }

  script.onerror = () => { // 异常处理
    console.log('script error')
    window[callbackFunc] = () => {
      callback && callback('something error hanppend!')
      container.removeChild(script)
      delete window[callbackFunc]
    }
  }
}
```
使用Promise:
```js
function jsonp({ url, data, callback }) {
  const objectToQuery = obj => {
    const tempArr = []
    for (let key in obj) {
      tempArr.push(decodeURIComponent(key) + '=' + decodeURIComponent(obj[key]))
    }
    return tempArr.join('&')
  }
  const container = document.getElementsByTagName('head')[0]
  const callbackFunc = `callbacl_${new Date().getTime()}` // 唯一
  const script = document.createElement('script')
  script.src = `${url}?${objectToQuery(data)}&callback=${callbackFunc}`
  console.log(script.src)
  script.type = 'text/javascript'
  container.appendChild(script)

  return new Promise((resolve, reject) => {
    window[callbackFunc] = res => {
      // callback && callback(res) // 执行回调。res是服务器返回的数据
      container.removeChild(script)
      delete window[callbackFunc]
      resolve(res)
    }

    script.onerror = () => { // 异常处理
      console.log('script error')
      window[callbackFunc] = () => {
        // callback && callback('something error hanppend!')
        container.removeChild(script)
        delete window[callbackFunc]
        reject('something error hanppend!')
      }
    }
  })
}
```

参考：https://zhuanlan.zhihu.com/p/141809274