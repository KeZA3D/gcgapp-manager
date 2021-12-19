module.exports = {
    init,
    setModule
}

const { app, ipcMain } = require('electron')
const ggbook = require('./ggbook')
const fs = require("fs")
const { GGBOOK_PATH, GGBOOK_CONFIG_PATH, GGBOOK_SETUP_PATH, APPDATA, DEFAULT_SETUP_DATA, GGBOOK_DOWNLOAD_URL, GGBOOK_UPDATE_URL, GGBOOK_OLD_PATH, GGBOOK_OLD_ADDONS_PATH } = require('../config')

const log = require('./log')
const menu = require('./menu')
const windows = require('./windows')

// Messages from the main process, to be sent once the gcgapp process starts
const messageQueueMainToGCGApp = []

// Will hold modules injected from the app that will be used on fired
// IPC events.
const modules = {}

function setModule(name, module) {
    modules[name] = module
}

function init() {
    ipcMain.once('ipcReady', e => {
        app.ipcReady = true
        app.emit('ipcReady')
    })

    ipcMain.once('ipcReadyGCGApp', e => {
        app.ipcReadygcgapp = true
        log('sending %d queued messages from the main win to the GCGApp window',
            messageQueueMainToGCGApp.length)
        messageQueueMainToGCGApp.forEach(message => {
            windows.gcgapp.send(message.name, ...message.args)
            log('GCGApp: sent queued %s', message.name)
        })
    })

    /**
     * Auto start on login
     */

    ipcMain.on('setStartup', (e, flag) => {
        const startup = require('./startup')

        if (flag) startup.install()
        else startup.uninstall()
    })

    /**
     * Windows: Main
     */

    const main = windows.main

    ipcMain.on('setAspectRatio', (e, ...args) => main.setAspectRatio(...args))
    ipcMain.on('setBounds', (e, ...args) => main.setBounds(...args))
    ipcMain.on('setProgress', (e, ...args) => main.setProgress(...args))
    ipcMain.on('setTitle', (e, ...args) => main.setTitle(...args))
    ipcMain.on('show', () => main.show())
    ipcMain.on('toggleFullScreen', (e, ...args) => main.toggleFullScreen(...args))
    ipcMain.on('setAllowNav', (e, ...args) => menu.setAllowNav(...args))

    /**
     * GGBook
     */

    ipcMain.on('downloadModuleGGBook', (s) => ggbook.download())
    ipcMain.on('delModuleGGBook', () => ggbook.del())
    ipcMain.on('startModuleGGBook', () => ggbook.init())
    ipcMain.on('restartModuleGGBook', () => ggbook.restart())
    ipcMain.on('stopModuleGGBook', () => ggbook.stop())
    ipcMain.on('setModuleGGBookStartup', (e, flag) => {
        const pathTo = fs.join(APPDATA, "settings.json");
        const settings = JSON.parse(fs.readFileSync(pathTo, 'utf8'))
        if (flag) settings.projectAutoStart.ggbook = true
        else settings.projectAutoStart.ggbook = false

        fs.writeFile(pathTo, JSON.stringify(settings))
    })
    ipcMain.on('setModuleGGBookConfigValues', (e, ...args) => ggbook.setConfigValues(...args))
    ipcMain.on('setModuleGGBookSetupValues', (e, ...args) => ggbook.setSetupValues(...args))

    /**
     * Message passing
     */

    const oldEmit = ipcMain.emit
    ipcMain.emit = (name, e, ...args) => {
        // Relay messages between the main window and the GCGApp hidden window
        if (name.startsWith('wt-') && !app.isQuitting) {
            console.dir(e.sender.getTitle())
            if (e.sender.getTitle() === 'GCGApp Hidden Window') {
                // Send message to main window
                windows.main.send(name, ...args)
                log('gcgapp: got %s', name)
            } else if (app.ipcReadygcgapp) {
                // Send message to gcgapp window
                windows.gcgapp.send(name, ...args)
                log('gcgapp: sent %s', name)
            } else {
                // Queue message for gcgapp window, it hasn't finished loading yet
                messageQueueMainToGCGApp.push({
                    name,
                    args
                })
                log('gcgapp: queueing %s', name)
            }
            return
        }

        // Emit all other events normally
        oldEmit.call(ipcMain, name, e, ...args)
    }
}