// preload.js (Electron Preload Script)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  writeToFile: (filePath, content) => ipcRenderer.invoke('write-to-file', filePath, content)
});
