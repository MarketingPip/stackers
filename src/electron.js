const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// --- ARCADE SETUP ---
// Check if launched with --fullscreen or --arcade flags
const args = process.argv.slice(1);
const isArcadeMode = args.includes('--fullscreen') || args.includes('--arcade');

// Prevent multiple instances (crucial for arcade front-ends)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

const USER_DATA_PATH = app.getPath('userData');

// Default settings
const defaultSettings = {
  sound_enabled: true,
  highscore: 0,
  fullscreen: isArcadeMode, // Sync default with launch flag
  free_play: false, // if free play is true - do not show insert credits message. 
  rotation: false,
  grid_rows: 15,
  grid_columns: 7,
  major_prize_row: 0,
  minor_prize_row: 4,
};

// emit events from nodejs back to HTML
function emit(method, ...args) {
  if (mainWindow) {
    mainWindow.webContents.send(method, ...args);
  }
}

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

// Function to create the window
async function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 900,
      height: 1000,
      backgroundColor: '#000000',
      fullscreen: isArcadeMode,    // Start in fullscreen if requested
      autoHideMenuBar: true,       // Native look for Arcade cabinets
      alwaysOnTop: isArcadeMode,   // Keeps focus in arcade environments
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        preload: path.join(__dirname, 'preload.js'), 
      },
    });

    // --- ARCADE EXIT LOGIC ---
    // Listen for the Escape key to close the app (standard arcade behavior)
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'Escape' && input.type === 'keyDown') {
        app.quit();
      }
    });

    const indexPath = path.join(__dirname, 'dist', 'game.html');
    await mainWindow.loadFile(indexPath);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } catch (err) {
    console.error('Failed to create window or load file:', err);
    app.quit();
  }
}

// Helper to resolve paths to the userData folder safely
function getSafePath(fileName) {
  return path.join(USER_DATA_PATH, fileName);
}

function ensureSettingsFile() {
  const settingsPath = getSafePath('settings.json');
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    console.log('Settings file created at:', settingsPath);
  }
}

// --- IPC HANDLERS ---

ipcMain.handle('write-to-file', (event, fileName, content) => {
  const fullPath = getSafePath(fileName);
  fs.writeFileSync(fullPath, content);
  return `File written to ${fullPath}`;
});

ipcMain.handle('read-from-file', (event, fileName) => {
  try {
    const fullPath = getSafePath(fileName);
    const data = fs.readFileSync(fullPath, 'utf-8');
    
    if (fileName.endsWith(".json")) {
      return JSON.parse(data);
    }
    return data;
  } catch (error) {
    console.error('Error reading file:', error);
    return { error: 'Error reading file' };
  }
});

// Wrap app startup
app.whenReady()
  .then(() => {
    ensureSettingsFile();
    createWindow();
  })
  .catch((err) => {
    console.error('Error during app startup:', err);
    app.quit();
  });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
