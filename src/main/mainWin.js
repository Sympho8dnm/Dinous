import fs from 'fs'
import path from 'path'
import download from './download'
import contextMenu from './contextMenu'
import { app, BrowserWindow, shell, ipcMain, screen } from 'electron'

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
    icon: path.join(app.getAppPath(), './icon/32x32.png'),
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
  $win.on('close', (e) => {
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

  ipcMain.on('MAINWIN:window-minimize', () => $win.minimize())

  ipcMain.on('MAINWIN:window-maximization', () => {
    if ($win.isMaximized()) {
      $win.unmaximize()
    } else {
      $win.maximize()
    }
  })

  ipcMain.on('MAINWIN:window-close', () => $win.hide())
  ipcMain.on('MAINWIN:open-email', (e, url) => dingtalk.showEmailWin(url))

  ipcMain.on('MAINWIN:window-show', () => {
    $win.show()
    $win.focus()
  })
  ipcMain.on('MAINWIN:badge', (e, count) => {
    if (app.dock) {
      app.dock.show()
      app.dock.bounce('critical')
    }
    app.setBadgeCount(count)
    const trayIcon = count
      ? screen.getPrimaryDisplay().scaleFactor > 1
        ? path.join(app.getAppPath(), './icon/128x128.png')
        : path.join(app.getAppPath(), './icon/24x24.png')
      : screen.getPrimaryDisplay().scaleFactor > 1
        ? path.join(app.getAppPath(), './icon/128x128.png')
        : path.join(app.getAppPath(), './icon/24x24.png')
    if (dingtalk.$tray) {
      dingtalk.$tray.setImage(trayIcon)
    }
  })

  download($win)
  // 加载URL地址
  $win.loadURL('https://im.dingtalk.com/')
  return $win
}
