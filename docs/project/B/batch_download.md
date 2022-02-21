:::tip
STAR：Situation（情景），Task（任务），Action（行动）和 Result（结果）

XXX 项目出现 XXX 问题，我作为 XXX，负责其中的 XXX 部分，我通过 XXX 方式（或技术方案）成功解决了该问题，使 XXX 提高了 XXX，XXX 增长了 XXX

在项目经历描述中，通过交代清楚你在团队中的位置，以及大略描述你在团队中起到的作用
:::

## 需求场景
班主任制作海报再分享给家长的过程中，需要手动选画作，而制作一张海报需3-5分钟，导致效率、分享意愿不高问题。希望去除需选画作的步骤，系统以近三个月老师点评得分最高（如得分相同则随机挑选）的画作为默认画作。实现自动挑选画作并生成海报。

![poster](@assets/project/1.png)

## 任务
作为前端开发，独立负责海报下载功能开发。并需要将批量下载功能封装到业务组件库中。

## 实现
1. 后端实现。在做批量下载功能时，一般是让后端去实现。前端直接调个接口即可。批量下载邀请卡就是这样做的。
```js
// src/api/teach/studentList.js
export function batchDownloadCard(data) {
  return hllUcRequest({
    headers: {
      'Content-type': 'application/json;charset=UTF-8'
    },
    url: '/transfer/poster/batch/qrcode',
    method: 'post',
    responseType: 'blob',
    timeout: 1000 * 60 * 10,
    data
  })
}
```
[responseType](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data)属性设置为“blob”，将二进制文件读取为Blob类型的数据。再利用Blob对象创建指定压缩包并下载即可。
```js
batchDownload() {
  this.batchDownloadLoading = true
  batchDownloadCard(sendData).then(res => {
    var reader = new FileReader()
    const today = moment(new Date()).format('MM-DD')
    reader.onload = e => {
      try {
        var msg = JSON.parse(e.target.result)
      } catch (error) {
        return this.downLoadFn(res, `${today}批量下载邀请卡.zip`)
      } finally {
        this.batchDownloadLoading = false
      }
      // 错误提示
      if (msg.hasOwnProperty('code')) {
        return this.$message.error(msg.msg)
      }
    }
    reader.readAsText(res)
  }).finally(e => {
    this.batchDownloadLoading_1 = false
  })
}

downLoadFn(data, filename) {
  const b = new Blob([data])
  const url = URL.createObjectURL(b)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}
```
2. 前端实现。下载邀请卡后端实现了，但下载画作邀请卡后端以”之前是前端实现的“以及”后端实现有性能问题“，就把锅甩给我。说干就干
* 把旧的代码抽离到组件
* 优化并删掉一些旧的lj代码
* 前端实现批量下载功能。下面只讲这一点
海报生成使用<code>html2canvas</code>, 压缩包生成使用<code>jszip + file-saver</code>
```js
import html2canvas from 'html2canvas'
import moment from 'moment'
import JSZip from 'jszip/dist/jszip'
import FileSaver from 'file-saver'

methods: {
  async batchDownload(data) {
    this.userIds = data.userIds
    this.rbkdImgUrl = IMG2_61INFO_URL_OBJ[localStorage.getItem('studentRecordEnv') || 'PROD']
    if (this.userIds && this.userIds.length) {
      try {
        const failMessage = await this.getInfo()
        await this.renderPoster()
        if (failMessage) {
          this.errorMsgList = failMessage.split(';')
          this.dialogVisible = true
        }
      }
      finally {
        this.$emit('loadEnd')
      }

    } else {
      this.$message.error('传入的学员ID有问题, 请联系管理员~')
    }
  },
  // 获取批量信息
  getInfo() {
    return new Promise((resolve, reject) => {
      getBatchInfo({ userIds: this.userIds }).then(res => {
        if ([0, 200].includes(res.code)) {
          this.batchInfo = res.data
          res.data.failMessage ? resolve(res.data.failMessage) : resolve()
        }
        reject('批量获取学员数据失败', res.msg)
      })
    })
  },
}
```
学员海报图片如下：

<img src="@assets/project/2.png" style="width: 400px;display: block; margin: 0 auto" />

batchDownload() 先调getInfo()获取批量信息；再执行renderPoster()。renderPoster是核心。
1. 获取生成海报所需的图片URL。画作图，海报背景图，用户头像图，二维码图
2. 加载图片。使用Promise.all确定图片都加载完成才执行下一步。也保证了执行html2canvas生成图片前，海报DOM渲染完毕
3. DOM --> 图片 --> base64。

```js
async renderPoster() {
  const jsZip = new JSZip()
  for (let i = 0, len = this.batchInfo.paintContentCreateInfoVOS.length; i < len; i++) {
    // 1-画作图
    this.currentPaintUrl = this.ossImgUrl + paintContentCreateInfoVOS.noFrameImgUrl
    // 2-海报背景图
    this.currentPosterUrl = this.rbkdImgUrl + this.currentPaintParams.materialPicUrl
    // 3-用户头像图
    this.currentHeadUrl = paintContentCreateInfoVOS.headUrl ? `data:image/png;base64,${paintContentCreateInfoVOS.headUrl}` : ''
    try {
      await Promise.all([
        this.loadImage(this.currentPosterUrl),
        this.currentHeadUrl ? this.loadImage(this.currentHeadUrl) : Promise.resolve(),
        this.loadImage(this.currentQrcodeUrl) // 4-二维码图
      ])
    } catch (error) {
      continue
    }
    // 下载相关的信息
    const downloadInfo = this.getDownloadInfo({
      userId,
      userName: paintContentCreateInfoVOS.userName,
      posterName: paintContentCreateInfoVOS.title
    })
    const imgName = `${downloadInfo.userId}_${downloadInfo.userName}_${downloadInfo.posterName}_${downloadInfo.downloadDate}.png`
    // DOM --> 图片 --> base64
    let imgData = await this.getBase64({ userId: downloadInfo.userId })
    imgData = imgData.replace(/^data:image\/(png|jpg|jpeg);base64,/, '')
    jsZip.file(imgName, imgData, { base64: true })
  } // end for
  // 生成压缩包
  jsZip.generateAsync({ type: 'blob' }).then(content => {
    FileSaver.saveAs(content, `${today}批量下载画作邀请卡.zip`)
  })
}
```
renderPoster循环生成图片，最后生成压缩包。再<code>this.$emit('loadEnd')</code>，组件抛出加载完成事件。至此完成。

![processon](@assets/project/3.png)

流程图如上，这个功能是2，3个月前开发的，现在看看，总的也说不上有啥难点。但还是比较考验综合能力的。

把DOM转base64, loadImage, getImgSize，downLoadFn抽离一下。

## 结果
邀请卡生成量增加1.9w, 增幅74.3%；画作邀请卡的生成数3w/天，用户分享率达86.30%；人效增幅上提升了74.3%；转介绍例子数增加42%；

## 总结
批量合成画作下载：

班主任在制作海报时，需要手动选画作，导致海报制作效率和分享意愿不高。希望去除手动选画作步骤，自动挑选画作并批量下载。我负责海报批量下载功能开发，并将批量下载功能封装到组件库中。批量合成下载有两种方式，一种是后端实现合成，前端直接调接口，下载成压缩包即可；另一种是前端实现，通过html2canvas合成海报，jszip+file-saver生成压缩包。功能上线后，人效增长74%，转介绍例子数增加42%

前端实现流程：先获取批量信息列表，for循环信息列表来合成画作图片，其中先加载合成海报所需的图片，加载完成，也就是DOM渲染完成后，再把海报DOM转成图片base64, 再生成压缩包
