import fs from 'fs'
import path from 'path'
import logo, { getNoMessageTrayIcon, getMessageTrayIcon } from './logo'
import download from './download'
import contextMenu from './contextMenu'
import { app, BrowserWindow, shell, ipcMain } from 'electron'

export default dingtalk => () => {
  if (dingtalk.$mainWin) {
    dingtalk.showMainWin()
    return
  }
  // 创建浏览器窗口
  const $win = new BrowserWindow({
    title: '钉钉',
    width: 960,
    height: 600,
    minWidth: 720,
    minHeight: 450,
    useContentSize: true,
    center: true,
    frame: false,
    show: false,
    backgroundColor: '#5a83b7',
    icon: logo,
    resizable: true
  })

  /**
   * 优雅的显示窗口
   */
  $win.once('ready-to-show', () => {
    $win.show()
    $win.focus()
  })

  /**
   * 窗体关闭事件处理
   * 默认只会隐藏窗口
   */
  $win.on('close', e => {
    e.preventDefault()
    $win.hide()
  })

  $win.webContents.on('dom-ready', () => {
    const filename = path.join(app.getAppPath(), './dist/preload/mainWin.js')
    // 读取js文件并执行
    fs.access(filename, fs.constants.R_OK, err => {
      if (err) return
      fs.readFile(filename, (error, data) => {
        if (error || $win.webContents.isDestroyed()) return
        $win.webContents.executeJavaScript(data.toString(), () => {
          if (!$win.webContents.isDestroyed()) $win.webContents.send('dom-ready')
        })
      })
    })
  })

  // 右键菜单
  $win.webContents.on('context-menu', (e, params) => {
    e.preventDefault()
    contextMenu($win, params)
  })

  // 浏览器中打开链接
  $win.webContents.on('new-window', (e, url) => {
    e.preventDefault()
    if (url !== 'about:blank') {
      shell.openExternal(url)
    }
  })

  // 主窗口导航拦截
  $win.webContents.on('will-navigate', (e, url) => {
    e.preventDefault()
    if (url !== 'about:blank' && url !== 'https://im.dingtalk.com/') {
      shell.openExternal(url)
    }
  })

  ipcMain.on('MAINWIN:window-minimize', () => $win.minimize())

  ipcMain.on('MAINWIN:window-maximization', () => {
    if ($win.isMaximized()) {
      $win.unmaximize()
    } else {
      $win.maximize()
    }
  })

  ipcMain.on('MAINWIN:window-close', () => $win.hide())
  ipcMain.on('MAINWIN:open-email', (e, storage) => dingtalk.showEmailWin(storage))

  ipcMain.on('MAINWIN:window-show', () => {
    $win.show()
    $win.focus()
  })
  ipcMain.on('MAINWIN:badge', (e, count) => {
    app.setBadgeCount(count)
    if (dingtalk.$tray) {
      let messageTrayIcon = getMessageTrayIcon()
      let noMessageTrayIcon = getNoMessageTrayIcon()
      if (count) {
        if (!$win.intervalRunning) {
          // icon的flag，用来让图片每500毫秒交替显示
          let iconFlag = true
          $win['trayIconInterval'] = setInterval(() => {
            dingtalk.$tray.setImage(iconFlag ? messageTrayIcon : noMessageTrayIcon)
            iconFlag = !iconFlag
          }, 500)
          $win['intervalRunning'] = true
        }
      } else {
        if ($win.intervalRunning) {
          clearInterval($win.trayIconInterval)
          $win.intervalRunning = false
        }
        dingtalk.$tray.setImage(noMessageTrayIcon)
      }
    }
    if (app.dock) {
      app.dock.show()
      app.dock.bounce('critical')
    }
  })

  download($win)
  // 加载URL地址
  $win.loadURL('https://im.dingtalk.com/')
  return $win
}
