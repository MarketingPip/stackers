// Neutralino Initialization
Neutralino.init();

// --- ARCADE SETUP ---
const args = NL_ARGS.slice(1);
const isArcadeMode = args.includes('--fullscreen') || args.includes('--arcade');

// Sync window with flags
if (isArcadeMode) {
    Neutralino.window.setFullScreen();
    Neutralino.window.setAlwaysOnTop(true);
}

/**
 * Helper to resolve paths to the userData folder equivalent
 * Neutralino uses NL_PATH (app folder) or NL_APP_DATA (system app data)
 */
async function getSafePath(fileName) {
    return `${NL_APP_DATA}/arcade-game/${fileName}`;
}

/**
 * Replaces ipcMain.handle('write-to-file')
 */
async function writeToFile(fileName, content) {
    const fullPath = await getSafePath(fileName);
    // Ensure directory exists
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    try { await Neutralino.filesystem.createDirectory(dir); } catch(e) {}
    
    await Neutralino.filesystem.writeFile(fullPath, content);
    return `File written to ${fullPath}`;
}

/**
 * Replaces ipcMain.handle('read-from-file')
 */
async function readFromFile(fileName) {
    try {
        const fullPath = await getSafePath(fileName);
        const data = await Neutralino.filesystem.readFile(fullPath);
        return fileName.endsWith(".json") ? JSON.parse(data) : data;
    } catch (error) {
        console.error('Error reading file:', error);
        return { error: 'Error reading file' };
    }
}

/**
 * ARCADE EXIT LOGIC
 */
Neutralino.events.on('windowClose', () => {
    Neutralino.app.exit();
});

window.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape') {
        await Neutralino.app.exit();
    }
});

// Handle 'second-instance' equivalent
Neutralino.events.on('appClientConnect', () => {
    Neutralino.window.show();
    Neutralino.window.focus();
});
