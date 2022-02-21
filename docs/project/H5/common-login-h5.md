## 需求背景
* <code>重复开发</code>，效率低。各个业务都是独自设计和开发的登录页，重复造轮子(copy代码也累)。
* <code>重复维护</code>，维护难。登录逻辑有修改，需要整理全部需要登录的业务，容易遗漏，然后单个修改处理，消耗人力

基于以上问题。想把登陆相关页面与逻辑从业务中抽离出来，统一维护。

## 业务(了解)
这部分不介绍。自行查看大图
<div class="img-box">
  <div>
    <p>验证码登录</p>
    <img src="@assets/project/smsCode.png" class="small-img" />
  </div>
  <div>
    <p>密码登录</p>
    <img src="@assets/project/pwd.png" class="small-img" />
  </div>
    <div>
    <p>找回密码</p>
    <img src="@assets/project/findPwd.png" class="small-img" />
  </div>
</div>

* 相关页面

![common-login](@assets/project/commonLogin.png)

## 统一登陆相关H5
统一登陆相关H5包括：登陆页、注册页、用户隐私政策页、用户协议页、忘记密码(找回密码)页。这都是常见且通用的页面。产品和UI根据公司产品风格统一好UI后，前端就可以进行开发。开个新项目hll-common-login-h5，使用Vue + webpack打包即可。

登陆页：
1. <code>gotoUrl</code>: gotoUrl是登陆成功的回跳地址
2. <code>appType</code>：表示不同的公众号类型，默认为1表示hll VIP课堂；2表示分销平台公众号。问了下同事，说是由于分销平台风险高，可能会被微信封号，所以才多加个销平台公众号。
3. <code>loginEnv</code>: 登陆环境。目前有三种：微信环境，APP环境，web(浏览器)环境。后端接口需要传这个参数，因此前端需要loginEnv字段
```js
// 页面链接：http://pay-test.61info.cn/common-login-test/#/login?appType=1&gotoUrl=http%3A%2F%2F172.16.28.108%3A3000%2F%23home
created() {
  this.gotoUrl = getQueryString('gotoUrl')
  if (!this.gotoUrl) {
    this.gotoUrl = sessionStorage.getItem('gotoUrl') || ''
  } else {
    sessionStorage.setItem('gotoUrl', this.gotoUrl)
  }
  // 登录环境：1=web环境；2=微信环境；3=app环境
  const ua = navigator.userAgent
  if (ua.indexOf('MicroMessenger') > -1) {
    // 微信环境
    this.loginEnv = 2
    this.getCode() // 下面微信授权登陆细说
  } else if (ua.indexOf('hualalaApp') > -1) {
    // APP环境
    this.loginEnv = 3
  } else {
    // web环境
    this.loginEnv = 1
  }
}

// 通用处理获取验证码，倒计时60秒
handleCommonSms() {
  this.$toast(`已发送验证码至${this.form.phone}，请注意查收`)
  this.smsSendStatus = true
  this.smsCountDownInterval = setInterval(() => {
    this.smsCountDown -= 1
    if (this.smsCountDown === 0) {
      clearInterval(this.smsCountDownInterval)
      this.smsCountDown = 60
      this.smsSendStatus = false
    }
  }, 1000)
},
```
登陆成功后跳转
* 非微信环境：回到回跳地址，并在链接上带上userToken, refreshToken
* 微信环境：微信环境，有两种方式来到登陆页
1. 业务登陆入口 --> 登陆页 --> 业务页面。业务登陆入口 跳转到 登陆页，登陆成功后，回到业务页面。
2. 绑定页面 --> 登陆页 --> 绑定页。绑定页面点添加宝贝 跳转到 登陆页，登陆成功，前端再做绑定，最后回到绑定页面查看绑定列表。

![bind](@assets/project/bind.png)

::: tip
微信绑定账号需求背景：
家长可以通过【画啦啦VIP课堂】服务号，获得孩子的上课通知、作业通知、阶段学习报告等消息；但是家长需要完成两个行为才可以
1. 微信绑定画啦啦账号
2. 关注【画啦啦VIP课堂】

产品为了：提高家长账号绑定微信号的占比，为后续通过微信公众号通知家长上课、作业、请假、学习报告等，提高人效

因此，家长在微信环境登录画啦啦账号时，给用户默认微信绑定账号。<code>登陆成功后给用户绑定账号</code>
:::
```js
// 登录成功后跳转
handleRedirect() {
  // 微信环境下
  if (navigator.userAgent.indexOf('MicroMessenger') > -1) {
    this.handleBindAccount()
  } else {
    // 非微信环境, 登陆成功后，回到业务页面
    location.href = this.gotoUrl + `&userToken=${this.userToken}&refreshToken=${this.refreshToken}`
  }
}
// 绑定账号
handleBindAccount() {
  this.$toast.loading({
    message: '绑定账号中...',
    forbidClick: true,
    loadingType: 'spinner',
    duration: 0,
  })
  request('xxx-发起绑定请求').then(res => {
    this.$toast.clear()
    if (this.gotoUrl) {
      // 微信环境, 回到业务页面
      location.href = this.gotoUrl + `&userToken=${this.userToken}&refreshToken=${this.refreshToken}`
    } else {
      // 微信环境, 回到绑定页面
      window.location.href = location.origin + location.pathname + '?time=' + Number(new Date()) + '#bind?appType=' + this.appType
    }
  })
}
```

## 微信授权登陆
微信[网页授权]((https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html))有两种：
* 主动授权：<code>scope=snsapi_userinfo</code> 静默授权并自动跳转到回调页的。用户感知的就是直接进入了回调页（往往是业务页面）
* 静默授权：<code>scope=snsapi_base</code> 需要用户手动同意，并且由于用户同意过，所以无须关注，就可在授权后获取该用户的基本信息

### 网页授权流程分为四步
1. 用户同意授权，获取code
```js
// 由于授权操作安全等级较高，所以在发起授权请求时，微信会对授权链接做正则强匹配校验，如果链接的参数顺序不对，授权页面将无法正常访问
https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&state=STATE#wechat_redirect
```
下图为scope等于snsapi_userinfo时的授权页面：界面样式可能不一样

![主动授权](@assets/project/10.png)

2. 通过code换取网页授权access_token和openid: 这部分<code>后端实现</code>
3. 刷新access_token（如果需要）
4. 拉取用户信息(需scope为 snsapi_userinfo)
如果网页授权作用域为snsapi_userinfo，则此时开发者可以通过access_token和openid拉取用户信息了

 |参数 |	描述 |
 |  ----  | ----  |
 |openid |	用户的唯一标识 |
 |nickname |	用户昵称 |
 |sex	 |用户的性别，值为1时是男性，值为2时是女性，值为0时是未知 |
 |province |	用户个人资料填写的省份 |
 |city |	普通用户个人资料填写的城市 |
 |country	 |国家，如中国为CN |
 |headimgurl |	用户头像，最后一个数值代表正方形头像大小（有0、46、64、96、132数值可选，0 |代表640*640正方形头像），用户没有头像时该项为空。若用户更换头像，原有头像URL将失效。 |
 |privilege |	用户特权信息，json 数组，如微信沃卡用户为（chinaunicom） |
 |unionid |	只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段。 |

后端 openId 和用户信息做关联，通过openId能拿到用户信息。

::: warning
为什么登陆页用主动授权？ 绑定列表页用静默授权？ 
:::
登陆页要用主动授权是由于，<code>只有主动授权才能拿到用户的微信相关信息</code>(字段如上)，然后后端保存用户微信信息，并用用户openId做关联，通过openId就可以查到用户相关信息。
```js
// 微信登录失败重试次数
const WX_AUTO_LOGIN_RETRY_COUNT = 2
// 微信登录失败重试间隔秒数
const WX_AUTO_LOGIN_RETRY_TIME = 5
created() {
  // 微信环境
  this.getCode()
}
methods: {
  getCode() {
    this.code = getQueryString('code')
    // 没有code的情况 且同时 没有openid 或者 没有wxCodeLogin的情况 都要请求授权，兼容接口拿不到hllopenid的情况
    if (!this.code && (!getCookie('wxCodeLogin' + this.appType) || !localStorage.getItem('hllOpenid'))) {
      this.wxAuthHandle()
    } else if (!getCookie('wxCodeLogin' + this.appType) || !localStorage.getItem('hllOpenid')) {
      this.getOpenId(this.code)
    }
  },
  wxAuthHandle() {
    this.$toast.loading({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
      duration: 0,
    })
    const appid = 'xxx' // 公众号的appId
    const redirectUrl = `xxx/#/login?appType=${this.appType}` // 回调的页面。即登陆页url
    // 主动授权
    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUrl}&response_type=code&scope=snsapi_userinfo&state=#wechat_redirect`
  },
  // 通过code获取openid
  getOpenId(code) {
    const nowTime = Number(new Date()) / 1000
    let retryCount = parseInt(getCookie('retryCount') || 1)
    const retryTime = parseInt(getCookie('retryTime') || nowTime)
    this.$toast.loading({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
      duration: 0,
    })
    request(`/hualala/vip/sso/getWxInfo/${code}`)
      .then(res => {
        this.$toast.clear()
        if (
          res.msg === '获取OpenId失败' &&
          (retryCount < WX_AUTO_LOGIN_RETRY_COUNT || nowTime - retryTime > WX_AUTO_LOGIN_RETRY_TIME)
        ) {
          if (nowTime - retryTime > WX_AUTO_LOGIN_RETRY_TIME) {
            setCookie('retryCount', 1)
          } else {
            retryCount++
            setCookie('retryCount', retryCount)
          }
          setCookie('retryTime', nowTime)
          setCookie('wxCodeLogin' + this.appType, '')
          this.wxAuthHandle()
          return
        }
        if (res.code === 0 && res.data) {
          localStorage.setItem('hllOpenid', res.data.openId)
          setCookie('wxCodeLogin' + this.appType, 'true')
        } else {
          this.$toast(res.msg)
        }
      })
      .catch(e => {
        console.log('getOpenId -> e', e)
      })
  },
}
```
![微信授权](@assets/project/11.png)

绑定页面，静默授权的处理和登陆页基本一致
```js
created() {
  this.getCode()
},
getCode() {
  this.code = getQueryString('code')
  if (this.code === null || this.code === '') {
    const appid = 'xxx' // appid
    const redirectUrl = `xxx/#/bind?appType=${this.appType}` // 绑定页面回调
    )
    // 静默授权
    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectUrl}&response_type=code&scope=snsapi_base&state=123#wechat_redirect`
  } else {
    if (sessionStorage.getItem('wxcode') === this.code) {
      // 授权成功，进入业务逻辑处理：获取绑定列表
      this.handleQueryInfo()
    } else {
      // 获取openId
      this.getOpenId(this.code)
    }
  }
},
// 通过code获取openid
getOpenId(code) {
  this.$toast.loading()
  request(`/hualala/vip/sso/getHualalaOpenId/${code}`).then(res => {
    this.$toast.clear()
    if (res.code === 0) {
      localStorage.setItem('hllOpenid', res.data)
      sessionStorage.setItem('wxcode', code)
      this.handleQueryInfo()
    } else {
      this.$toast(res.msg)
    }
  })
}
```

## 统一登陆Banner
至此，已经实现把登陆相关页面与逻辑从业务中抽离出来，统一维护了。已经胜利在望。接下来只需要在业务H5引入Banner即可

![banner](@assets/project/12.png)

思考中，设计中。。。

[loginSdk](./h5-sdk.html#三、loginsdk)

## 总结
在开发H5时，每个业务H5都要重复开发一套登陆页，导致开发效率低，维护困难。希望把登陆相关页面与逻辑从业务中抽离出来，统一维护。我负责登陆H5界面开发。使用Vue开发H5界面；登陆页通过接入微信网页主动授权，实现用户openId关联用户信息。目前统一登陆已接入20+ 业务H5，大大提高了H5开发效率。


<style scoped>
.img-box {
  display: flex;
}
.small-img {
  /* width: 30% */
}
</style>

参考：
[微信网页开发 /网页授权](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html)