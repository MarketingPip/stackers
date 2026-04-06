const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
let mainWindow;

app.disableHardwareAcceleration();

// Catch any uncaught errors in the main process
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  app.quit();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  app.quit();
});

async function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 900,
      height: 1000,
      backgroundColor: '#000000',
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js'), // optional
      },
    });

    await mainWindow.loadFile('index.html'); // await ensures load errors are caught

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (err) {
    console.error('Failed to create window or load file:', err);
    app.quit(); // Quit if something goes wrong
  }
}

// Handle IPC request for writing to file
ipcMain.handle('write-to-file', (event, filePath, content) => {
  fs.writeFileSync(filePath, content);
  return `File written to ${filePath}`;
});

// Wrap app startup in try/catch
app.whenReady()
  .then(() => createWindow())
  .catch((err) => {
    console.error('Error during app startup:', err);
    app.quit();
  });

// macOS: recreate window on dock icon click
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Quit app on all windows closed (Windows/Linux/macOS)
app.on('window-all-closed', () => {
  app.quit();
});
