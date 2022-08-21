// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron')


window.addEventListener('DOMContentLoaded', () => {
  console.log("test4");

  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

process.once('loaded', () => {
  window.addEventListener('message', evt => {
    if (evt.data.type === 'select-dirs') {
      ipcRenderer.send('select-dirs')
    }
    if (evt.data.type === 'converter') {
      let video = document.getElementById('video').textContent;
      let sound = document.getElementById('sound').textContent;
      let sub = document.getElementById('sub').textContent;
      ipcRenderer.send('converter', { video, sound, sub })
    }
  })
})



contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => ipcRenderer.invoke(channel, data),
  handle: (channel, callable, event, data) => ipcRenderer.on(channel, callable(event, data))
})

