const electron = require("electron")
// const fs = require("fs")
const ipcRenderer = electron.ipcRenderer;
// const config = require('../../config')
const moment = require('moment-timezone')

document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.send('ipcReady')
    ipcRenderer.on("error", (event, data) => {
        console.log(data)
        var createElement = function (tagName, className, text) {
            var newElement = document.createElement(tagName),
                curTime = moment().format("HH:mm:ss") + " | ";
            if (className) newElement.setAttribute('class', className);

            var dateHTML = document.createElement("b")
            dateHTML.setAttribute('class', 'opacity-60 color-white')
            dateHTML.appendChild(document.createTextNode(curTime))

            newElement.appendChild(dateHTML)
            newElement.appendChild(document.createTextNode(text));

            return newElement;
        }

        var newline,
            color,
            domConsole = document.getElementById("logs-content");
        if (typeof data == "array") color = "color-blue-dark"
        else if (typeof data == "object") color = "color-red-dark"

        if (domConsole.querySelectorAll("p").length > 60) domConsole.removeChild(domConsole.querySelectorAll("p")[0])

        newline = createElement('p', 'opacity-90 mb-0 ' + color, data);
        domConsole.appendChild(newline);
    })

    ipcRenderer.on("log", (event, ...data) => {
        var createElement = function (tagName, className, text) {
            var newElement = document.createElement(tagName),
                curTime = moment().format("HH:mm:ss") + " | ";
            if (className) newElement.setAttribute('class', className);

            var dateHTML = document.createElement("b")
            dateHTML.setAttribute('class', 'opacity-60 color-white')
            dateHTML.appendChild(document.createTextNode(curTime))

            newElement.appendChild(dateHTML)
            newElement.appendChild(document.createTextNode(text));

            return newElement;
        }

        var newline,
            color,
            domConsole = document.getElementById("logs-content");
        if (typeof data == "array") color = "color-blue-dark"
        else if (typeof data == "object") color = "color-green-dark"

        if (domConsole.querySelectorAll("p").length > 10) domConsole.removeChild(domConsole.querySelectorAll("p")[0])

        newline = createElement('p', 'opacity-90 mb-0 ' + color, data);
        domConsole.appendChild(newline);
    })
    // const oldHTML = document.querySelector(".page-content").innerHTML
    const oldSetupConnectionHTML = document.querySelector('[data-setup-name="connection"]').innerHTML

    ipcRenderer.send("get:cache:collection")

    ipcRenderer.on('cpu', (event, data) => {
        const cpuMonitorHtml = document.querySelector("[data-spec-name='cpu']")
        if (data > 0 && data < 50) {
            cpuMonitorHtml.querySelector("i").classList.add("color-green-dark")
            cpuMonitorHtml.querySelector("i").classList.remove("color-yellow-dark")
            cpuMonitorHtml.querySelector("i").classList.remove("color-red-dark")
        } else if (data > 50 && data < 80) {
            cpuMonitorHtml.querySelector("i").classList.add("color-yellow-dark")
            cpuMonitorHtml.querySelector("i").classList.remove("color-green-dark")
            cpuMonitorHtml.querySelector("i").classList.remove("color-red-dark")
        } else if (data > 80) {
            cpuMonitorHtml.querySelector("i").classList.add("color-red-dark")
            cpuMonitorHtml.querySelector("i").classList.remove("color-green-dark")
            cpuMonitorHtml.querySelector("i").classList.remove("color-yellow-dark")
        }
        cpuMonitorHtml.querySelector("p").innerHTML = data.toFixed(2);
    })

    ipcRenderer.on('ram', (event, data) => {
        const ramMonitorHtml = document.querySelector("[data-spec-name='ram']")
        if (data > 0 && data < 50) {
            ramMonitorHtml.querySelector("i").classList.add("color-green-dark")
            ramMonitorHtml.querySelector("i").classList.remove("color-yellow-dark")
            ramMonitorHtml.querySelector("i").classList.remove("color-red-dark")
        } else if (data > 50 && data < 80) {
            ramMonitorHtml.querySelector("i").classList.add("color-yellow-dark")
            ramMonitorHtml.querySelector("i").classList.remove("color-green-dark")
            ramMonitorHtml.querySelector("i").classList.remove("color-red-dark")
        } else if (data > 80) {
            ramMonitorHtml.querySelector("i").classList.add("color-red-dark")
            ramMonitorHtml.querySelector("i").classList.remove("color-green-dark")
            ramMonitorHtml.querySelector("i").classList.remove("color-yellow-dark")
        }
        ramMonitorHtml.querySelector("p").innerHTML = data.toFixed(2);
    })

    ipcRenderer.on('message', (event, data) => {
        console.log(data);
    })



    ipcRenderer.on('process:mode', (event, data) => {
        data = JSON.parse(data)
        console.log(data)
        const projectHTML = document.querySelector("div[data-module='ggbook']")

        projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.remove("gradient-yellow", "gradient-blue")
        projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.add("gradient-green")
        projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].children[0].classList.remove("fa-spin")

        if (data == "setup") {
            document.querySelectorAll("[data-mode='setup']").forEach(element => {
                element.classList.remove("disabled")
            });
            document.querySelectorAll("[data-mode='worker']").forEach(element => {
                element.classList.add("disabled")
            });
        } else {
            document.querySelectorAll("[data-mode='setup']").forEach(element => {
                element.classList.add("disabled")
            });
            document.querySelectorAll("[data-mode='worker']").forEach(element => {
                element.classList.remove("disabled")
            });
        }
    })

    ipcRenderer.on('process:setup:operator', (event, data) => {
        data = JSON.parse(data)
        console.log(data)
        var html = document.querySelector('div[data-setup-name="operator"]').querySelectorAll("div.col")
        html[0].querySelector("p").innerHTML = data.username
        html[1].querySelector("p").innerHTML = data.password
    })

    ipcRenderer.on('process:data:collect:steps', (event, data) => {
        data = JSON.parse(data)
        console.log(data)
        const html = document.querySelector('div[data-setup-name="connection"]').querySelectorAll("a")[data.step - 1].querySelectorAll("span")[1]
        const ERROR = "Failded"
        const SUCCESS = "Success"
        html.classList.remove("bg-yellow-dark", "bg-green-dark", "bg-red-dark")
        if (data.IsError == true) {
            html.classList.add("bg-red-dark")
            html.innerHTML = ERROR
        } else {
            html.classList.add("bg-green-dark")
            html.innerHTML = SUCCESS
        }
    })

    ipcRenderer.on('process:data:collection', (event, data) => {
        data = JSON.parse(data)
        console.log(data)

        const ERROR = "Failded"
        const SUCCESS = "Success"

        if (data.mode == "setup") {
            document.querySelectorAll("[data-mode='setup']").forEach(element => {
                element.classList.remove("disabled")
            });
            document.querySelectorAll("[data-mode='worker']").forEach(element => {
                element.classList.add("disabled")
            });

            var operator = document.querySelector('div[data-setup-name="operator"]').querySelectorAll("div.col")
            operator[0].querySelector("p").innerHTML = data.operator.username
            operator[1].querySelector("p").innerHTML = data.operator.password

            var steps = document.querySelector('div[data-setup-name="connection"]').querySelectorAll("a")
            for (let i in data.steps) {
                steps[parseInt(i) - 1].querySelectorAll("span")[1].innerHTML = data.steps[i] == true ? SUCCESS : ERROR
                steps[parseInt(i) - 1].querySelectorAll("span")[1].classList.remove("bg-yellow-dark", "bg-green-dark", "bg-red-dark")
                steps[parseInt(i) - 1].querySelectorAll("span")[1].classList.add(data.steps[i] == true ? "bg-green-dark" : "bg-red-dark")
            }
        } else {
            document.querySelectorAll("[data-mode='setup']").forEach(element => {
                element.classList.add("disabled")
            });
            document.querySelectorAll("[data-mode='worker']").forEach(element => {
                element.classList.remove("disabled")
            });
        }
    })

    ipcRenderer.on('process:connection', (event, data) => {
        data = JSON.parse(data)
        console.log(data)
        const html = document.querySelector('div[data-worker-name="connection"]').querySelectorAll("a")
        const ERROR = "Failded"
        const SUCCESS = "Connected"
        if (data == "gizmo:api:connected") {
            html[0].querySelectorAll("span")[1].classList.remove("bg-yellow-dark", "bg-green-dark", "bg-red-dark")
            html[0].querySelectorAll("span")[1].classList.add("bg-green-dark")
            html[0].querySelectorAll("span")[1].innerHTML = SUCCESS
        }
        else if (data == "gizmo:database:connected") {
            html[1].querySelectorAll("span")[1].classList.remove("bg-yellow-dark", "bg-green-dark", "bg-red-dark")
            html[1].querySelectorAll("span")[1].classList.add("bg-green-dark")
            html[1].querySelectorAll("span")[1].innerHTML = SUCCESS
        }
        else if (data == "gizmo:signalr:connected") {
            html[2].querySelectorAll("span")[1].classList.remove("bg-yellow-dark", "bg-green-dark", "bg-red-dark")
            html[2].querySelectorAll("span")[1].classList.add("bg-green-dark")
            html[2].querySelectorAll("span")[1].innerHTML = SUCCESS
        }
        else if (data == "ggbook:server:connected") {
            html[3].querySelectorAll("span")[1].classList.remove("bg-yellow-dark", "bg-green-dark", "bg-red-dark")
            html[3].querySelectorAll("span")[1].classList.add("bg-green-dark")
            html[3].querySelectorAll("span")[1].innerHTML = SUCCESS
        }
    })


    ipcRenderer.on('process:data:collect:steps:clear', (event, data) => {
        document.querySelector('[data-setup-name="connection"]').innerHTML = oldSetupConnectionHTML
    });

    ipcRenderer.on('process', (event, data) => {
        data = JSON.parse(data)
        const projectHTML = document.querySelector("div[data-module='" + data.moduleName + "']")
        // projectHTML.querySelector("div[data-project-type='app-status']").classList.add("disabled")
        const downloadHTML = projectHTML.querySelector("div[data-project-type='app-download']")
        const appStatusHTML = projectHTML.querySelector("div[data-project-type='app-status']")
        console.log(data);
        switch (data.event) {
            case "spawned":
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.remove("gradient-blue", "gradient-green")
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.add("gradient-yellow")
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].children[0].classList.add("fa-spin")
                downloadHTML.classList.add("disabled")
                appStatusHTML.classList.remove("disabled")
                // appStatusHTML.querySelector("span[data-title='stop']").classList.add("disabled")
                // appStatusHTML.querySelector("span[data-title='restart']").classList.add("disabled")
                // appStatusHTML.querySelector("span[data-title='active']").classList.remove("disabled")
                document.querySelector('[data-module-version="ggbook"]').innerHTML = data.version
                break;
            // case "error":
            //     break;
            case "restart":
                downloadHTML.classList.add("disabled")
                appStatusHTML.classList.remove("disabled")
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.remove("gradient-blue", "gradient-green")
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.add("gradient-yellow")
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].children[0].classList.add("fa-spin")
                // appStatusHTML.querySelector("span[data-title='stop']").classList.add("disabled")
                // appStatusHTML.querySelector("span[data-title='restart']").classList.remove("disabled")
                // appStatusHTML.querySelector("span[data-title='active']").classList.add("disabled")
                break;
            case "update":
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.remove("gradient-blue", "gradient-green")
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.add("gradient-yellow")
                projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].children[0].classList.add("fa-spin")
                downloadHTML.classList.remove("disabled")
                appStatusHTML.classList.add("disabled")
                // appStatusHTML.querySelector("span[data-title='stop']").classList.add("disabled")
                // appStatusHTML.querySelector("span[data-title='restart']").classList.add("disabled")
                // appStatusHTML.querySelector("span[data-title='active']").classList.add("disabled")

                projectHTML.querySelector("[data-title='du']").classList.remove("disabled")
                projectHTML.querySelector("[data-title='d']").classList.add("disabled")

                downloadHTML.querySelector("div.progress-bar").style.width = "0%"
                projectHTML.querySelector("[data-title='p']").innerHTML = "0%"
                console.log(1)
                break;
            case "update-progress":
                const value = Math.floor(data.status.percent * 100).toString() + "%"
                downloadHTML.querySelector("div.progress-bar").style.width = value
                projectHTML.querySelector("[data-title='p']").innerHTML = value
                break;
            // case "update-complete":
            //     projectHTML.querySelector("[data-title='p']").innerHTML = "Starting process"
            //     break;
            // case "update-error":
            //     break;
        }
    });

    ipcRenderer.on('download', (event, data) => {
        data = JSON.parse(data)
        const projectHTML = document.querySelector("div[data-module='" + data.moduleName + "']")
        projectHTML.querySelector("div[data-project-type='app-status']").classList.add("disabled")
        const downloadHTML = projectHTML.querySelector("div[data-project-type='app-download']")
        downloadHTML.classList.remove("disabled")

        projectHTML.querySelector("[data-title='du']").classList.add("disabled")
        projectHTML.querySelector("[data-title='d']").classList.remove("disabled")

        downloadHTML.querySelector("div.progress-bar").style.width = "0%"
        projectHTML.querySelector("[data-title='p']").innerHTML = "0%"
    })


    ipcRenderer.on('download-progress', (event, data) => {
        data = JSON.parse(data)
        const projectHTML = document.querySelector("div[data-module='" + data.moduleName + "']")
        const downloadHTML = projectHTML.querySelector("div[data-project-type='app-download']")

        console.log(data)
        const value = Math.floor(data.status.percent * 100).toString() + "%"
        downloadHTML.querySelector("div.progress-bar").style.width = value
        projectHTML.querySelector("[data-title='p']").innerHTML = value
    })

    ipcRenderer.on('stopProcess', (event, data) => {
        const moduleName = data;

        document.querySelector(`[data-menu='menu-restart-${moduleName}']`)?.classList.add("disabled")
        document.querySelector(`[data-menu='menu-stop-${moduleName}']`)?.classList.add("disabled")
        document.querySelector(`[data-download-process=${moduleName}]`)?.classList.add("disabled")

        document.querySelector(`[data-start-process=${moduleName}]`)?.classList.remove("disabled")
    })

    ipcRenderer.on('startProcess', (event, data) => {
        const moduleName = data;

        document.querySelector(`[data-menu='menu-restart-${moduleName}']`)?.classList.remove("disabled")
        document.querySelector(`[data-menu='menu-stop-${moduleName}']`)?.classList.remove("disabled")

        document.querySelector(`[data-download-process=${moduleName}]`)?.classList.add("disabled")
        document.querySelector(`[data-start-process=${moduleName}]`)?.classList.add("disabled")
    })

    ipcRenderer.on('restartProcess', (event, data) => {
        const moduleName = data;

        const projectHTML = document.querySelector("div[data-module='" + moduleName + "']")
        projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.remove("gradient-blue", "gradient-green")
        projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].classList.add("gradient-yellow")
        projectHTML.querySelector('a[data-bs-toggle="collapse"]').children[0].children[0].classList.add("fa-spin")
    })
    ipcRenderer.on('deleteProcess', (event, data) => { })

    ipcRenderer.on('notDownloadedModule', (event, data) => { 
        const moduleName = data;

        document.querySelector("div[data-module='" + moduleName + "']").querySelector("div[data-project-type='app-status']").classList.remove("disabled")

        document.querySelector(`[data-menu='menu-restart-${moduleName}']`)?.classList.add("disabled")
        document.querySelector(`[data-menu='menu-stop-${moduleName}']`)?.classList.add("disabled")

        document.querySelector(`[data-download-process=${moduleName}]`)?.classList.remove("disabled")
        document.querySelector(`[data-start-process=${moduleName}]`)?.classList.add("disabled")
    })

    ipcRenderer.on('notStartedModule', (event, data) => { 
        const moduleName = data;

        document.querySelector("div[data-module='" + moduleName + "']").querySelector("div[data-project-type='app-status']").classList.remove("disabled")

        document.querySelector(`[data-menu='menu-restart-${moduleName}']`)?.classList.add("disabled")
        document.querySelector(`[data-menu='menu-stop-${moduleName}']`)?.classList.add("disabled")

        document.querySelector(`[data-download-process=${moduleName}]`)?.classList.add("disabled")
        document.querySelector(`[data-start-process=${moduleName}]`)?.classList.remove("disabled")
    })


    window.onbeforeunload = (e) => {
        // ipcRenderer.send("dom:reloading")
        // console.log("Hi")
        //     // Unlike usual browsers that a message box will be prompted to users, returning
        //     // a non-void value will silently cancel the close.
        //     // It is recommended to use the dialog API to let the user confirm closing the
        //     // application.
        // e.returnValue = true // equivalent to `return false` but not recommended
        // e.returnValue = true
    }

    // window.addEventListener('beforeunload', (e) => {
    //     // globalShortcut.unregister('F5', reload);
    //     // globalShortcut.unregister('CommandOrControl+R', reload);
    //     console.log("Bye")
    //     e.returnValue = true
    // })

    document.querySelector('[data-restart-process]').addEventListener('click', function () {
        const process = this.dataset.restartProcess
        if (process == "ggbook") ipcRenderer.send('restartModuleGGBook')
    })
    document.querySelector('[data-stop-process]').addEventListener('click', function () {
        const process = this.dataset.stopProcess
        if (process == "ggbook") ipcRenderer.send('stopModuleGGBook')
    })
    document.querySelector('[data-start-process]').addEventListener('click', function () {
        const process = this.dataset.startProcess
        if (process == "ggbook") ipcRenderer.send('startModuleGGBook')
    })

    document.querySelector('[data-download-process]').addEventListener('click', function () {
        const process = this.dataset.downloadProcess
        if (process == "ggbook") ipcRenderer.send('downloadModuleGGBook')
    })
    document.querySelector('[data-startup-process]')?.addEventListener('click', function () {
        const process = this.dataset.startupProcess
        if (process == "ggbook") ipcRenderer.send('setModuleGGBookStartup')
    })
});