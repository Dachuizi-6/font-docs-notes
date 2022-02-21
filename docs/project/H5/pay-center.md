## 场景
2020年前，公司内支付收费来自线下，线下收费，保存家长支付截图，再由老师到B端后台填写学员信息，上传支付截图。效率低下。随着公司从几百到几千的发展，支付成为公司发展瓶颈，一个内部使用，基建性质的支付平台应运而生。
1. 正式课报名需要支付。最初支付的开发设计是在正式课报名H5中，目的是让家长在报课时交费。2020年初左右，我参与支付H5的开发，主要接入<code>微信支付</code>，<code>支付宝支付</code>，<code>通联快捷支付</code>(即绑定银行卡 --> 输验证码 --> 支付)
2. 抽离支付业务。随着H5业务快速发展，部分H5也有接入支付业务的需求。因此，把支付业务抽离出来，独立维护支付中心H5。

## 业务
1. 微信支付。微信下支付流程简单。实现上和[wxSdk-微信分享](./h5-sdk.html#二、wxsdk)一致：调接口获取微信签名信息 --> wx.config --> wx.ready --> wx.chooseWXPay
```js
wx.config({
  debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
  appId: res.data.appId, // 必填，公众号的唯一标识
  timestamp: res.data.timestamp, // 必填，生成签名的时间戳
  nonceStr: res.data.nonceStr, // 必填，生成签名的随机串
  signature: res.data.signature, // 必填，签名，见附录1
  jsApiList: ["chooseWXPay"],
});
```
![wxPay](@assets/project/26.png)

2. 支付宝支付。支付宝支付实现很简单，在收银台页点确认支付，调接口，后端返回一个链接，手机浏览器打开链接，就会自动唤起本地安装的支付宝进行支付。
```js
https://mclient.alipay.com/cashier/mobilepay.htm?alipay_exterface_invoke_assign_target=invoke_dfd00918a66d86f566b99f1cf7cecbf5&alipay_exterface_invoke_assign_sign=_iuvu_a_r_t_z_dcug_q_f_o_u6a_b_e_q_md_ee_ne_v_n_d_bm_n_x_f_y_ru_q_v5_t9p_th_b0_kkfp_cw%3D%3D
```
![aliPay](@assets/project/27.png)

由于在<code>微信环境下无法唤起支付宝</code>，因此，需要做一个中转页面。

3. 通联快捷支付。绑定银行卡 --> 输验证码 --> 支付。实际上较少人用这种支付方式。

![bank](@assets/project/28.png)

## 难点
### 微信支付本地调试
如何在本地测试微信支付？

1. 改本地host
```js
// C:\Windows\System32\drivers\etc
172.16.28.108 pay-test.61info.cn
```
2. 下载安装[ngnix](https://nginx.org/en/docs/windows.html)，改ngnix配置。把<code>http://pay-test.61info.cn</code>代理到本地<code>http://172.16.28.108:8889/</code>
```js
server {
  listen 80;
  server_name pay-test.61info.cn;
  
  location / {
    proxy_pass  http://172.16.28.108:8889/;
  }
}
// 启动ngnix服务
cd nginx-1.20.1
start ./nginx  // 启动
// tasklist /fi "imagename eq nginx.exe"
// 映像名称                       PID 会话名              会话#       内存使用
// ========================= ======== ================ =========== ============
// nginx.exe                    15120 Console                    1      7,996 K
// nginx.exe                    24040 Console                    1      8,244 K
./nginx -s stop  // 停止服务
```
3. 改支付中心h5项目的proxy。

由于h5本身做了代理，把<code>/api/</code>的请求，转发到<code>pay-test.61info.cn</code>服务。而由于第2步做了nginx转发，所以最终的路径是：/api/请求 --> pay-test.61info.cn --> 172.16.28.108:8889. 而我本地172.16.28.108:8889不是后端服务，因此/api/请求无法成功。

解决：ping pay-test.61info.cn, 把支付中心代理的后端服务域名，用ip表示
```js
C:\Users\zhangchengliang>ping pay-test.61info.cn

正在 Ping pay-test.61info.cn [172.16.51.12] 具有 32 字节的数据:

proxy: { // 代理
  "/api/": {
      // target: 'http://pay-test.61info.cn',
      target: 'http://172.16.51.12',
      changeOrigin: true,
      pathRewrite: {
          "^/api": ""
      }
  }
}
```

4. 通过finddle，手机代理到本地电脑。在微信环境下打开pay-test.61info.cn/xxx，本地测试微信支付 (未验证)

### 支付宝中转页
微信环境下如何调起支付宝？

浏览器下，可通过浏览跳转直接唤起支付宝；微信环境下，无法唤起支付宝，需加让用户用浏览器打开中转页链接，中转页再唤起支付宝。

### 业务H5接入
业务H5如何快速接入支付中心？

1. H5环境。调接口获取支付中心的链接，注意要传支付成功后回跳的<code>returnUrl</code>参数，一般是当前点击去支付的页面。location.href = 'xxx'跳到支付中心即可。
```js
<div @click="toPay" class="toPay" v-if="recordData.applyState === 0">去支付</div>

toPay() {
  getPayUrl({
    applyId: this.recordData.applyId,
    returnUrl: window.location.origin + window.location.pathname + '/#admissionTicket'
  }).then(res => {
    if (this.isWeiXin) {
      window.location.href = res.data['WECHAT-H5']
    } else {
      window.location.href = res.data['OUTTER-H5']
    }
  })
}
```
2. APP环境。问了客户端的同事，支付中心H5要想在hll app唤起支付，目前需要满足两个条件：
* 安卓机器
* hll app 版本大于50300

目前的处理方法是：不同时满足上面两个条件的，用浏览器打开H5
```js
if ((this.isHllApp && browser.versions.ios) || 
  (this.isHllApp && JSON.parse(this.$route.query.hllUserInfo) && JSON.parse(this.$route.query.hllUserInfo).versionCode < 50300)) {
  AppH5JSSDK.openUrl(window.location.href)
  AppH5JSSDK.closeWeb()
}
```

### app环境支持
app内的支付流程和H5一样，业务H5 --> 支付中心 --> 业务H5回调页。
:::tip
APP也可以接入原生的[APP支付](https://pay.weixin.qq.com/wiki/doc/api/app/app.php?chapter=8_1)方式，了解到：苹果多种第三方支付有限制、抽成也高。因此APP内是借助支付中心H5走[JSAPI支付](https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=7_1)
:::


## 总结
线下支付，后台上传支付截图的方式给导致教师效率不高，希望支付中心能支持多种支付方式，并对业务H5快速支撑。我负责支付H5的微信支付，支付宝支付，银行卡支付的页面H5开发以及支付对接。通过引导用户浏览器打开中转页的方式解决微信下无法唤起支付宝的问题，通过业务H5 -> 支付中心 -> 支付成功 -> 业务H5 的方式，实现业务H5快速接入支付。


<style scoped>
img {
  max-width: 100%!important;
}
</style>

参考：
[微信支付](https://pay.weixin.qq.com/wiki/doc/api/index.html)

[申请开通微信支付教程](https://blog.csdn.net/zheng2780071070/article/details/114087468)

[常见错误](https://pay.weixin.qq.com/wiki/doc/api/H5.php?chapter=15_4)

[支付宝支付](https://opendocs.alipay.com/open/203/105285)

[家长支付常见问题](https://wiki.61info.cn/pages/viewpage.action?pageId=9505153)

[支付常见问题指引](https://wiki.61info.cn/pages/viewpage.action?pageId=44270784)