module.exports = {
    init,
    setModule
}

const { app, ipcMain } = require('electron')

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