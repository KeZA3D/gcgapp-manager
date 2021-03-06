const main = module.exports = {
    dispatch,
    hide,
    init,
    send,
    setAspectRatio,
    setBounds,
    setProgress,
    setTitle,
    show,
    toggleAlwaysOnTop,
    toggleDevTools,
    toggleFullScreen,
    loadSettings,
    downloadModule,
    updateModule,
    win: null
}

const { app, BrowserWindow, screen } = require('electron')
const debounce = require('debounce')
const isDev = require('electron-is-dev')
const { download } = require("electron-dl");

const config = require('../../config')
const log = require('../log')
const fs = require('fs')
const path = require('path')
// const menu = require('../menu')

function init(state, options) {
    if (main.win) {
        return main.win.show()
    }

    options = {
        backgroundColor: '#282828',
        darkTheme: true, // Forces dark theme (GTK+3)
        minWidth:400,
        minHeight: 400,
        height: 800,
        icon: getIconPath(), // Window icon (Windows, Linux)
        minHeight: config.WINDOW_MIN_HEIGHT,
        minWidth: config.WINDOW_MIN_WIDTH,
        show: false,
        title: config.APP_WINDOW_TITLE,
        titleBarStyle: 'hiddenInset', // Hide title bar (Mac)
        useContentSize: true, // Specify web page size without OS chrome
        width: 600,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            backgroundThrottling: false,
            preload: config.RENDER_JS
        },
        ...options
    }

    if (isDev) {
        delete options.titleBarStyle
        delete options.autoHideMenuBar
        options.width = 1280
    }

    const win = main.win = new BrowserWindow(options)
    win.setMenu(null)
    require('@electron/remote/main').enable(win.webContents)

    if (isDev) win.webContents.openDevTools()

    win.loadURL(config.WINDOW_MAIN)

    win.once('ready-to-show', () => {
        win.show()
    })

    if (win.setSheetOffset) {
        win.setSheetOffset(config.UI_HEADER_HEIGHT)
    }

    win.webContents.on('dom-ready', () => {
        // menu.onToggleFullScreen(main.win.isFullScreen())
    })

    win.webContents.on('will-navigate', (e) => {
        // Prevent drag-and-drop from navigating the Electron window, which can happen
        // before our drag-and-drop handlers have been initialized.
        e.preventDefault()
    })

    win.on('blur', onWindowBlur)
    win.on('focus', onWindowFocus)

    win.on('hide', onWindowBlur)
    win.on('show', onWindowFocus)

    win.on('enter-full-screen', () => {
        // menu.onToggleFullScreen(true)
        send('fullscreenChanged', true)
        win.setMenuBarVisibility(false)
    })

    win.on('leave-full-screen', () => {
        // menu.onToggleFullScreen(false)
        send('fullscreenChanged', false)
        win.setMenuBarVisibility(true)
    })

    win.on('move', debounce(e => {
        send('windowBoundsChanged', e.sender.getBounds())
    }, 1000))

    win.on('resize', debounce(e => {
        send('windowBoundsChanged', e.sender.getBounds())
    }, 1000))

    win.on('close', e => {
        if (process.platform !== 'darwin') {
            const tray = require('../tray')
            if (!tray.hasTray()) {
                app.quit()
                return
            }
        }
        if (!app.isQuitting) {
            e.preventDefault()
            hide()
        }
    })
}

function dispatch(...args) {
    send('dispatch', ...args)
}

function hide() {
    if (!main.win) return
    dispatch('backToList')
    main.win.hide()
}

function send(...args) {
    if (!main.win) return
    main.win.send(...args)
}

/**
 * Enforce window aspect ratio. Remove with 0. (Mac)
 */
function setAspectRatio(aspectRatio) {
    if (!main.win) return
    main.win.setAspectRatio(aspectRatio)
}

/**
 * Change the size of the window.
 * TODO: Clean this up? Seems overly complicated.
 */
function setBounds(bounds, maximize) {
    // Do nothing in fullscreen
    if (!main.win || main.win.isFullScreen()) {
        log('setBounds: not setting bounds because already in full screen mode')
        return
    }

    // Maximize or minimize, if the second argument is present
    if (maximize === true && !main.win.isMaximized()) {
        log('setBounds: maximizing')
        main.win.maximize()
    } else if (maximize === false && main.win.isMaximized()) {
        log('setBounds: minimizing')
        main.win.unmaximize()
    }

    const willBeMaximized = typeof maximize === 'boolean' ? maximize : main.win.isMaximized()
    // Assuming we're not maximized or maximizing, set the window size
    if (!willBeMaximized) {
        log(`setBounds: setting bounds to ${JSON.stringify(bounds)}`)
        if (bounds.x === null && bounds.y === null) {
            // X and Y not specified? By default, center on current screen
            const scr = screen.getDisplayMatching(main.win.getBounds())
            bounds.x = Math.round(scr.bounds.x + (scr.bounds.width / 2) - (bounds.width / 2))
            bounds.y = Math.round(scr.bounds.y + (scr.bounds.height / 2) - (bounds.height / 2))
            log(`setBounds: centered to ${JSON.stringify(bounds)}`)
        }
        // Resize the window's content area (so window border doesn't need to be taken
        // into account)
        if (bounds.contentBounds) {
            main.win.setContentBounds(bounds, true)
        } else {
            main.win.setBounds(bounds, true)
        }
    } else {
        log('setBounds: not setting bounds because of window maximization')
    }
}

async function downloadModule(moduleName, properties, url, cb = function (dl) { }) {
    main.send('download', JSON.stringify({ moduleName }))
    properties.onProgress = status => main.send('download-progress', JSON.stringify({ status, moduleName }));
    const dl = await download(BrowserWindow.getAllWindows()[0], url, properties)
    return cb(dl)
}

async function updateModule(moduleName, properties, url, cb = function (dl) { }) {
    main.send('process', JSON.stringify({ moduleName, event: "update" }))
    properties.onProgress = status => main.send('process', JSON.stringify({ status, moduleName, event: "update-progress" }));
    const dl = await download(BrowserWindow.getAllWindows()[0], url, properties)
    return cb(dl)
}

/**
 * Loading APPDATA window settings
 */
function loadSettings() {
    const file = path.join(config.APPDATA, "settings.json");
    if (!fs.existsSync(file)) {
        if(!fs.existsSync(config.APPDATA)) fs.mkdirSync(config.APPDATA)
        fs.writeFileSync(file, JSON.stringify(config.DEFAULT_SETTINGS_DATA))
    }
    return fs.readFileSync(file, 'utf8')
}

/**
 * Set progress bar to [0, 1]. Indeterminate when > 1. Remove with < 0.
 */
function setProgress(progress) {
    if (!main.win) return
    main.win.setProgressBar(progress)
}

function setTitle(title) {
    if (!main.win) return
    main.win.setTitle(title)
}

function show() {
    if (!main.win) return
    main.win.show()
}

// Sets whether the window should always show on top of other windows
function toggleAlwaysOnTop(flag) {
    if (!main.win) return
    if (flag == null) {
        flag = !main.win.isAlwaysOnTop()
    }
    log(`toggleAlwaysOnTop ${flag}`)
    main.win.setAlwaysOnTop(flag)
    // menu.onToggleAlwaysOnTop(flag)
}

function toggleDevTools() {
    if (!main.win) return
    log('toggleDevTools')
    if (main.win.webContents.isDevToolsOpened()) {
        main.win.webContents.closeDevTools()
    } else {
        main.win.webContents.openDevTools({ mode: 'detach' })
    }
}

function toggleFullScreen(flag) {
    if (!main.win || !main.win.isVisible()) {
        return
    }

    if (flag == null) flag = !main.win.isFullScreen()

    log(`toggleFullScreen ${flag}`)

    if (flag) {
        // Fullscreen and aspect ratio do not play well together. (Mac)
        main.win.setAspectRatio(0)
    }

    main.win.setFullScreen(flag)
}

function onWindowBlur() {
    // menu.setWindowFocus(false)

    if (process.platform !== 'darwin') {
        const tray = require('../tray')
        tray.setWindowFocus(false)
    }
}

function onWindowFocus() {
    // menu.setWindowFocus(true)

    if (process.platform !== 'darwin') {
        const tray = require('../tray')
        tray.setWindowFocus(true)
    }
}

function getIconPath() {
    return process.platform === 'win32'
        ? config.APP_ICON + '.ico'
        : config.APP_ICON + '.png'
}