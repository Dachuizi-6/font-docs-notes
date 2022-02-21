## 用法
vue中的过滤器可以用在两个地方：双花括号插值和 v-bind 表达式
```js
<!-- 在双花括号中 -->
{{ message | capitalize }}

<!-- 在 `v-bind` 中 -->
<div v-bind:id="rawId | formatId"></div>
```

* 定义组件filter
```js
filters: {
  toUpper: function (value) {
    if (!value) return ''
    return value.toUpperCase()
  }
}
```
* 定义全局filter
```js
Vue.filter('toUpper', function (value) {
  if (!value) return ''
  return value.toUpperCase()
})
new Vue({
  // ...
})
```
* 串联filter
```js
// message作为参数传入filterA函数， filterA执行结果 作为参数传入 filterB函数
{{ message | filterA | filterB }}
```

## 全局filters
```js
Vue.filter('toUpper', function (value) {
  if (!value) return ''
  return value.toUpperCase()
})
```
<strong>全局过滤器 实际上会过滤器函数名为key，过滤器函数为value，放入<code>Vue.options['filters']</code>对象中</strong>

```js
var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];
function initGlobalAPI (Vue) {
  // ...
  initAssetRegisters(Vue);
}
function initAssetRegisters (Vue) {
  ASSET_TYPES.forEach(function (type) {
    Vue[type] = function (
      id,
      definition
    ) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if ( type === 'component') {
          validateComponentName(id);
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id;
          definition = this.options._base.extend(definition);
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition };
        }
        // 把全局注册的filter函数存入 Vue.options.filters对象中
        this.options[type + 's'][id] = definition;
        return definition
      }
    };
  });
}
```
## 组件filters
```js
{{ message | capitalize }}
// 编译后变成: _s(_f("capitalize")(message))
{{ message | filterA | filterB }}
// 编译后变成: _s(_f("filterB")(_f("filterA")(message)))
```
* _f 是 <code>resolveFilter</code> 函数的别名，作用是找到对应的过滤器函数并返回
resolveFilter是如何找到过滤器函数的，下面来分析下
```js
export function resolveFilter(id){
  return resolveAsset(this.$options, 'filters', id, true) || identity
}
// type: filters, id: 过滤器函数名
function resolveAsset (
  options,
  type,
  id,
  warnMissing
) {
  if (typeof id !== 'string') {
    return
  }
  // assets 存放过滤器对象
  var assets = options[type];
  // 若assets对象存在 id 的 key
  if (hasOwn(assets, id)) { return assets[id] }
  // 驼峰化
  var camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
  // 首字母大写后的
  var PascalCaseId = capitalize(camelizedId);
  if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
  // //检查原型链: fallback to prototype chain
  var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
  if ( warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    );
  }
  return res
}
```
* 判断过滤器id是否为字符串，不是则终止
* 用assets对象存储过滤器
* hasOwn函数检查assets自身是否存在id属性，存在则返回
* hasOwn函数检查assets自身是否存在驼峰化后的id属性，存在则返回
* hasOwn函数检查assets自身是否存在将首字母大写后的id属性，存在则返回
* 如果还是没有，就是去原型链找，找不到就会打印警告

### 去原型链找是啥意思？为什么访问属性也能访问到全局注册的 过滤器？

因为在初始化Vue实例时，把全局过滤器内注册的过滤器合并到this.$ooptions.filters中，this.$options.filters保存了组件内注册的过滤器，也保存了全局过滤器(通过__proto__)
```js
function extend (to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to
}

function mergeAssets (
  parentVal, // 父组件options.filters
  childVal, // 子组件options.filters
  vm,
  key
) {
  // { __proto__: 父组件options.filters }
  var res = Object.create(parentVal || null);
  if (childVal) {
      assertObjectType(key, childVal, vm);
    return extend(res, childVal)
  } else {
    /*
      {
        子组件options.filters
          __proto__: 父组件options.filters
      }
    */
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});
```





## 面试
问： Vue 过滤器filter原理

答：
在编译阶段把过滤器编译成函数调用的形式，串联的过滤器编译后是一个嵌套的函数调用，即前一个过滤器函数执行的结果是后一个过滤器函数的参数。编译后是 <code>_s(_f('过滤器名')('参数'))</code>

* _f 是 resolveFilter函数的别名，作用是找到对应的过滤器函数并返回
* _s 是 toString函数的别名，作用是拿到过滤之后的结果并传递给toString()函数，结果会保存到VNode中的text属性

问：resolveFilter 函数如何找到 对应的过滤器？

答：
resolveFilter 传入参数为id, 即过滤器函数名
1. 判断过滤器id是否为字符串，不是则终止
2. 用assets对象存储过滤器 this.$options.filters
3. 检查assets自身是否存在id属性，存在则返回
4. 将id参数驼峰化后再检查是否存在，存在则返回
5. 将id参数首字母大写后再检查是否存在，存在则返回
6. 最后 通过访问assets[id],去原型链找

问： 去原型链找是啥意思？为什么访问属性也能访问到全局注册的 过滤器？

答：
* 注册全局过滤器会把过滤器放入Vue.options['filters']对象中
* 在初始化Vue实例时，把全局过滤器内注册的过滤器合并到this.$ooptions.filters中
this.$options.filters保存了组件内注册的过滤器，也保存了全局过滤器(通过__proto__)



