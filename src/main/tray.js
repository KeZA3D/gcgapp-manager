module.exports = {
    hasTray,
    init,
    setWindowFocus
}

const { app, Tray, Menu } = require('electron')

const config = require('../config')
const windows = require('./windows')

let tray

function init() {
    if (process.platform === 'win32') {
        initWin32()
    }
    // Mac apps generally do not have menu bar icons
}

/**
 * Returns true if there a tray icon is active.
 */
function hasTray() {
    return !!tray
}

function setWindowFocus(flag) {
    if (!tray) return
    updateTrayMenu()
}

function initWin32() {
    createTray()
}


function createTray() {
    // tray = new Tray(getIconPath())

    // On Windows, left click opens the app, right click opens the context menu.
    // On Linux, any click (left or right) opens the context menu.
    // tray.on('click', () => windows.main.show())
    tray = new Tray(config.APP_ICON);
    tray.setToolTip('GGBook Test')
    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'Test', type: "separator"
        },
        {
            label: 'Закрыть GGBook', click: function () {
                app.quit();
            }
        }
    ])

    tray.setContextMenu(contextMenu)
    tray.on("double-click", () => {
        windows.main.show()
    })
    // Show the tray context menu, and keep the available commands up to date
    // updateTrayMenu()
}

function updateTrayMenu() {
    // const contextMenu = Menu.buildFromTemplate(getMenuTemplate())
    // tray.setContextMenu(contextMenu)
}

function getMenuTemplate() {
    // return [
    //     getToggleItem(),
    //     {
    //         label: 'Выход',
    //         click: () => app.quit()
    //     }
    // ]

    // function getToggleItem() {
    //     if (windows.main.win.isVisible()) {
    //         return {
    //             label: 'Hide to tray',
    //             click: () => windows.main.hide()
    //         }
    //     } else {
    //         return {
    //             label: 'Show WebTorrent',
    //             click: () => windows.main.show()
    //         }
    //     }
    // }
}

function getIconPath() {
    return config.APP_ICON + '.ico'
}