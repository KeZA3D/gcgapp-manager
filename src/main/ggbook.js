module.exports = {
    init,
    isDownloaded,
    isAuthorized,
}
const { GGBOOK_PATH, GGBOOK_CONFIG_PATH, GGBOOK_SETUP_PATH, APPDATA, DEFAULT_SETUP_DATA } = require('../config')
const fs = require("fs")
const { app, ipcMain } = require('electron')
const windows = require('./windows')
const log = require('./log')
const cp = require("child_process")

var processCache = { mode: null, steps: {}, connection: { api: null, database: null, signalr: null, server: null }, operator: { username: null, password: null } }

function isDownloaded() {
    return fs.existsSync(GGBOOK_PATH)
}

function isAuthorized() {
    return fs.existsSync(GGBOOK_SETUP_PATH) && existsSync(GGBOOK_CONFIG_PATH)
}

function init() {
    if (fs.existsSync(GGBOOK_SETUP_PATH) == false) {
        fs.writeFileSync(GGBOOK_SETUP_PATH, JSON.stringify(DEFAULT_SETUP_DATA))
    }

    const child = cp.spawn(GGBOOK_PATH, ["--colors"], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    child.on("message", (m) => {
        try {
            var mJSON = JSON.parse(m)
            console.log(`process:${mJSON.event}`, mJSON.data)
            switch (mJSON.event) {
                case "mode":
                    processCache.mode = mJSON.data
                    break;
                case "data:collect:steps":
                    processCache.steps[mJSON.data.step] = mJSON.data.IsError == false
                    break;
                case "setup:operator":
                    processCache.operator.username = mJSON.data.username
                    processCache.operator.password = mJSON.data.password
                    break;
                case "data:collect:steps:clear":
                    processCache.steps = {}
                    break;
                case "connection":
                    if (mJSON.data == "gizmo:api:connected") processCache.connection.api = true
                    if (mJSON.data == "gizmo:database:connected") processCache.connection.database = true
                    if (mJSON.data == "gizmo:signalr:connected") processCache.connection.signalr = true
                    if (mJSON.data == "ggbook:server:connected") processCache.connection.server = true
                    break;
            }
            windows.main.send(`process:${mJSON.event}`, JSON.stringify(mJSON.data))
        } catch (error) {
            console.log(error)
        }
    })

    child.on("close", (e) => {
        console.log(e)
        console.log("Restarting process")
        processCache = { mode: null, steps: {}, connection: { api: null, database: null, signalr: null, server: null }, operator: { username: null, password: null } }
        windows.main.send(`process:restart`, true)
        // if (e !== null) {
        //     eventListener.emit("state", "0")
        setTimeout(() => createProcess(), 2000)
        // } else {
        //     console.log("Closed by user")
        // }
    })
    child.on("error", (err) => {
        windows.main.send('process', JSON.stringify(err))
    })
    child.on("spawn", () => {
        windows.main.send('process', JSON.stringify({ event: "spawned", data: true }))
        log("GGBook process has been spawned!")
    })

    return child
}