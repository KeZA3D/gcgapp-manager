const electron = require("electron")
const fs = require("fs")
const ipcRenderer = electron.ipcRenderer;
document.addEventListener('DOMContentLoaded', () => {
    const oldHTML = document.querySelector(".page-content").innerHTML
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
        if (data == "setup") {
            document.querySelector("[data-title='ggbook']").innerHTML = "GGBook: Setup Mode"
            document.querySelectorAll("[data-mode='setup']").forEach(element => {
                element.classList.remove("disabled")
            });
            document.querySelectorAll("[data-mode='worker']").forEach(element => {
                element.classList.add("disabled")
            });
        } else {
            document.querySelector("[data-title='ggbook']").innerHTML = "GGBook"
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
            document.querySelector("[data-title='ggbook']").innerHTML = "GGBook: Setup Mode"
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
            document.querySelector("[data-title='ggbook']").innerHTML = "GGBook"
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

    ipcRenderer.on('process:restart', (event, data) => {
        document.querySelector(".page-content").innerHTML = oldHTML
    });

    window.onbeforeunload = (e) => {
        ipcRenderer.send("dom:reloading")
        console.log("Hi")
        //     // Unlike usual browsers that a message box will be prompted to users, returning
        //     // a non-void value will silently cancel the close.
        //     // It is recommended to use the dialog API to let the user confirm closing the
        //     // application.
        // e.returnValue = true // equivalent to `return false` but not recommended
    }

    window.addEventListener('beforeunload', () => {
        // globalShortcut.unregister('F5', reload);
        // globalShortcut.unregister('CommandOrControl+R', reload);
        console.log("Bye")
    })

});