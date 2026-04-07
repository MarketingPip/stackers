// preload.js (Electron Preload Script)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  writeToFile: (filePath, content) => ipcRenderer.invoke('write-to-file', filePath, content),
  call: (method, ...args) => ipcRenderer.invoke(method, args),
  on: (callback, ...args) => ipcRenderer.on('emit', method, args)
});

 
