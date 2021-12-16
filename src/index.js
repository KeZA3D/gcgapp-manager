console.time("init")

require('@electron/remote/main').initialize()
const electron = require('electron');
const { app, Notification, mainWindow } = electron;
const ipc = require('./main/ipc')
const ggbook = require('./main/ggbook')
const windows = require('./main/windows')
const startup = require('./main/startup')
const wincmd = require('node-windows');
const log = require("./main/log")

const config = require('./config')
const settings = JSON.parse(windows.main.loadSettings())
// const fs = require('fs')
// const path = require('path')
let shouldQuit = false

if (!settings || !settings.enableHardwareAcceleration) app.disableHardwareAcceleration()


// // Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

wincmd.isAdminUser((isAdmin) => {
  console.log("Running app as", isAdmin == true ? "Administrator" : "DefaultUser (Should Quit)")
  if (!isAdmin) {
    showNotification("Ошибка запуска", "Запустите приложение от имени Администратора!!!")
    app.quit()
  }
})

if (!shouldQuit && !app.requestSingleInstanceLock()) {
  shouldQuit = true
}

if (shouldQuit) {
  app.quit()
} else {
  init()
}

async function init() {
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

  require('./main/updater')({
    repo: 'KeZA3D/gcgapp-manager',
    updateInterval: '5 hours',
    notifyUser: false
  })

  const ggbookUpdates = () => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        await ggbook.checkUpdates(true)
        ggbookUpdates()
        resolve();
      }, (86400 * 1000))
    });
  }

  const tray = require('./main/tray')
  tray.init()

  if (!settings || settings.projectAutoStart.ggbook) {
    ggbook.checkUpdates(false).then(() => {
      ggbook.init()
      ggbookUpdates()
    })
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

  app.on('second-instance', (argv) => {
    if (app.ipcReady) {
      log('Second app instance opened, but was prevented:', argv)
      windows.main.show()
    }
  })
}

function showNotification(title, body) {
  new Notification({ title, body }).show()
}
