## 需求场景
起初，前端团队开发的H5是可接入直播团队APP的webView中，就需要调用到IOS/Android提供的接口，如关闭页面，调起微信等。

每次开发H5时，都需要和app的开发者对接，导致重复开发，重复沟通，效率低下。因此开发了初版app-sdk来封装APP端提供的接口。

后面由于业务的拓展，加入了统一登陆的SDK和微信相关SDK。H5SDK项目目前封装了<code>app的SDK</code>，<code>统一登陆SDK</code>，<code>微信相关SDK</code>（目前有<code>微信分享</code>和<code>微信主动授权</code>）。H5SDK是可拓展的，<strong>目标是封装移动端的各种SDK</strong>

## 拓展性实现
![sdk](@assets/project/16.png)

appSdk, loginSdk, wxSdk分别是目前封装的sdk，index.ts是打包的入口文件。在index.ts，抛出了一个<code>包含三个sdk构造函数的对象</code>
```js
import H5SDK from '../../dist/H5SDK'
const { AppSDK, WxSDK, LoginSDK } = H5SDK
// Vue的话，可以挂载到Vue构造函数的原型中
Vue.prototype.appSDK = new AppSDK()
Vue.prototype.wxSDK = new WxSDK()
Vue.prototype.LoginSDK = new LoginSDK()
```
每个sdk构造函数实例对象时(通过new来实例)，会执行init把sdk封装好的函数挂载到sdk构造函数的原型上
```js
const init = () => {
  Object.keys(sdkItem.methods).forEach((method: string) => {
    sdkItem.constructor.prototype[method] = (...args: any) => {
      console.log('method', method)
      return sdkItem.methods[method].apply(sdkItem.constructor, args)
    }
  })
}
```
代码参考。后面可修改sdkList对象，来拓展sdk
```js
import * as appSdk_methods from './appSdk/methods'
import * as wxSdk_methods from './wxSdk/methods'
import * as loginSdk_methods from './loginSdk/methods'

const sdkList: SdkList = [
  {
    constructor: 'AppSDK',
    methods: appSdk_methods
  },
  {
    constructor: 'WxSDK',
    methods: wxSdk_methods
  },
  {
    constructor: 'LoginSDK',
    methods: loginSdk_methods
  }
]
const H5SDK: Obj = {}

for (let i=0, len=sdkList.length; i<len; i++) {
  const sdkItem = sdkList[i]
  const constructorName = sdkItem.constructor
  const init = () => {
    Object.keys(sdkItem.methods).forEach((method: string) => {
      sdkItem.constructor.prototype[method] = (...args: any) => {
        console.log('method', method)
        return sdkItem.methods[method].apply(sdkItem.constructor, args)
      }
    })
  }
  // sdk构造函数
  sdkItem.constructor = function (this: any) {
    if (!(this instanceof sdkItem.constructor)) {
      warn(`${constructorName} is a constructor and should be called with the 'new' keyword`)
    }
    // 挂载函数
    init()
  }
  H5SDK[constructorName] = sdkItem.constructor
}

export default H5SDK
```

## 一、appSdk
### 移动端：H5与安卓/ios之间通信
app里面嵌套H5页面， 安卓和ios提供一个空壳子，方法两者互相调用。
1. 安卓和ios不同。需要写一个方法，来判断机型是安卓或者是ios
2. H5执行IOS的接口: <code>webkit.messageHandlers[action].postMessage({})</code>
3. H5执行Android的接口: <code>window.android\[action]()</code>。

```js
export function actionFun(...arg: any): void {
  const action = arg[0]
  const params = arg.slice(1)[0]
  console.log("actionFun -> action", action)
  console.log("actionFun -> params", params)
  const options = { action: action, params: params }
  utilsLibrary.getBrowserInfo().type === 'ios' ? iosFunc(options) : androidFunc(options)
}

// 封装好的 H5与安卓之间通信 函数
export function androidFunc(options: appFunc) {
  const { action, params } = options
  return new Promise((resolve, reject) => {
    if (myWindow.android && myWindow.android[action]) {
      // params不能为空、null、undefined, 否则方法会报undefined
      if (params) {
        myWindow.android[action](JSON.stringify(params))
      } else {
        myWindow.android[action]()
      }
      console.log(`Android环境--执行${action}成功`)
      resolve(`Android环境--执行${action}成功`)
    } else {
      new Error(`Android环境--未找到方法体${action}`)
      reject(`Android环境--未找到方法体${action}`)
    }
  })
}

// 封装好的 H5与IOS之间通信 函数
export function iosFunc(options: appFunc) {
  const { action, params } = options
  return new Promise((resolve, reject) => {
    if (myWindow.webkit && myWindow.webkit.messageHandlers && myWindow.webkit.messageHandlers[action]) {
      // 无参数的时候, 一定要传一个""作为参数
      if (params) {
        myWindow.webkit.messageHandlers[action].postMessage(params)
      } else {
        myWindow.webkit.messageHandlers[action].postMessage('')
      }
      console.log(`IOS环境--执行${action}成功`)
      resolve(`IOS环境--执行${action}成功`)
    } else {
      new Error(`IOS环境--未找到方法体${action}`)
      reject(`IOS环境--未找到方法体${action}`)
    }
  })
}
```
想添加app-sdk接口，只需在<code>appSdk/methods.ts</code>中抛出函数即可。下面以封装好的打开本地相册<code>openPhotoAlbum</code>函数为例
```js
/**
 * ```
 * appSDK.openPhotoAlbum(true, res => {
 *    console.log('res', res)
 * })
// 回调的参数格式：
//{
//  "images":[
//    {
//      "imageBase64":图片的base64数据,
//      "imageFormat":图片格式
//    }
//  ]
//}
 * ```
 * @description 打开本地相册(兼容版本: v3.8.0之后)
 * @param this 
 * @param isNeedCamera 是否需要拍照选项
 * @param openPhotoAlbumCallBack 用户处理打开相册的回调方法
 * @returns 
 */
export function openPhotoAlbum(isNeedCamera: boolean = true, openPhotoAlbumCallBack?: any): void {
  console.log('test', isNeedCamera, openPhotoAlbumCallBack)
  myWindow.photoCallback = (res: any) => {
    openPhotoAlbumCallBack(res)
  }
  return actionFun('openPhotoAlbum', {
    isNeedCamera
  })
}
```
:::tip
目前市面上App的版本都已强更到V3.8.0及以上，对于之前的版本不需要再做兼容
:::

## 二、wxSdk
目前有微信分享和微信主动授权。在本地测试微信分享的流程：
* [钉钉内网](https://developers.dingtalk.com/document/resourcedownload/http-intranet-penetration) 配置代理（其它代理工具也可）。我本地填入<code>liuwei.vaiwan.com</code>
```js
http://liuwei.vaiwan.com -> 127.0.0.1:9092
// start.bat
start E:\DDing\ddingDownload\钉钉内网\ding.exe -config=./ding.cfg -subdomain=liuwei 9092
```
* [微信沙箱](https://mp.weixin.qq.com/debug/cgi-bin/sandboxinfo?action=showinfo&t=sandbox/index) 配置JS接口安全域名。填入钉钉内网配置的域名<code>liuwei.vaiwan.com</code>

![微信沙箱](@assets/project/17.png)

1. 微信分享：调<code>getWechatJsSdkSignature</code>接口获取微信签名信息 --> wx.config --> wx.ready --> wx.onMenuShareAppMessage和wx.onMenuShareTimeline（分享给好友/朋友圈）

2. 主动授权获取微信信息。然后把用户微信信息存放到localStorage的wxUserInfo
```js
/**
 * @description 授权获取微信用户信息
 * ```
 * getWxUserInfo() {
 *   this.wxSDK.getWxUserInfo({
 *     env: 'TEST', 
 *     redirectUrl: '//liuwei.vaiwan.com/',
 *     appType: '56789', // test环境本人的appType
 *   }).then(res => {
 *     console.log('res=>', res)
 *   })
 * }
 * ```
 * @param {WxInfoConfig} 
 * @returns 
 */

export function getWxUserInfo({
  env,
  redirectUrl,
  needLogin = false,
  appType = '9'
}: WxInfoConfig) {
  env = env.toUpperCase() as Env
  const code = getQueryString('code')
  return new Promise((resolve, reject) => {
    if (code) {
      console.log('code==>', needLogin, code)
      initHttp({ apiType: 'bindApi', env: env })
      getWxInfo({
        code,
        needLogin,
        appType,
      }).then((res: any) => {
        if ([0, 200].includes(res.code)) {
          // 保存用户微信信息
          localStorage.setItem('wxUserInfo', JSON.stringify(res.data))
          resolve(res.data)
        } else {
          if (res.msg === '获取OpenId失败') {
            window.location.href = getWxRedirectUrl(redirectUrl, 'snsapi_userinfo', env)
            return
          }
          reject(res.msg)
        }
      }).catch(e => {
        console.log('wxSDK -> getWxUserInfo', e)
        reject(e)
      })
    } else {
      window.location.href = getWxRedirectUrl(redirectUrl, 'snsapi_userinfo', env)
    }
  })
}
```
## 三、loginSdk
[统一登陆h5及业务了解](./common-login-h5)。基本上目前开发的所有H5都需要接入登陆统一。业务H5需要引入Banner条，及相关的登陆逻辑。这部分我们封装到loginSdk.

下面重点讲以下三点的实现：
1. app和H5的统一登录参数处理【将app token 换成 统一登录的 token】
2. 统一登陆业务banner条设计
3. 统一登录页面互相跳转函数

### app内嵌H5
H5可配置在app不同的入口；前面六种入口的配置位于六一工作台-运营管理-APP广告位管理
1. 首页Banner
2. 首页快速入口
3. 首页浮标管理
4. 首页广告弹窗
5. App启动页
6. App消息推送：App推送的通知消息点击进入

为了实现app中的H5打开时，就需要是已登陆的状态。需要用app的token去获取统一登陆的token。app内的每个webview都会在url后自动拼接上用户基本信息，拼接完后的url为
```js
 https://www.xxx.com?参数=参数值&hllUserInfo={“userId”:userId,"token":token,"deviceId":deviceId"versionCode":versionCode}
```
如上所示，app的token放在<code>hllUserInfo</code>参数内。But。。。由于app历史问题吧，有的入口token会放在<code>params</code>内。因此需要做下处理。目前3.9.0版本后已经有统一的参数传递规范：https://wiki.61info.cn/pages/viewpage.action?pageId=16188959 
```js
export function initToken(env: Env = 'PROD'): Promise<InitTokenResponse> {
  const href = window.location.href
  env = env.toUpperCase() as Env
  console.log('window.location.href', window.location.href)
  const queryObj = decodeObj(utilsLibrary.parseQueryString(href))
  console.log('queryObj===>', queryObj)
  const getUrlInfo = () => {
    let appData: string = `{}`
    // 获取参数对象。token场景不同，只能做兼容了。。。
    if (queryObj['hllUserInfo']) { // v3.9.0添加
      appData = queryObj['hllUserInfo'] || `{}`
    } else if (queryObj['params']) { // v3.9.0之前
      appData = queryObj['params'] || `{}`
    } else if (queryObj['ssoUserInfo']) {
      // H5跳转入口，ssoUserInfo内有统一登录ssoUserToken
      appData = queryObj['ssoUserInfo'] || `{}`
    } else if (queryObj['Authorization']) { // 消息推送入口
      appData = JSON.stringify({
        token: queryObj['Authorization'],
        deviceId: queryObj['deviceId']
      })
    }
    return JSON.parse(appData)
  }
  const urlInfo: { token: string, deviceId: string } = getUrlInfo() // 链接上带的信息
  console.log('BaseSDK -> initToken -> urlInfo',env, urlInfo)
  initHttp({ apiType: 'appApi', env })
  return new Promise((resolve, reject) => {
    // 用url链接上app token 换 统一登陆token
    if (urlInfo.token) {
      getToken(urlInfo).then((ssoRes: any) => {
        console.log('BaseSDK -> initToken -> 统一登陆ssoRes信息：', ssoRes)
        if (ssoRes.code !== 200) {
          resolve({
            ssoUserToken: '',
            msg: ssoRes.msg
          })
        } else {
          resolve({
            msg: '登录成功',
            ssoUserToken: ssoRes.data
          })
        }
      }).catch((err: any) => {
        console.log('BaseSDK -> initToken -> err', err)
        reject(err)
      })
    } else {
      resolve({
        ssoUserToken: '',
        msg: 'url链接未带有app的token参数'
      })
    }
  })
}
```
<code>getUrlInfo</code>针对app不同入口兼容处理，目的是获取app的token; 然后调<code>getToken</code>接口，用app的token去获取统一登陆的token

## 登陆Banner
### register 页面注册。可根据配置是否显示登陆banner，登陆状态，及微信登陆相关等
* 传参：option（可供选择的属性值如下）

|参数 |	描述 | 类型 | 必传 |	默认值 |
|  ----  | ----  | ----  | ----  | ----  |
|env |	环境变量`DEV`, `TEST`, `PRE`, `PROD` | string | 必传(虽然默认值为PROD, 但建议要传) | `PROD`
|redirectUrl |	业务H5地址 | string | 必传 | - |
|appType | 公众号类型（'9': 画啦啦VIP课堂；'3306': 分销平台） | string | 非必传 | '9' |
|isShow |	是否显示弹窗 | boolean |  非必传 | true |
|zIndex |	顶部栏层级 | number或string | 非必传 | 199 |
|maxInitTime |	最大初始化时间 | number | 非必传 | 2 |
|wxAutoLogin |	是否开启自动登录 | boolean | 非必传 | false |
|wxAutoLoginType |	微信登录模式  1: 静默授权, 2: 主动授权(会返回openId相关信息) 默认为1 | number | 非必传 | 1 |
|wxAutoLoginRedirectUrl | 微信自动登录后的回调地址 | string |当wxAutoLogin为true时必传| - |

### 设计
![loginSdk](@assets/project/18.png)

```js
Vue.prototype.LoginSDK.register({
  env: 'TEST', // 环境变量
  redirectUrl: '//liuwei.vaiwan.com/', // 统一登录后的回调地址
  isShow: true, // 是否展示顶部栏
  zIndex: 199, // 顶部栏的 Z-Index
  appType: '56789', // 程亮测试用appType
  wxAutoLogin: true,
  wxAutoLoginType: 1,
  wxAutoLoginRedirectUrl: '//liuwei.vaiwan.com/',
}).then(res => {
  console.log('register res==>', res)
  new Vue({
    render: h => h(App)
  }).$mount('#app')
})
```

## loginSdk难点
### 1. app端，两个token的续登机制
在loginSdk.register初始化时，需要用userToken去获取用户信息，才能登陆。
* 在H5下，从登陆页登陆成功后，回跳到业务H5页面，链接会带有userToken
* 在app内嵌H5下，就有<code>双token机制</code>，即app token -> userToken -> 用户信息

### 2. 多个微信号切换，微信信息串号

2-1. 在微信环境下，开启微信登陆，默认是用无感知的静默授权。走 code -> userToken -> 用户信息。把userToken存在本地。

2-2. 只需最开初进入页面做一次静默授权即可。再次进入时，用本地userToken，去获取用户信息即可。如果本地没有userToken，则走2-1

起初是用上面的方案，但上线后有<strong>问题</strong>：<code>一些用户有多个微信号，当切换账号时会出现数据串号</code>。

<strong>原因</strong>：<code>有些机型下，切换微信账号，但微信的localStorage不会清空</code>

A微信 切换到 B微信，localStorage不清空，B微信进入页面，用A微信的userToken去获取用户信息。就出现串号了！

[部分机型，切换账号后，H5公众号应用，localStorage数据未清空，导致应用登录状态不正确](https://developers.weixin.qq.com/community/develop/doc/00006c5e2a4da08a5db90a2105bc00)

<strong>解决</strong>：cookie方案。切换微信号，cookie会清除。userToken保存到localStorage时，也保存到Cookie

```js
// 为了区分不同的业务H5
const cookiesPathName = location.pathname.substring(0, location.pathname.lastIndexOf('/'))

function setCookie(key, value) {
  Cookies.set(`${cookiesPathName}-${key}`, value , { path: cookiesPathName })
}

function getCookie(key) {
  return Cookies.get(`${cookiesPathName}-${key}`)
}
setCookie('userToken', userToken)
removeCookie('userToken')
```

### 3. token过期如何处理

用userToken获取用户信息时，约定<code>code: 621</code>为userToken过期。
```js
if (res.code === 621) {
  if (browser.versions.weixin && this.def.wxAutoLogin) {
    removeCookie('userToken')
    this.wxAutoLogin()
    return
  }
  this.refeshTokenHandle()
} 
```
3-1. 微信环境下并且开启了自动登陆。则再走一遍：code -> userToken(保存到本地)

3-2. 否则，调接口获取新的userToken并保存

### 4. 登陆加密。为了避免密码泄露。
```js
import md5 from 'js-md5'
request({
  url: `/user/processLogin`,
  method: 'post',
  data: {
    account: this.form.phone,
    loginEnv: this.loginEnv,
    password: md5(this.form.pwd),
  },
})
```

### 5. 中间页去获取code

由于授权域名回调只能填写一个。因此，授权页不能在业务H5上，因为业务H5的域名远不止一个。

![授权](@assets/project/20.gif)

实现：用一个中转页，<code>微信授权后跳到中转页，中转业获取到state, code后，再跳转到业务H5页面</code>。中转页放到授权域名下，统一维护授权中转页。
```js
// 中转页网址。即h5-sdk部署地方
export const transferPageConfig: Api = {
  DEV: '//pay-test.61info.cn/common-login-dev',
  TEST: '//liuwei.vaiwan.com', // 本地测试用
  // TEST: '//pay-test.61info.cn/common-login-test',
  PRE: '//pay-test.61info.cn/common-login-pre',
  PROD: '//pay.61info.cn/common-login'
}

const commonRedirectUrl: string = location.protocol + transferPageConfig[env] + '/static/wxTransfer.html'
const redirectUrlElement = document.createElement('a')
redirectUrlElement.href = decodeURIComponent(redirectUrl)
// 因为state参数限制长度在128字节, 所以将链接上的参数统一放入redirect_uri上, 经过中间层解析后再转移到业务的url上去
const origin = redirectUrlElement.origin + redirectUrlElement.pathname + (redirectUrlElement.hash.split('?')[0] || '')
return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=xxx&redirect_uri=${encodeURIComponent(commonRedirectUrl)}&response_type=code&scope=xxx&state=${encodeURIComponent(origin)}#wechat_redirect`

```

### 6. 业务H5页面带了很多参数，授权回来后你怎么处理呢

起初，放state里， 但state有128长度限制。

![state](@assets/project/19.png)

<strong>解决</strong>：把链接的参数拼接好，放<code>redirect_uri</code>后面

<!-- 6. 能不能实现单点登录
用微信授权去搞，但每次不同域名还得重新去走授权。如何优化？用iframe弄一个第三方鉴权平台 -->

## 打包优化
1. 外部拓展<code>externals</code>, 将h5-sdk用到的第三方库放到外部拓展. 减少打包体积
```js
externals: [
  "axios",
  "weixin-jsapi",
  '@i61/utils-library'
]
```

2. babel做代码编译
```js
// build/webpack.config.js
rules: [
  {
    test: /\.(ts|js)x?$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader'
    }
  }
]
// babel.config.js
{
  "presets": [
    [
      "@babel/preset-env",
      // {
      //   "useBuiltIns": "usage",
      //   "corejs": "3.8",
      //   "modules": "auto"
      // }
    ],
    [
      "@babel/preset-typescript",
      {
        "isTSX": true,
        "allExtensions": true
      }
    ]
  ],
  "plugins": [
    // "@babel/plugin-transform-modules-umd",
    "@babel/plugin-transform-runtime"
  ]
}
```
最开始用了<code>useBuiltIns: "usage"</code>，打包出来有<code>65KB</code>。再来复习下这个参数[babel](../../babel/#babel-polyfill)
* 默认为false: 不做polyfill
* entry: 考虑目标环境缺失的API模块, 引入相关的API的polyfill
* usage: 只有使用到的ES6特性API在目标环境缺失的时候, 才引入polyfill

去掉<code>useBuiltIns</code>参数，不引入polyfill，打包出来有<code>29KB</code>

## 打包难点
打包出来的是umd格式的<code>H5SDK.js</code>. 
```js
// 正常
import H5SDK from '../../src/index'
// 出错
import H5SDK from '../../dist/H5SDK'
```
在example测试项目中，引用打包好的文件，竟然出错了

![error](@assets/project/21.png)

<strong>原因</strong>：babel-loader 对 H5SDK.js 再次进行了编译

<strong>解决</strong>：

* 不建议：加了 "@babel/plugin-transform-modules-umd", 插件就可以直接引本地的umd包
* babel-loader忽略对dist/H5SDK.js的编译
```js
{
  test: /\.(ts|js)x?$/,
  exclude: [
    /node_modules/,
    path.resolve(__dirname, '../dist/H5SDK.js')
  ],
  use: {
    loader: 'babel-loader',
    options: {
      configFile: path.resolve(__dirname, 'babel.config.json')
    }
  }
},
```

## 部署
* jenkins服务器
  1. IP：172.16.253.221
  2. 域名：jenkins.test.61info.com
* 业务服务器
  1. IP: 172.16.51.4
  2. 域名：draw-h5-test.61info.cn

用新标签打开，查看大图：

<img src="@assets/project/h5-sdk.png" class="jenkins-img" />

### 构建
![构建](@assets/project/13.png)

在jenkins服务器中
1. jenkins会把<code>git</code>上的代码拉到<code>/home/data/jenkins/workspace/</code>目录
2. 执行<code>npm i</code>再执行打包命令<code>npm run</code>，最后把打包的dist内容压缩到web.zip压缩包。
```js
+ rm -f web.zip
+ node -v
v12.10.0
+ pwd
/home/data/jenkins/workspace/h5-sdk
+ npm i
+ npm run build-test

> @i61/h5-sdk@1.1.0 build-test /home/data/jenkins/workspace/h5-sdk
> webpack --mode=production --config ./build/webpack.config.js

webpack 5.54.0 compiled successfully in 10406 ms
+ cd ./dist
+ zip -r ../web.zip ./cc4578a99c34769a7e0fda7d9f11d457.png ./H5SDK.js ./static
  adding: cc4578a99c34769a7e0fda7d9f11d457.png (stored 0%)
  adding: H5SDK.js (deflated 67%)
  adding: static/ (stored 0%)
  adding: static/test.html (deflated 25%)
  adding: static/wxTransfer.html (deflated 52%)
+ cd ../..
```
构建后会更新web.zip
```js
[www@jenkins-test h5-sdk]$ ls
assets             dist     node_modules       README.md  test           types
babel.config.json  docs     package.json       src        tsconfig.json  web.zip
build              example  package-lock.json  static     typedoc.json
[www@jenkins-test h5-sdk]$ 
```

### 构建后操作
![构建后操作](@assets/project/14.png)

连接业务服务器<code>172.16.51.4</code>，把jenkins服务器建构好的<code>web.zip</code>通过SSH推送到业务服务器的<code>/home/jenkins/deploy/h5-sdk/</code>目录
```js
[h5-sdk] $ /bin/sh -xe /tmp/jenkins4217326995803145882.sh
+ project=h5-sdk
+ '[' 0 -eq 1 ']'
SSH: Connecting from host [jenkins-test]
SSH: Connecting with configuration [cms-172.16.51.4] ...
SSH: EXEC: completed after 201 ms
SSH: Disconnecting configuration [cms-172.16.51.4] ...
SSH: Transferred 1 file(s)
Finished: SUCCESS
```
在业务服务器中，执行<code>deploy.sh脚本</code>，清空web目录内容，再把<code>web.zip</code>解压到<code>web目录</code>
```js
[www@localhost h5-sdk]$ cat deploy.sh
#! /bin/bash -e
rm -rf ./web/*
unzip web.zip -d ./web
```

```js
[www@localhost h5-sdk]$ pwd
/home/jenkins/deploy/h5-sdk
[www@localhost web]$ ls
cc4578a99c34769a7e0fda7d9f11d457.png  H5SDK.js  static
[www@localhost web]$ cd ..
[www@localhost h5-sdk]$ ls
deploy.sh  web  web.zip
```

## nginx配置

<code>/usr/local/nginx/conf/vhost</code>目录下有各个业务的nginx配置，找到<code>activity-test.conf</code>

```js
[www@localhost vhost]$ pwd
/usr/local/nginx/conf/vhost
[www@localhost vhost]$ vim activity-test.conf 

// activity-test.conf
server {
  // 支持http, https
  listen   80;
  listen   443 ssl;
  // 证书相关
  ssl_certificate xxx;
  ssl_certificate_key xxxx;

  // 域名
  server_name  activity-test.61info.cn;
  access_log logs/activity.log;
  add_header Access-Control-Allow-Origin *;
  add_header Access-Control-Allow-Methods 'GET,POST';
  add_header Access-Control-Allow-Headers 'user-token,DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization';

  index index.html;
  // 添加了这条
  location /h5-sdk {
    alias /home/jenkins/deploy/h5-sdk
  }
}
```
执行<code>nginx -s reload</code>, 重启ngnix服务
```js
[www@localhost sbin]$ pwd
/usr/local/nginx/sbin
[www@localhost sbin]$ ls
[www@localhost sbin]$ nginx
[www@localhost sbin]$ ./nginx -s reload
```

访问：[https://activity-test.61info.cn/h5-sdk/static/test.html](https://activity-test.61info.cn/h5-sdk/static/test.html)

![test](@assets/project/15.png)


## 总结

在开发H5时，遇到了重复对接APP SDK接口；微信分享重复开发；统一登陆Banner设计三大问题。我作为H5SDK开发者，把三大问题的解决方案appSdk, wxSdk, loginSdk集成到H5SDK，通过抛出Sdk构造函数，new实例化时在构造函数的原型添加相关函数，使H5SDK具有拓展性。统一登陆Sdk，满足app环境下双token登陆，微信环境下自动登陆，浏览器环境下帐密登陆，覆盖登陆三大场景。目前统一登陆已接入20+ 业务H5，大大提高了H5开发效率。

<style scoped>
.jenkins-img {
  width:200px;
  height: 200px;
}
</style>

参考：
[babel-loader 对已编译的脚本进行再编译从而导致文件执行出错](https://juejin.cn/post/6844903988958068749)