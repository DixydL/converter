// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
// const { ipcMain } = require('electron/main');

document.getElementById('dirs').addEventListener('click', (evt) => {
    evt.preventDefault()
    window.postMessage({
        type: 'select-dirs',
    })
})

window.api.handle('custom-endpoint', (event, data) => function (event, data) {
    let dir = data.filePaths[0];
    document.getElementById('video').textContent = dir;
    console.log()
}, event);