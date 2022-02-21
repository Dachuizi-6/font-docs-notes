## 场景
![h5](@assets/project/24.png)

最初的做法是把每个h5项目统一放在<code>draw-course-ativity-H5</code>，但随着团队接的H5越来越多，draw-course-ativity-H5目录下的项目变多，每个H5都有<code>node_modules</code>下有大量的包，导致vscode卡顿！多个H5的包版本难以同步维护！使用<code>vue</code>+<code>webpack</code>搭建多页面H5，提高了H5开发效率，统一维护package。

vue2已升级到vue3

## 代码
不讲，见源码：[h5-template](https://github.com/0zcl/h5_template)