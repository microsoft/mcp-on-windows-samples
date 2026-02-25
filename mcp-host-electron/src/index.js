const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { MCPService } = require('./mcpService');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize MCP service
const mcpService = new MCPService();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// IPC Handlers for MCP operations
ipcMain.handle('mcp:fetchServers', async () => {
  try {
    const servers = await mcpService.fetchServerList();
    return { success: true, servers };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:provisionAgentUser', async (event, server) => {
  try {
    await mcpService.provisionAgentUser(server);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:connectToServer', async (event, server) => {
  try {
    const result = await mcpService.connectToServer(server);
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:listTools', async () => {
  try {
    const tools = await mcpService.listTools();
    return { success: true, tools };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:callTool', async (event, toolName, parameters) => {
  try {
    const result = await mcpService.callTool(toolName, parameters);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:disconnect', async () => {
  try {
    await mcpService.disconnect();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mcp:isConnected', async () => {
  return { connected: mcpService.isConnected() };
});
