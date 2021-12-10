module.exports = {
    install,
    uninstall
}

const { APP_NAME } = require('../config')
const AutoLaunch = require('auto-launch')

const appLauncher = new AutoLaunch({
    name: APP_NAME,
    isHidden: true
})

async function install() {
    const enabled = await appLauncher
        .isEnabled()
    if (!enabled)
        return appLauncher.enable()
}

async function uninstall() {
    const enabled = await appLauncher
        .isEnabled()
    if (enabled)
        return appLauncher.disable()
}