console.time("init")

require('@electron/remote/main').initialize()
const { app } = require('electron');
const ipc = require('./main/ipc')
const ggbook = require('./main/ggbook')
const windows = require('./main/windows')
const startup = require('./main/startup')

const config = require('./config')
const settings = JSON.parse(windows.main.loadSettings())
const fs = require('fs')
const path = require('path')
let shouldQuit = false

if (!settings.enableHardwareAcceleration) app.disableHardwareAcceleration()

// // Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

if (!shouldQuit && !app.requestSingleInstanceLock()) {
  shouldQuit = true
}

if (shouldQuit) {
  app.quit()
} else {
  init()
}

function init() {
  makeSingleInstance()

  let isReady = false // app ready, windows can be created
  app.ipcReady = false // main window has finished loading and IPC is ready
  app.isQuitting = false


  app.on('ready', () => onReady())

  function onReady() {
    isReady = true
    startup.install()
    // menu.init()
    windows.main.init()

    // To keep app startup fast, some code is delayed.
    setTimeout(() => {
      delayedInit()
    }, config.DELAYED_INIT)
  }

  app.setAppLogsPath()

  ipc.init()

  app.once('ipcReady', () => {
    console.timeEnd('init')
  })

  app.on('before-quit', e => {
    if (app.isQuitting) return

    app.isQuitting = true
    e.preventDefault()
    app.quit()
  })

  app.on('activate', () => {
    if (isReady) windows.main.show()
  })

}

function delayedInit() {
  if (app.isQuitting) return

  const updater = require('./main/updater')

  updater.init()

  const tray = require('./main/tray')
  tray.init()

  if (settings.projectAutoStart.ggbook) {
    ggbook.checkUpdates(false).then(() => ggbook.init())
    setInterval(() => ggbook.checkUpdates(true), 86400)
  }
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance() {
  if (process.mas) return

  app.requestSingleInstanceLock()

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}