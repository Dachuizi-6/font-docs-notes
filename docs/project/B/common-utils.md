## 场景
提供多个项目通用的组件。前面已经搭好[业务组件库](./hll-compoments.md)，供业务团队内部使用，解决了一个团队内部组件重复开发问题。但无法解决多个团队开发时，部分代码重复开发。为了解决多个团队开发时，部分代码重复开发，把多个项目通用的组件抽离到公共组件库。

## 实现
![common-utils](@assets/project/22.png)

如上图，封装了5个公共组件。当然不是只能封装组件，也可以封装公共的组件逻辑处理函数。
```js
// main.js抛出
export {
  BaseDialog,
  BaseList,
  svgIcon,
  createAxios,
  pagination,
}
```
下面挑几个有意思的点来聊一下
1. baseList：筛选条件与url参数同步
2. dialog: validate校验封装
3. axios: 全局loading

## baseList
* 筛选条件与url参数同步
1. 在初始化阶段，把url参数 --同步--> 筛选参数
```js
this.defaultParams = JSON.parse(JSON.stringify(this.params))
this.pageInfo = {
  [this.pageSettings.pageName]: 1,
  [this.pageSettings.sizeName]: 10,
  total: 0,
}

setParams() {
  const params = {
    ...this.$route.query,
  }
  Object.keys(this.params).map(key => {
    const str = params[key]
    let val = this.defaultParams[key]
    this.params[key] = val
  })
  Object.keys(this.pageInfo).map(key => {
    if (params[key]) this.pageInfo[key] = parseInt(params[key])
  })
  // this.afterSetHashParams && this.afterSetHashParams(params)
}
```
2. 查询请求成功后，把筛选参数 --同步--> url参数
```js
strObjParams(params) {
  const obj = {}
  for (const key in params) {
    if (typeof params[key] === 'object') {
      obj[key] = JSON.stringify(params[key])
    } else {
      obj[key] = params[key]
    }
  }
  return obj
},
// 如果筛选条件发生变化则更新到url参数上
changeRoute() {
  if (!this.hashParams) return
  const path = this.$route.path
  const pageNum = this.pageInfo[this.pageSettings.pageName]
  const pageSize = this.pageInfo[this.pageSettings.sizeName]
  const query = Object.assign(
    {},
    this.$route.query,
    {
      [this.pageSettings.pageName]: pageNum,
      [this.pageSettings.sizeName]: pageSize,
    },
    this.strObjParams(this.params),
  )
  // 相同地址相同参数replace会报错
  if (this.isSameQuery(query, this.$route.query)) return
  this.$router.replace({
    path: path,
    query,
  })
}
```

## baseDialog
* validate校验封装。在<code>el-form</code>+<code>rules</code>的校验基础上，抛出<code>doValidate</code>，做其它额外的校验。抛出<code>doSubmitForm</code>，当校验通过时，执行<code>doSubmitForm</code>提交表单
```js
async submitForm() {
  // 使用自带表单校验
  const formValidateRes = await this.$refs.form.validate().then(() => true, () => false)
  if (!formValidateRes) return Promise.reject()
  // 使用用户自定义校验规则
  const userValidate = this.doValidate ? this.doValidate() : true
  let userValidateRes
  if (typeof userValidate !== 'boolean' && typeof userValidate.then === 'function') {
    userValidateRes = await userValidate.then(() => true, () => false)
  } else {
    userValidateRes = userValidate
  }
  if (!userValidateRes) return Promise.reject()
  // 提交表单
  return this.doSubmitForm && this.doSubmitForm()
}
```
<code>doValidate</code>可以是返回boolean的函数；也可以是返回promise的函数

## axios
axios基本使用方式主要有:
* axios(config)
* axios.method(url, data , config)
```js
axios.post('/postAxios', {
  name: 'zcl'
}).then(res => {
  console.log('postAxios 成功响应', res);
})

axios({
  method: 'post',
  url: '/getAxios'
}).then(res => {
  console.log('getAxios 成功响应', res);
})
```
## 1. axios源码浅析
```js
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  // 返回的是一个request函数，并且上下文指向context
  var instance = bind(Axios.prototype.request, context);

  // 复制属性到实例instance。Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };
  // 返回实例
  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

module.exports = axios;

// 允许在ts中使用默认导出
module.exports.default = axios;
```
问：为什么 axios 既可以当函数调用，也可以当对象使用，比如<code>axios({})</code>、<code>axios.get</code>

答：axios本质是函数，由于Axios.prototype的属性赋值给axios实例对象，所以<code>axios.get</code>可被调用。最终调用的还是<code>Axios.prototype.request</code>函数

```js
Axios.prototype.request = function request(config) {
  // ......
  config = mergeConfig(this.defaults, config);
  // ......

  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  var chain = [dispatchRequest, undefined];

  Array.prototype.unshift.apply(chain, requestInterceptorChain);
  chain = chain.concat(responseInterceptorChain);

  promise = Promise.resolve(config);
  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
  // ......
}
```
<img src="@assets/project/23.png" style="max-width: 100%!important">

巧用promise链式调用：声明一个数组<code>chain</code>和一个<code>promise</code>。 (以奇数1开始算)数组奇数放置成功拦截器，偶数元素放置失败拦截器。通过 then 给 promise对象 注册回调，并通过一个 while 循环分别两两出列数组元素，奇数放到 then 成功回调，偶数放到 then 失败回调。

问：说说 axios 调用流程？

答：
实际是调用的Axios.prototype.request方法，用数组两两存放成功和失败拦截器，循环数组，两两出列数组元素，奇数放到then成功回调，偶数放到then失败回调。执行promise链式调用，实际请求是在<code>dispatchRequest</code>执行的.

问：为什么支持浏览器中发送请求也支持node发送请求？

答：
axios.defaults.adapter默认配置中根据环境判断是浏览器还是node环境，使用对应的适配器。浏览器下使用<code>XMLHttpRequest</code>，node下使用node.js的<code>http</code>模块。
```js
// axios/lib/defaults.js
var adapter;
if (typeof XMLHttpRequest !== 'undefined') {
  // For browsers use XHR adapter
  adapter = require('./adapters/xhr');
} else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
  // For node use HTTP adapter
  adapter = require('./adapters/http');
}
```

## 2. loading封装
方案一：在全局组件Layout.vue中加入写好的<code>loading</code>组件，发请求前将<code>myLoadingStatus</code>设为<code>true</code>，请求后设为false
```js
// main.js
Vue.prototype.showGlobalLoading = () => {
  store.dispatch('changeMyloadingState', true)
}
Vue.prototype.hideGlobalLoading = () => {
  store.dispatch('changeMyloadingState', false)
}

// store.js
const myLoading = {
  state: {
    myLoadingStatus: false
  },
  mutations: {
    TO_CHANGE: (state, status) => {
      state.myLoadingStatus = status
    }
  },
  actions: {
    changeMyloadingState({ commit }, status) {
      commit('TO_CHANGE', status)
    }
  }
}

// Layout.vue
<my-Loading :loadingStatus="myLoadingStatus"></my-Loading>
```
旧项目在使用。目前不建议使用这种方案。原因：
1. 代码冗余：每次写请求时都要添加showGlobalLoading，请求后hideGlobalLoading。这些重复的代码。
2. 不统一：总有人会漏写hideGlobalLoading。当请求超时挂了，页面就一直loading。而且要给老代码加上这个loading方案，那也是重复劳动
3. A, B并行发起请求, 页面loading，A请求失败，B仍在请求中，此时由于A请求失败，会把loading关闭。但实际上B仍在请求中，loading不应该关闭
```js
this.showGlobalLoading()
listById({ id: this.$route.query.tableId }).then(res => {
  // ...
}).finally(e => {
  this.hideGlobalLoading()
})
```

方案二：单独把loading配置独立管理
showLoading时，计数count++，当count===0时，以服务的方式生成 Loading 实例；hideLoading时，计数count--，当count===0时，关闭 Loading；
```js
import { Loading } from '@i61/element-ui'

let loadingInstance = null;
let loadingCounter = 0;

function showLoading() {
  if (loadingInstance == null) {
    setTimeout(() => {
      if (loadingCounter !== 0) {
        loadingInstance = Loading.service({
          fullscreen: true,
          background: 'rgba(0, 0, 0, 0.3)',
        });
      }
    }, 300);
  }
  loadingCounter++;
}

function hideLoading() {
  loadingCounter--;
  if (loadingCounter === 0) {
    if (loadingInstance) {
      loadingInstance.close();
      loadingInstance = null;
    }
  }
}
```

3. axios实例抛出
```js
// axios/createAxios.js
const defaultOptions = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
  }
}

export default function createAxios(conf = {}) {
  const service = axios.create(Object.assign({}, defaultOptions, conf))
  // request拦截器
  service.interceptors.request.use(
    config => {
      if (store.getters.accessToken) {
        // 让每个请求携带自定义token 请根据实际情况自行修改
        config.headers['Authorization'] = store.getters.accessToken 
      }
      if (config.headers['X-hide-loading'] !== true) {
        showLoading();
      }
      return config
    }, 
    error => {
      console.log('error：' + error) // for debug
      Promise.reject(error)
    }
  )

  // respone拦截器
  service.interceptors.response.use(
    response => {
      if (response.config.headers['X-hide-loading'] !== true) {
        hideLoading();
      }
      // 非正常请求
      if (response.data.code && ![0, 200].includes(response.data.code)) {
        switch (response.data.code) {
          case 20001:
            Message.error('服务器异常')
            break
          case 20011:
            Message.error('输入参数有误')
            break
          case 20012:
            Message.error('文件后缀丢失')
            break
          case 20013:
            Message.error('不允许上传的文件类型')
            break
          case 20014:
            Message.error('文件大小超出限制')
            break
          case 20015:
            Message.error('不支持压缩')
            break
          default:
            try {
              if (response.data && !response.config.hideErrorMsg) {
                // hideErrorMsg则不显示错误提示
                Message.error(response.data.msg || response.data.detail || response.data.data || response.data.tips || response.data.error || '系统数据有误，请截图派单处理（500）')
              }
            } catch (e) {
              console.log(e)
            }
        }
      }
      return response.data
    },
    error => {
      hideLoading();
      const errorString = error.toString()
      var reg = /timeout/
      if (error.response.status && error.response.status === 502) {
        Message({
          message: '系统正在发版，请稍候重试（502）',
          type: 'error',
          duration: 5 * 1000
        })
      } else if (error.response.status && error.response.status === 500) {
        Message({
          message: '系统数据有误，请截图派单处理（500）',
          type: 'error',
          duration: 5 * 1000
        })
      } else if (error.response.status && error.response.status === 401) {
        Message({
          message: '登录过期，即将跳转至统一登录界面',
          type: 'error',
          duration: 5 * 1000
        })
        setTimeout(() => {
          window.location.href = process.env.OA_LOGIN_URL
        }, 3000)
      } else if (error.response.status && error.response.status === 403) {
        Message({
          message: '接口无权限，请联系管理员',
          type: 'error',
          duration: 5 * 1000
        })
      } else if (error.response.status && error.response.status === 404) {
        Message({
          message: '请求资源不存在！请截图派单处理（404）',
          type: 'error',
          duration: 5 * 1000
        })
      } else if (error.response.status && error.response.status === 510) {
        router.push('/cms/register')
        return
      } else if (error.response.status && error.response.status === 511) {
        Message.closeAll()
        Message({
          message: '账号已被禁用',
          type: 'error',
          duration: 5 * 1000
        })
        setTimeout(() => { window.location.href = process.env.OA_LOGIN_URL }, 2000)
        return
      } else if (reg.test(errorString)) {
        Message({
          message: '请求超时！！请刷新页面！！',
          type: 'error',
          duration: 5 * 1000
        })
      } else {
        Message({
          message: `服务器错误！请截图派单处理（${error.response.status}）`,
          type: 'error',
          duration: 5 * 1000
        })
      }
      return Promise.reject(error)
    }
  )
  return service
}
```
不同的业务，对应不同的axios实例。
:::tip
注意下面的<code>createAxios</code>实例是axios实例，也就是Axios.prototype.request。源码里会把createAxios所带的配置参数config和默认配置参数defaults做合并，<code>config = mergeConfig(this.defaults, config)</code>
:::
```js
// axios/index.js
import createAxios from './createAxios'

// hll-activity
export const activityRequest = createAxios({
  baseURL: process.env.OA_BASE_AXIOS_API + '/hll-activity'
})

// hll-activity服务
export const axiosAudit = createAxios({
  baseURL: process.env.OA_BASE_AXIOS_API + '/hll-activity/o/activity/task'
})
```

## 总结
开发不同的项目时，项目间出现部分代码重复开发。作为前端开发，参与组件库开发。通过把项目通用的组件抽离到公共组件库，提高了开发效率，减少项目维护成本。