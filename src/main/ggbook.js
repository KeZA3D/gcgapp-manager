const ggbook = module.exports = {
    init,
    isDownloaded,
    isAuthorized,
    checkUpdates,
    download,
    del,
    del,
    restart,
    stop,
    setConfigValues,
    process: null
}

const { GGBOOK_PATH, GGBOOK_CONFIG_PATH, GGBOOK_SETUP_PATH, APPDATA, DEFAULT_SETUP_DATA, GGBOOK_DOWNLOAD_URL, GGBOOK_UPDATE_URL, GGBOOK_OLD_PATH, GGBOOK_ADDONS_PATH, CONFIG_PATH } = require('../config')
const fs = require("fs")
// const { app, ipcMain } = require('electron')
const windows = require('./windows')
const log = require('./log')
const path = require("path")
const cp = require("child_process")
const fetch = require("node-fetch")
const isDev = require('electron-is-dev')
const skipModules = isDev && process.argv.find((e) => e == "--skip-modules") ? true : false

var processCache = { mode: null, steps: {}, connection: { api: null, database: null, signalr: null, server: null }, operator: { username: null, password: null } }
const moduleName = "ggbook"

function isDownloaded() {
    return fs.existsSync(GGBOOK_PATH)
}

function isAuthorized() {
    return fs.existsSync(GGBOOK_SETUP_PATH) && existsSync(GGBOOK_CONFIG_PATH)
}

function download() {
    return windows.main.downloadModule(moduleName, {
        directory: APPDATA,
        filename: "ggbook.exe",
        overwrite: true
    },
        GGBOOK_DOWNLOAD_URL,
        async () => {
            var setup = JSON.parse(fs.readFileSync(GGBOOK_SETUP_PATH, 'utf8'))
            var getVersionInfo = await fetch(GGBOOK_UPDATE_URL)
            if (getVersionInfo.ok === false) throw new Error("Failed to check software version: site is not available!")
            getVersionInfo = await getVersionInfo.json()
            setup.version = getVersionInfo.version
            fs.writeFileSync(GGBOOK_SETUP_PATH, JSON.stringify(setup, null, 4))
            ggbook.init()
        })
}

async function del() {
    if (ggbook.process !== null) {
        console.log("Closing application GGBook.exe")
        log("(Deleting) Closing application GGBook.exe")
        await ggbook.process.kill('SIGINT')
        ggbook.process = null
    }
    after(3000, () => {
        try {
            fs.unlink(GGBOOK_PATH, () => windows.main.send('deteleProcess', 'ggbook'))
        } catch (error) {
            console.log(e)
            log(e)
        }
    })
}

async function restart() {
    windows.main.send('restartProcess', 'ggbook')
    if (ggbook.process !== null) {
        console.log("Closing application GGBook.exe")
        log("(Restarting) Closing application GGBook.exe")
        await ggbook.process.kill('SIGINT')
        ggbook.process = null
    }
    after(2000, ggbook.init)
}

async function stop() {
    if (ggbook.process !== null) {
        console.log("Closing application GGBook.exe")
        log("(Stopping) Closing application GGBook.exe")
        await ggbook.process.kill('SIGINT')
        ggbook.process = null
    }
    windows.main.send('stopProcess', 'ggbook')
}

function init() {
    if (ggbook.process !== null) return;

    windows.main.send('startProcess', 'ggbook')

    oldDirectoryImport()
    if (fs.existsSync(GGBOOK_SETUP_PATH) == false) {
        fs.writeFileSync(GGBOOK_SETUP_PATH, JSON.stringify(DEFAULT_SETUP_DATA))
    }
    if (!isDownloaded() && !skipModules) {
        return ggbook.download()
    }

    if (skipModules) return emulateSpawn();

    const setupConfig = JSON.parse(fs.readFileSync(GGBOOK_SETUP_PATH, "utf8"))

    const child = ggbook.process = cp.spawn(GGBOOK_PATH, ["--colors"], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    child.on("message", (m) => {
        try {
            if (!isJson(m)) return log(`process:message ${m}`)
            if (typeof m == "object") return log(`process:message ${JSON.stringify(m)}`)
            var mJSON = JSON.parse(m)
            console.log(`process:${mJSON.event} ${mJSON.data}`)
            log(`process:${mJSON.event} ${mJSON.data}`)
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
            log.error(error)
        }
    })

    child.on("close", (e) => {
        console.log("Closed ggbook application with code:", e)
        log.error("Closed ggbook application with code: ", e)
        processCache = { mode: null, steps: {}, connection: { api: null, database: null, signalr: null, server: null }, operator: { username: null, password: null } }
        if (e !== null) {
            windows.main.send(`process`, JSON.stringify({ event: "restart", data: e, moduleName: moduleName }))
            log("Restarting GGBook application")
            // setTimeout(() => ggbook.init(), 2000)
            restart()
        }
    })

    child.on("error", (err) => {
        windows.main.send('process', JSON.stringify({ event: "error", data: err, moduleName: moduleName }))
        log.error(JSON.stringify({ event: "error", data: err, moduleName: moduleName }))
    })

    child.on("spawn", () => {
        windows.main.send('process', JSON.stringify({ event: "spawned", moduleName: moduleName, version: setupConfig.version }))
        log("GGBook process has been started!")
    })

    return child
}

async function checkUpdates(forceInit = false) {
    if (!fs.existsSync(GGBOOK_SETUP_PATH) || !fs.existsSync(GGBOOK_PATH)) {
        return false;
    }
    var setup = JSON.parse(fs.readFileSync(GGBOOK_SETUP_PATH, 'utf8'))
    try {
        var getVersionInfo = await fetch(GGBOOK_UPDATE_URL)
        if (getVersionInfo.ok === false) throw new Error("Failed to check software version: site is not available!")
        getVersionInfo = await getVersionInfo.json()
        if (setup == false) throw new Error("Failed to check software version: unable to read the file!")
        if (typeof setup.version == "undefined" || getVersionInfo.version > setup.version) {
            if (ggbook.process !== null) {
                console.log("Closing application GGBook.exe")
                log("(Update) Closing application GGBook.exe")
                await ggbook.process.kill('SIGINT')
                ggbook.process = null
            }
            // fs.unlinkSync(GGBOOK_PATH)
            await windows.main.updateModule(moduleName, {
                directory: APPDATA,
                filename: "ggbook.exe",
                overwrite: true
            },
                GGBOOK_DOWNLOAD_URL)
            setup.version = getVersionInfo.version
            fs.writeFileSync(GGBOOK_SETUP_PATH, JSON.stringify(setup, null, 4))
            if (forceInit == true) ggbook.init()
            log("(Update) GGBook process has been updated, starting...")
            return true
        } else {
            return false
        }
    } catch (e) {
        console.error(e)
    }
}

function setConfigValues(data) {
    var configFile, setupFile;
    if (fs.existsSync(GGBOOK_CONFIG_PATH)) configFile = JSON.parse(fs.readFileSync(GGBOOK_CONFIG_PATH, 'utf8'))
    if (fs.existsSync(GGBOOK_SETUP_PATH)) setupFile = JSON.parse(fs.readFileSync(GGBOOK_SETUP_PATH, 'utf8'))
    else configFile = {
        Global: {
            GizmoAPI: {
                Username: null,
                Password: null,
                Port: null,
            },
            Redis: {
                username: null,
                password: null,
            },
            Secret: null,
        }
    }
    configFile.Global.GizmoAPI = {
        Username: data['web-username'],
        Password: data['web-password'],
        Port: data['port'],
    }
    configFile.Global.Redis = {
        username: data['redis-username'],
        password: data['redis-password'],
    }
    configFile.Global.Secret = data['secret']

    setupFile.domain = data['domain']
    setupFile.timezone = data['timezone']

    fs.writeFileSync(GGBOOK_CONFIG_PATH, JSON.stringify(configFile))
    fs.writeFileSync(GGBOOK_SETUP_PATH, JSON.stringify(setupFile))
}

function oldDirectoryImport() {
    const oldConfigPath = path.join(GGBOOK_OLD_PATH, "config.json")
    const oldSetupPath = path.join(GGBOOK_OLD_PATH, "setup.json")
    // const oldProcessPath = path.join(GGBOOK_OLD_PATH, "setup.json")
    const oldAddonsPath = path.join(GGBOOK_OLD_PATH, "signals", "index.js")
    if (!fs.existsSync(GGBOOK_CONFIG_PATH) && fs.existsSync(oldConfigPath)) {
        log("Importing GGBook Config File")
        fs.copyFileSync(oldConfigPath, GGBOOK_CONFIG_PATH)
    }
    if (!fs.existsSync(GGBOOK_SETUP_PATH) && fs.existsSync(oldSetupPath)) {
        log("Importing GGBook Setup File")
        fs.copyFileSync(oldSetupPath, GGBOOK_SETUP_PATH)
    }
    if (!fs.existsSync(GGBOOK_ADDONS_PATH) && fs.existsSync(oldAddonsPath)) {
        log("Importing GGBook Addons File")
        fs.mkdirSync(GGBOOK_OLD_ADDONS_PATH)
        fs.copyFileSync(GGBOOK_OLD_ADDONS_PATH, oldAddonsPath)
    }

    const configData = JSON.parse(fs.readFileSync(GGBOOK_CONFIG_PATH, "utf8"))
    const setupData = JSON.parse(fs.readFileSync(GGBOOK_SETUP_PATH, "utf8"))
    if (typeof configData.Global.Domain == "undefined") configData.Global.Domain = setupData.domain
    if (typeof configData.Global.Timezone == "undefined") configData.Global.Timezone = setupData.timezone

    fs.writeFileSync(GGBOOK_CONFIG_PATH, JSON.stringify(configData))
}

function isJson(str) {
    try {
        const obj = JSON.parse(str);
        if (obj && typeof obj === `object`) {
            return true;
        }
    } catch (err) {
        return false;
    }
    return false;
}

function emulateSpawn() {
    log("Emulating spawn, please wait...")
    windows.main.dispatch('emulateGGBook')
    windows.main.send('process', JSON.stringify({ event: "spawned", moduleName: moduleName, version: "Emulation" }))
    windows.main.send('process:mode', JSON.stringify("worker"))
    windows.main.send(`process:connection`, JSON.stringify("gizmo:api:connected"))
    windows.main.send(`process:connection`, JSON.stringify("gizmo:database:connected"))
    windows.main.send(`process:connection`, JSON.stringify("gizmo:signalr:connected"))
    windows.main.send(`process:connection`, JSON.stringify("ggbook:server:connected"))

}

function after(ms, fn) { setTimeout(fn, ms); }