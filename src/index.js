console.time("init")

require('@electron/remote/main').initialize()
const { app, ipcMain } = require('electron');
// const parallel = require('run-parallel')
const config = require('./config')
const ipc = require('./main/ipc')
const log = require('./main/log')
const menu = require('./main/menu')
const ggbook = require('./main/ggbook')
const windows = require('./main/windows')

// const fetch = require('node-fetch')
// const fs = require('fs')
// const moment = require("moment")
const path = require('path')
const glob = require('glob')
// const openurl = require("openurl")
// const util = require("util")
const os = require("os-utils")
// const AutoLaunch = require('auto-launch');

let shouldQuit = false

// var log_file_err = fs.createWriteStream(__dirname + '/error.log', { flags: 'a' });

// process.on('uncaughtException', function (err) {
//   console.log('Caught exception: ' + err);
//   log_file_err.write(util.format('Caught exception: ' + err) + '\n');
// });

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

// // const NOTIFICATION_EXIST_CLIPROCESS = 'Процесс GGBook уже запущен, смотрите подробнее в диспетчере задач!'
// // const NOTIFICATION_NO_UPDATES = 'У вас установлена последняя версия, поздравляю!'
// const PACKAGE = func().OpenFile("./package.json", true)
// const variables = { update: null, ggbook_process: null }
// const APPDATA = path.join("%APPDATA%", PACKAGE.productName)

let win;
let isReloading = false;
let Registers = []
var Cache = 1

function init() {
  makeSingleInstance

  let isReady = false // app ready, windows can be created
  app.ipcReady = false // main window has finished loading and IPC is ready
  app.isQuitting = false


  app.on('ready', () => onReady())


  function onReady() {
    isReady = true

    // menu.init()
    windows.main.init()
    ggbook.init()

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
}



// const tray = require(path.join("main", "tray.js"))
// tray.init()

// createWindow()

// ipcMain.on("get:cache:collection", () => {
//   if (isReloading = true) {
//     win.webContents.send("process:data:collection", JSON.stringify(processCache))
//     isReloading = false;
//   }
// })
// ipcMain.on("dom:reloading", () => {
//   isReloading = true
// })


// app.on('ready', () => {
//   createWindow()
// })

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') {
//     app.quit()
//   }
// })

// app.on('activate', () => {
//   if (mainWindow === null) {
//     createWindow()
//   }
// })
// app.whenReady().then(async () => {
// if (!fs.existsSync(__dirname + "/config.json") && fs.existsSync("C:\\Program Files (x86)\\GCGApp\\GGBook\\config.json")) {
//   fs.copyFileSync("C:\\Program Files (x86)\\GCGApp\\GGBook\\config.json", __dirname + "/config.json")
//   fs.copyFileSync("C:\\Program Files (x86)\\GCGApp\\GGBook\\setup.json", __dirname + "/setup.json")
// }
// createWindow()
// createTray()
// createProcess()
// // createWindow()
// // app.on('activate', () => {
// //   if (BrowserWindow.getAllWindows().length === 0) {
// //     createWindow()
// //   }
// // })
// let autoLaunch = new AutoLaunch({
//   name: 'GCGApp',
//   path: app.getPath('exe'),
// });
// autoLaunch.isEnabled().then((isEnabled) => {
//   if (!isEnabled) autoLaunch.enable();
// });
// });

// function createWindow() {
//   win = new BrowserWindow({
//     width: 1280,
//     height: 800,
//     minWidth: 600,
//     minHeight: 400,
//     // resizable: false,
//     center: true,
//     title: app.getName(),
//     icon: __dirname + "/icons/favicon.ico",
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false,
//       preload: __dirname + "/public/scripts/render.js"
//     }
//   })
//   win.on('closed', (event) => {
//     if (app.quitting) {
//       win = null
//     } else {
//       event.preventDefault()
//       win.hide()
//     }
//   })
//   // win.webContents.openDevTools()

//   win.loadFile("file://" + __dirname + "/html/index.html")
// }

// setInterval(() => {
//   if (win) {
//     os.cpuUsage((v) => {
//       win.webContents.send('cpu', v * 100)
//       win.webContents.send('ram', 100 - os.freememPercentage() * 100)
//     })
//   }
// }, 2000)


// app.on('activate', () => { win.show() })

// function createTray() {
//   tray = new Tray(path.join(__dirname, 'icons', 'favicon.ico'));
//   tray.setToolTip('GGBook Test')
//   var contextMenu = Menu.buildFromTemplate([
//     {
//       label: 'Test', type: "separator"
//     },
//     {
//       label: 'Закрыть GGBook', click: function () {
//         app.isQuiting = true
//         app.quit()
//       }
//     }
//   ])

//   tray.setContextMenu(contextMenu)
//   tray.on("double-click", () => {
//     win.show()
//   })
// }

// function showNotification(body) {
//   return new Notification({ title: NOTIFICATION_TITLE, body: body }).show()
// }

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// function createProcess() {
//   if (fs.existsSync(setupPath) == false) {
//     fs.writeFileSync(setupPath, JSON.stringify({
//       lang: "ru",
//       domain: "none",
//       timezone: "Europe/Moscow",
//       whitelist: [
//         "37.77.105.108",
//         "127.0.0.1"
//       ],
//       version: 3.068
//     }))
//   }
//   const child = cp.spawn(__dirname + '\\ggbook.exe', ["--colors"], {
//     windowsHide: true,
//     stdio: ['pipe', 'pipe', 'pipe', 'ipc']
//   });
//   child.on("message", (m) => {
//     try {
//       var mJSON = JSON.parse(m)
//       console.log(`process:${mJSON.event}`, mJSON.data)
//       switch (mJSON.event) {
//         case "mode":
//           processCache.mode = mJSON.data
//           break;
//         case "data:collect:steps":
//           processCache.steps[mJSON.data.step] = mJSON.data.IsError == false
//           break;
//         case "setup:operator":
//           processCache.operator.username = mJSON.data.username
//           processCache.operator.password = mJSON.data.password
//           break;
//         case "data:collect:steps:clear":
//           processCache.steps = {}
//           break;
//         case "connection":
//           if (mJSON.data == "gizmo:api:connected") processCache.connection.api = true
//           if (mJSON.data == "gizmo:database:connected") processCache.connection.database = true
//           if (mJSON.data == "gizmo:signalr:connected") processCache.connection.signalr = true
//           if (mJSON.data == "ggbook:server:connected") processCache.connection.server = true
//           break;
//       }
//       win.webContents.send(`process:${mJSON.event}`, JSON.stringify(mJSON.data))
//     } catch (error) {
//       console.log(error)
//     }
//   })

//   child.on("close", (e) => {
//     console.log("Restarting process")
//     processCache = { mode: null, steps: {}, connection: { api: null, database: null, signalr: null, server: null }, operator: { username: null, password: null } }
//     win.webContents.send(`process:restart`, true)
//     // if (e !== null) {
//     //     eventListener.emit("state", "0")
//     createProcess()
//     // } else {
//     //     console.log("Closed by user")
//     // }
//   })
//   child.on("error", (err) => {
//     win.webContents.send('process', JSON.stringify(err))
//   })
//   child.on("spawn", () => {
//     win.webContents.send('process', JSON.stringify({ event: "spawned", data: true }))
//   })

//   return child
// }


// function func() {
//   return {
//     OpenFile: (file, decode = false) => {
//       try {
//         var read = fs.readFileSync(file, 'utf8');
//         if (decode == true) {
//           try {
//             return JSON.parse(read);
//           } catch (e) {
//             return false;
//           }
//         }
//       } catch (err) {
//         return false;
//       }
//       return read;
//     },
//     WriteFile: (file, data, toJson = false, Open = false, OpenDecode = false) => {
//       if (toJson === true) {
//         data = JSON.stringify(data);
//       }
//       try {
//         var write = fs.writeFileSync(file, data);
//         if (write === false) return false;
//       } catch (err) {
//         return false;
//       }
//       if (Open === true) {
//         return module.exports.OpenFile(file, OpenDecode);
//       }
//       return true;
//     },
//     isJson: str => {
//       var result
//       try {
//         result = JSON.parse(str);
//       } catch (e) {
//         return false;
//       }
//       return result;
//     },
//   }
// }

// setup(path.join(__dirname, "main.p", "communication"), {
//   window: true,
//   tray: false
// })

// function setup(dir, options) {
//   options = {
//     window: false,
//     tray: false,
//     ...options
//   }
//   const register = (file) => {
//     let func = file;
//     console.log(func)
//     let modules = {};
//     if (options.window == true) modules.window = win
//     if (options.tray) modules.tray = tray;
//     Registers.push(func({ cache: Cache, window: modules.window, tray: modules.tray }))
//   }
//   const files = glob.sync(path.join(dir, "**", "*.js"))
//   files.forEach((file) => { register(require(file)) })
// }

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