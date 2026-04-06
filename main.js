const { app, BrowserWindow } = require('electron');
const path = require('path');


app.disableHardwareAcceleration();

function createWindow() {
const win = new BrowserWindow({
  width: 900,
  height: 1000,
  backgroundColor: "#000000",
  webPreferences: {
    contextIsolation: true,
    sandbox: false
  }
});

  win.loadFile('index.html');

  // Optional: open dev tools in dev
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
