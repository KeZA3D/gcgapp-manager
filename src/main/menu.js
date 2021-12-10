module.exports = {
    init,
    setWindowFocus,
    onToggleAlwaysOnTop,
    onToggleFullScreen
  }
  
  const { Menu } = require('electron')
  
  let menu = null
  
  function init () {
    menu = Menu.buildFromTemplate(getMenuTemplate())
    Menu.setApplicationMenu(menu)
  }
  
  function setWindowFocus (flag) {
    getMenuItem('Full Screen').enabled = flag
    getMenuItem('Float on Top').enabled = flag
  }
  
  function onToggleAlwaysOnTop (flag) {
    getMenuItem('Float on Top').checked = flag
  }
  
  function onToggleFullScreen (flag) {
    getMenuItem('Full Screen').checked = flag
  }
  
  function getMenuItem (label) {
    for (const menuItem of menu.items) {
      const submenuItem = menuItem.submenu.items.find(item => item.label === label)
      if (submenuItem) return submenuItem
    }
    return {}
  }
  
  function getMenuTemplate () {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            role: 'close'
          }
        ]
      }
    ]
    return template
  }