1. 全量发布：当点击发布之后，所有用户访问程序时都会使用当前最新的发布版本
2. 灰度发布：按照一定策略选取部分用户，让他们先行使用最新版本
* app可以指定部分学员使用新版本；b端可以使用多结点，灰度发布时，只发一个结点。
![app](@assets/webpack/34.png)

1. CI: Continuous Integration，持续集成
2. CD: Continuous Delivery，持续交付


项目中使用：
1. webhook：git的<code>webhook</code>可以监听项目的push, merge等事件。当触发事件时，会给webhook的URL发送一个POST请求
2. jenkins：收到post请求，触发jenkins自动构建。（jenkins生成Secret token，需要填在git的webhook)
3. [钉钉机器人](https://developers.dingtalk.com/document/robots/customize-robot-security-settings)：创建机器人后，生成的链接带有access token，jenkins配置钉钉配置器，填入access token

也可以webhook填脚本的url，触发事件时，发post请发到脚本服务，脚本服务再向钉钉群发消息、启动jenkins构建

[travis](https://app.travis-ci.com/dashboard): 一旦激活了一个仓库，Travis 会监听这个仓库的变化。一旦代码仓库有新的 Commit，Travis 就会去找这个<code>.travis.yml</code>，执行里面的命令