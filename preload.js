// preload.js (Electron Preload Script)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  writeToFile: (filePath, content) => ipcRenderer.invoke('write-to-file', filePath, content),
  call: (method, ...args) => ipcRenderer.invoke(method, ...args),
  emit: (signal, ...args) => ipcRenderer.send(signal, ...args),
  on: (channel, callback) => {
    const newCallback = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, newCallback);

    // High-quality tip: Return a cleanup function
    // This allows you to stop listening later if needed
    return () => {
      ipcRenderer.removeListener(channel, newCallback);
    };
  },
});

 
