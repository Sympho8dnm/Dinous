const { shell } = require('electron')
const fs = require('fs')
const path = require('path')

const $webview = document.querySelector('#webview')

$webview.addEventListener('dom-ready', () => {
  $webview.openDevTools()

  let filename = path.join(__dirname, '../window/css/webview.css')
  fs.readFile(filename, (err, css) => {
    if (!err) {
      return $webview.insertCSS(css.toString())
    }
  })
  filename = path.join(__dirname, '../window/css/toolbar.css')
  fs.readFile(filename, (err, css) => {
    if (!err) {
      return $webview.insertCSS(css.toString())
    }
  })
  filename = path.join(__dirname, '../window/js/toolbar.js')
  fs.readFile(filename, (err, js) => {
    if (!err) {
      return $webview.executeJavaScript(js.toString(), false)
    }
  })
})

// 支持点击打开链接
$webview.addEventListener('new-window', e => {
  console.log(e)
  shell.openExternal(e.url)
})
$webview.addEventListener('click', e => {
  console.log(e)
})

