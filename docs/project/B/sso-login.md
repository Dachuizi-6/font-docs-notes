
## 场景
随着业务快速发展，除了CMS，CRM，直播后台，陆续研发新的后台业务，后台业务一多，就有两个问题：
1. 后台登陆业务重复开发。
2. 后台入口难找。接手的项目一多，每次都得找项目的链接。

## 实现
账密登陆 --> 获取用户信息及<code>accessToken</code> --> 获取系统列表并展示(header的authorization字段值为accessToken) --> 选择进入系统 --> 系统入口链接带有用户信息及<code>accessToken</code>，接入的系统把用户信息及accessToken保存起来。


<div>
  <img src="@assets/project/31.png" style="width: 30%" />
  <img src="@assets/project/32.png" style="width: 68%" />
</div>

```js
{
  "systemId":21,
  "desc":"SmartBI", // 系统名
  "imgUrl":"https://img2.61info.cn/cms_new/homework/2020/4/9/1586426524573.png", // 图标
  "url":"https://manager-test.61info.cn/#/cms/home?time=1634901225961&user=%7B%22userId%22%3A202706%2C%22accessToken%22%3A%22eyJhbGciOiJIUzI1NiJ9.eyJkYXRhIjoiWGcrY0NySlZ0eEg5N0FqQzVJUEV2bVhySFQ2YTY2T0cxVk5uTUdNK3R1Y2pVVU9nSTExQVRPaFZLU1N3VjhIb1VpRUh5WUp4SkRZNnBvendVRjIvYkNGQ0ZiRmhIM1JOR0VjR1RiOFl1SGN3SnBLLzBFRHBXRmVnMU1KcStGekVLejltSmR1Y3dPSXRJcmJvK3I2Q1lwNmtQUCtqRVlIQWdTVXl1UTBocVdiMDBRT0RHY0NzMGVHNzZsam1tN1BDb1RVRXRpL3VhcWZxT0Qxb3IxaktHbDhMeTA2YzZheldsM1RIcmRyQTJudz0iLCJleHAiOjE2NTA0NTMyMjV9.P-qCYx6tap39ixsWlu03KfYFhm4p8GdkcPaD4nuDxvI%22%2C%22accessTokenExpire%22%3A1650453225000%2C%22refreshToken%22%3A%22c00f9ba771638ac3af076753d918c0075152365f%22%2C%22refreshTokenExpire%22%3A1650453225000%2C%22name%22%3A%22%E5%BC%A0%E7%A8%8B%E4%BA%AE%22%2C%22phone%22%3A%2218822348321%22%2C%22systemId%22%3A4%7D"
}
```

后台系统接一单点登陆
```js
// 把accessToken和用户信息保存在本地
// 这块逻辑可以抽离出来，给每个接入单点登陆的系统共用
const params = getParams()
const user = params.user
// 自动更新本地缓存
if (user && user.accessToken) {
  localStorage.setItem('accessToken', user.accessToken)
  localStorage.setItem('loginInfo', JSON.stringify(user))
}

// axios
if (error.response.status && error.response.status === 401) {
  Message({
    message: '登录过期，即将跳转至统一登录界面',
    type: 'error',
    duration: 5 * 1000
  })
  setTimeout(() => {
    // 回到单点登陆页
    window.location.href = process.env.OA_LOGIN_URL
  }, 3000)
}
```

## JWT
JWT由头部(Header), 负载(Payload)，签名(Signature)组成。alg属性表示签名的算法（algorithm），默认为<code>SHA256</code>
![jwt](@assets/project/33.png)

1. Header
Header 部分是一个 JSON 对象，通常是下面的样子
```js
{
  "alg": "HS256",
  "typ": "JWT"
}
```
2. Payload
Payload 部分也是一个 JSON 对象，用来存放实际需要传递的数据。JWT 规定了7个官方字段，供选用
```js
iss (issuer)：签发人
exp (expiration time)：过期时间
sub (subject)：主题
aud (audience)：受众
nbf (Not Before)：生效时间
iat (Issued At)：签发时间
jti (JWT ID)：编号
```
除了官方字段，你还可以在这个部分定义私有字段
:::tip
Header, Payload对象，都是使用<code>Base64URL算法</code>转成字符串
:::
3. Signature
Signature 部分是对前两部分的签名，防止数据篡改。
服务器指定一个只有服务器才知道的密钥(secret), 使用Header里面指定的签名算法（默认SHA256)
```js
// 按公式，生成Signature
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```


[jwt在线解密](https://www.box3.cn/tools/jwt.html)

注意了，由于Header, Payload是使用[Base64URL](https://www.npmjs.com/package/base64url)算法加密的，而Base64URL是可以解密的。因此Header和Payload是可以解密的。

![jwt](@assets/project/34.png)

## 面试
问：不同域名共享cookie

答：
1. 挂在一个主域名下，那么子域名可以共享主域名的cookie. 
如：主域名：<code>.61info.cn</code>  子域名：<code>manager-test.61info.cn</code>和<code>sso-login-test.61info.cn</code>

2. 添加cookie时设置domain。domain需要是当前域名的域名。本质原理还是子域名可以共享主域名的cookie
如：在<code>https://manager-test.61info.cn/</code>域名下，添加cookie, domain为主域名61info.cn。则子域名实现cookie共享
```js
// https://manager-test.61info.cn/ 域名下
document.cookie = "example=zcl;domain=61info.cn"
```

问：单点登陆的实现方法

答：
单点登陆SSO：一次登陆，就可以访问多个系统

1. cookie共享（多个系统子域名相同）。登陆后把登陆信息(sessionId, token...)存在主域名的cookie中，子域名共享主域名的cookie，实现自动登陆。
2. url带登陆的token（多个系统域名不同）。sso界面登陆成功后跳到子应用时url带上token。子应用拿到token后，保存在本地(建议localstorage)。进入子应用时，通过本地的token实现自动登陆



[傻傻分不清之 Cookie、Session、Token、JWT](https://juejin.cn/post/6844904034181070861#heading-18)
[JSON Web Token 入门教程](http://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html)
[你真的了解 Cookie 和 Session 吗](https://juejin.cn/post/6844903842773991431#heading-0)

<style scoped>
img {
  max-width: 100%!important;
}
</style>

