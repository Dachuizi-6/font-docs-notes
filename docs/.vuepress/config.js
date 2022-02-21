const path = require('path')
const fs = require('fs')

// const importPlugins = (dirPath, filePath) => {
//   return fs
//   .readdirSync(path.resolve(__dirname, dirPath))
//   .map(filename => filePath + filename.slice(0, -3))
//   .sort()
// }



module.exports = {
  base: '/font-docs-notes/',
  title: 'Zohnny前端小册',
  description: 'Zohnny前端小册',
  themeConfig: {
    repo: 'https://github.com/Dachuizi-6',
    // editLinks: true,
    // sidebarDepth: 4,
    displayAllHeaders: true,
    // activeHeaderLinks: true,
    lastUpdated: 'Last Updated',
    nav: [
      {
        text: '首页',
        link: '/'
      },
      {
        text: '基础',
        link: '/basic/basic/'
      },
      {
        text: 'css',
        link: '/css/'
      },
      {
        text: '浏览器相关',
        link: '/browser/theory/'
      },
      {
        text: 'nodejs',
        link: '/nodejs/'
      },
      {
        text: 'babel',
        link: '/babel/'
      },
      {
        text: '打包工具',
        link: '/buildTools/webpack/'
      },
      {
        text: 'Vue',
        items: [
          {
            text: '响应式',
            link: '/vue/reactive/'
          },
          {
            text: '模版编译',
            link: '/vue/compiler/'
          },
          {
            text: '虚拟DOM',
            link: '/vue/vnode/'
          },
          {
            text: '整体流程',
            link: '/vue/whole-process/'
          },
          {
            text: 'Vuex&Vue-router',
            link: '/vue/vuex/'
          }
        ]
      },
      {
        text: '移动端',
        link: '/mobile/'
      },
      {
        text: 'LC',
        link: '/code-reviews/'
      },
      {
        text: '项目',
        link: '/project/B/batch_download'
      },
      {
        text: '前沿',
        link: '/news/vue3'
      },
      {
        text: '工具',
        items: [
          {
            text: '公共函数库',
            target:'_blank',
            link: 'https://0zcl.github.io/utils-library/'
          },
          {
            text: 'h5-sdk',
            target:'_blank',
            link: 'https://0zcl.github.io/h5-sdk/'
          },
          {
            text: '移动端多页面模版',
            target:'_blank',
            link: 'https://github.com/0zcl/h5_template'
          },
          {
            text: '移动端组件库',
            target:'_blank',
            link: 'https://github.com/0zcl/zcl-mobile-ui'
          },
          {
            text: 'zcl脚手架',
            target:'_blank',
            link: 'http://gitlab.61info.com:8190/zcl/tpc-cli'
          }
        ]
      }
    ],
    sidebar: {
      '/basic/': [
        {
          title: '基础',
          collapsable: true,
          children: [
            ['basic/interview', '基础题'],
            ['basic/', '0.1+0.2等于0.3吗']
          ]
        },
        {
          title: '手写代码',
          collapsable: true,
          children: [
            ['code_write/', '手写类型转换'],
            ['code_write/accumulation', '手写累加/累乘函数'],
            ['code_write/new', '手写new'],
            ['code_write/copy', '手写深拷贝'],
            ['code_write/create', '手写Object.create'],
            ['code_write/inherit', '手写继承'],
            ['code_write/extends', '手写extends'],
            ['code_write/instanceof', '手写instanceof'],
            ['code_write/call&apply&bind', '手写call、apply、bind'],
            ['code_write/jsonp', '手写jsonp'],
            ['code_write/getQueryString', '手写getQueryString'],
            ['code_write/setInterval', '手写setInterval'],
            ['code_write/debounce&throttle', '手写防抖与节流'],
            ['code_write/for_of', '手写对象属性值迭代器'],
            ['code_write/event_delegation', '手写事件委托'],
            ['code_write/lazyLoad', '手写图片懒加载'],
            ['code_write/ajax', '手写原生Ajax请求'],
            ['code_write/aop', '手写AOP装饰函数'],
            ['code_write/curry', '手写柯里函数'],
            ['code_write/timeChunk', '手写分时函数'],
            ['code_write/flat', '手写数组扁平化flat'],
            ['code_write/repeat', '手写数组去重'],
            ['code_write/eventEmit', '手写eventEmit类'],
            ['code_write/reactive', '手写Vue数据响应式'],
            ['code_write/nextTick', '手写Vue nextTick'],
            ['code_write/promise', '手写Promise']
          ]
        },
        {
          title: 'JS底层深入',
          collapsable: true,
          children: [
            ['js/', 'JS底层']
          ]
        },
      ],
      '/css/': [
        {
          title: 'CSS高频面试题',
          collapsable: false,
          sidebarDepth: 3,
          children: [
            ['', '盒子模型'],
            ['center', '水平垂直居中'],
            ['triangle', '画三角形'],
            'bfc',
            ['layout', '三栏布局'],
            ['interview', '面试']
          ]
        }
      ],
      '/browser/': [
        {
          title: '浏览器工作原理与实践',
          collapsable: true,
          children: [
            ['theory/', '原理']
          ]
        },
        {
          title: '浏览器',
          collapsable: true,
          children: [
            ['browser/jsonp', 'JSONP'],
            ['browser/url', 'URL输入到返回请求的过程'],
            ['browser/cache', '浏览器缓存'],
            ['browser/composite', '层合成'],
            ['browser/event', '事件机制/模型'],
            ['browser/cors', '跨域']
          ]
        },
        {
          title: 'HTTP',
          collapsable: true,
          children: [
            ['http/', '一个数据包在网络中的心路历程'],
            ['http/http', 'http相关'],
            ['http/https', 'https']
          ]
        },
        {
          title: '网络安全',
          collapsable: true,
          children: [
            ['security/', '摘要'],
            ['security/sandbox', '安全沙箱']
          ]
        }
      ],
      '/nodejs/': [
        {
          title: 'Nodejs',
          collapsable: false,
          sidebarDepth: 3,
          children: [
            ['', 'glob'],
            ['module', '模块化机制'],
            ['eventLoop', '事件循环'],
            ['koa', 'KOA2框架原理'],
            ['child_process', 'Node子进程'],
            ['cluster', 'cluster原理(了解)']
          ]
        }
      ],
      '/babel/': [
        {
          title: 'Babel',
          collapsable: false,
          sidebarDepth: 3,
          children: [
            ['', '摘要'],
            ['Babel_VS_Ts', 'Babel与Ts'],
            ['uglify', '代码压缩原理'],
            ['plugin', 'Babel原理']
          ]
        }
      ],
      '/buildTools/': [
        {
          title: 'webpack基础',
          collapsable: true,
          children: [
            ['webpack/', '基础'],
            ['webpack/module_chunk_bundle', 'module_chunk_bundle'],
            ['webpack/hash', '文件指纹'],
            ['webpack/postcss', 'postcss']
          ]
        },
        {
          title: 'webpack深入',
          collapsable: true,
          children: [
            ['webpack/source', '源码深入'],
            ['webpack/zcl-pack', '手写简易webpack'],
            ['webpack/loader', 'webpack-loader机制'],
            ['webpack/plugin', 'webpack-插件机制'],
            ['webpack/__webpack_require__', 'webpack 模块加载原理'],
            ['webpack/lazy-load', '懒加载(未完全理解)'],
            ['webpack/HMR', '热更新原理'],
            ['webpack/proxy', 'webpack proxy原理']
          ]
        },
        {
          title: '杂',
          collapsable: true,
          children: [
            ['other/error', 'source map深入'],
            ['other/ci&cd', 'CI/CD'],
            ['other/design', '设计模式'],
            ['other/performance', '性能优化(整理中)']
          ]
        }
      ],
      '/vue/reactive/': [
        {
          title: '响应式',
          collapsable: false,
          children: [
            {
              title: '响应式',
              path: '/vue/reactive/',
              children: [
                ['', 'MVVM概念'],
                'reactive',
                ['nextTick', 'nextTick原理'],
                ['watch', 'watch原理'],
                ['computed', 'computed原理'],
                ['interview', '面试']
              ]
            }
          ]
        }
      ],
      '/vue/compiler/': [
        {
          title: '模版编译',
          collapsable: false,
          children: [
            {
              title: '模版编译',
              path: '/vue/compiler/',
              children: [
                '',
                ['slot', '插槽'],
                ['keep-alive', 'keep-alive']
              ]
            }
          ]
        }
      ],
      '/vue/vnode/': [
        {
          title: '虚拟DOM',
          collapsable: false,
          children: [
            {
              title: '虚拟DOM',
              path: '/vue/vnode/',
              children: [
                '',
                ['diff', 'diff算法'],
                ['ssr', 'SSR']
              ]
            }
          ]
        }
      ],
      '/vue/whole-process/': [
        {
          title: '整体流程',
          collapsable: false,
          children: [
            {
              title: '整体流程',
              path: '/vue/whole-process/',
              children: [
                ['', '生命周期'],
                ['use', '插件注册'],
                ['mixin', '混入'],
                ['filter', '过滤器'],
                ['directive', '自定义指令']
              ]
            }
          ]
        }
      ],
      '/vue/vuex/': [
        {
          title: 'vuex&vue-router',
          path: '/vue/vuex/',
          children: [
            ['', 'Vuex'],
            ['vue-router', 'vue-router']
            // {
            //   path: '/vue/vuex/',
            //   children: [
            //     ['', 'Vuex'],
            //     ['vue-router', 'vue-router']
            //   ]
            // }
          ]
        }
      ],
      '/mobile/': [
        {
          title: '移动端',
          collapsable: false,
          sidebarDepth: 3,
          children: [
            ['', 'rem原理'],
            ['adaptation', '移动端适配']
          ]
        }
      ],
      '/code-reviews/': [
        {
          title: '算法',
          collapsable: false,
          sidebarDepth: 3,
          children: [
            ['', 'leetcode'],
            ['sort', '排序'],
            ['lc', 'LC(整理中)'],
          ]
        }
      ],
      '/project/': [
        {
          title: 'B端',
          collapsable: true,
          children: [
            ['B/batch_download', '批量下载图片'],
            ['B/hll-compoments', '业务组件库'],
            ['B/common-utils', '公共组件库'],
            ['B/sso-login', '单点登录'],
            ['B/common-web-system', '微前端系统']
          ]
        },
        {
          title: '移动端H5',
          collapsable: true,
          children: [
            ['H5/common-login-h5', '统一登陆'],
            ['H5/h5-sdk', 'h5-sdk'],
            ['H5/h5-template', 'vue移动端多页面'],
            ['H5/mobile-ui', '移动端UI组件库'],
            ['H5/pay-center', '支付中心']
          ]
        },
        {
          title: '工具',
          collapsable: true,
          children: [
            ['tools/util-library', '公共函数库'],
            ['tools/zcl-cli', 'cli脚手架工具']
          ]
        }
      ],
      '/news/': [
        {
          title: '前沿',
          collapsable: false,
          sidebarDepth: 3,
          children: [
            ['vue3', 'vue3'],
            ['vite', 'vite'],
            ['ts', 'typescript']
            // ['', 'Introduction'],
            // 'binaryTree'
          ]
        }
      ]
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@assets': path.resolve(__dirname, 'public/assets')
      }
    }
  },
  plugins: [
    '@vuepress/active-header-links',
    '@vuepress/back-to-top',
    ["md-enhance", {
      sub: true,
      sup: true,
    }],
    ['@vuepress/search', {
      searchMaxSuggestions: 10
    }]
  ]
}