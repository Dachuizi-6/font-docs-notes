图片懒加载：img.src = 'xxx' 由于网络请求需要一定时间，会导致图片位置在加载过程中空白，故可以在图片加载中，先显示一个 <code>loading</code> 图片，待真正的图片加载完成，再显示。

::: warning
封装一个支付 promise 的图片加载方法，如:
loadImg('https://avatars.githubusercontent.com/u/26007970?v=4').then(() => { })
:::
答：

```js
function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = function (e) {
      console.log("load src error", src);
      reject(e);
    };
    img.src = src;
  });
}

// 测试
loadImg("https://avatars.githubusercontent.com/u/26007970?v=4").then((res) => {
  console.log("res", res); // {width: 62, height: 62}
});
```

很简洁的代码吧:smile:, 这里加了点优化，loadImg 能返回图片的相关信息，如 宽和高

::: warning
实现图片懒加载
:::

答：在调用<code>lazyLoad(dom, src)</code>时，就需要给 dom.src = 'xxx' 先赋值为 loading 图片

```js
function lazyLoad(dom, src) {
  const errorSrc = "https://www.computerhope.com/jargon/e/error.png";
  const loadSrc = "https://media0.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";
  const img = new Image();
  img.onload = function () {
    dom.src = src;
  };
  img.onerror = function () {
    dom.src = errorSrc;
  };
  img.src = src;
  dom.src = loadSrc;
}

// 测试
const dom = document.getElementById("lazy-load-img");
lazyLoad(dom, src);
```

优化：每次调用 lazyLoad 都会生成 errorSrc, loadSrc, img 变量。这些变量能否 只生成一次就好了？

```js
const lazyLoad = (function (src) {
  const errorSrc = "https://www.computerhope.com/jargon/e/error.png";
  const loadSrc = "https://media0.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";
  const dom = document.getElementById("lazy-load-img");
  const img = new Image();
  img.onload = function () {
    dom.src = src;
  };
  img.onerror = function () {
    dom.src = errorSrc;
  };
  return {
    setSrc: function (src) {
      img.src = src;
      dom.src = loadSrc;
    },
  };
})();

// 测试
lazyLoad.setSrc(src);
```

```js
<img src="https://img01.scbao.com/140911/240411-14091109223737.jpg" id="lazy-load-img" style="width: 200px; height: 200px"/>

<button id="reload-button">重新加载图片</button>

<script>
  window.onload = () => {
    const img = document.getElementById('lazy-load-img')
    const button = document.getElementById('reload-button')
    button.addEventListener('click', (e) => {
      lazyLoad.setSrc('https://img01.scbao.com/140911/240411-14091109223737.jpg')
    })

    const lazyLoad = (function() {
      const errorSrc = 'https://www.computerhope.com/jargon/e/error.png'
      const loadSrc = 'https://media0.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'
      const dom = document.getElementById('lazy-load-img')
      const img = new Image()
      img.onload = function() {
        dom.src = img.src
      }
      img.onerror = function() {
        console.log('img load error')
        dom.src = errorSrc
      }
      return {
        setSrc: function(src) {
          console.log('src', src)
          dom.src = loadSrc
          img.src = src
        }
      }
    })()
  }
</script>
```
