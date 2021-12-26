const appConfig = require('application-config')('GCGAppManager')
const path = require('path')
const { app } = require('electron')
const arch = require('arch')

const APP_NAME = 'GCGAppManager'
const APP_TEAM = 'GCGAppManager, OOO'
const APP_VERSION = require('../package.json').version

const UI_HEADER_HEIGHT = 38
const UI_GCGAPP_HEIGHT = 100

module.exports = {
    AUTO_UPDATE_URL: 'https://github.com/KeZA3D/gcgapp-manager/releases/latest',
    CRASH_REPORT_URL: 'https://github.com/KeZA3D/gcgapp-manager/issues',

    APP_COPYRIGHT: `Copyright © 2019-${new Date().getFullYear()} ${APP_TEAM}`,
    APP_ICON: path.join(__dirname, 'icons', 'favicon.ico'),
    APP_NAME,
    APP_TEAM,
    APP_VERSION,
    APP_WINDOW_TITLE: APP_NAME,

    CONFIG_PATH: getConfigPath(),

    GGBOOK_PATH: path.join(resolveToAbsolutePath('%APPDATA%'), APP_NAME, "ggbook.exe"),
    GGBOOK_CONFIG_PATH: path.join(resolveToAbsolutePath('%APPDATA%'), APP_NAME, "config.json"),
    GGBOOK_SETUP_PATH: path.join(resolveToAbsolutePath('%APPDATA%'), APP_NAME, "setup.json"),
    GGBOOK_ADDON_PATH: path.join(resolveToAbsolutePath('%APPDATA%'), APP_NAME, "signals", "index.js"),
    APPDATA: path.join(resolveToAbsolutePath("%APPDATA%"), APP_NAME),

    DEFAULT_SETUP_DATA: {
        lang: "ru",
        timezone: "Europe/Moscow",
        whitelist: [
            "37.77.105.108",
            "127.0.0.1"
        ],
        version: 3.068
    },
    DEFAULT_SETTINGS_DATA: {
        projectAutoStart: {
            ggbook: true
        },
        enableHardwareAcceleration: false
    },

    GITHUB_URL: 'https://github.com/KeZA3D/gcgapp-manager',
    GITHUB_URL_ISSUES: 'https://github.com/KeZA3D/gcgapp-manager/issues',
    GITHUB_URL_RAW: 'https://raw.githubusercontent.com/webtorrent/webtorrent-desktop/master',
    GITHUB_URL_RELEASES: 'https://github.com/KeZA3D/gcgapp-manager/releases',

    GGBOOK_DOWNLOAD_URL: 'https://ggbook.ru/downloads/ggbook/stable/ggbook.exe',
    GGBOOK_UPDATE_URL: 'https://ggbook.ru/downloads/ggbook/update',

    GGBOOK_OLD_PATH: 'C:\\Program Files (x86)\\GCGApp\\GGBook',

    HOME_PAGE_URL: 'https://ggbook.ru',

    OS_SYSARCH: arch() === 'x64' ? 'x64' : 'ia32',

    ROOT_PATH: __dirname,

    WINDOW_MAIN: 'file://' + path.join(__dirname, 'html', 'index.html'),
    RENDER_JS: __dirname + "/public/scripts/render.js",
    DELAYED_INIT: 2000,

    WINDOW_INITIAL_BOUNDS: {
        width: 500,
        height: UI_HEADER_HEIGHT + (UI_GCGAPP_HEIGHT * 6) // header + 6 torrents
    },
    WINDOW_MIN_HEIGHT: UI_HEADER_HEIGHT + (UI_GCGAPP_HEIGHT * 2), // header + 2 torrents
    WINDOW_MIN_WIDTH: 425,

    UI_HEADER_HEIGHT,
    UI_GCGAPP_HEIGHT
}

function getConfigPath() {
    return path.dirname(appConfig.filePath)
}

function resolveToAbsolutePath(path) {
    return path.replace(/%([^%]+)%/g, function (_, key) {
        return process.env[key];
    });
}