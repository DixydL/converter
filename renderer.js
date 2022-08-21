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

document.getElementById("converter").addEventListener("click", run);

function run() {
    document.getElementById('status').textContent = "Йде конвертування";

    window.postMessage({
        type: 'converter',
    })
}

window.api.handle('custom-endpoint', (event, data) => function (event, data) {
    let video = data.video;
    let sound = data.sound;
    let sub = data.sub;
    document.getElementById('video').textContent = video;
    document.getElementById('sound').textContent = sound;
    document.getElementById('sub').textContent = sub;
    console.log()
}, event);

window.api.handle('finish', (event, data) => function (event, data) {
    document.getElementById('status').textContent = "Завершено: " + data;
    console.log()
}, event);