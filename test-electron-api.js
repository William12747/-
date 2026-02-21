/**
 * Electron API 單元測試
 * 這個測試文件用於檢查 Electron IPC 通信是否正常
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

describe('Electron API 測試', () => {
  let mainWindow;
  let testWindow;

  beforeAll(async () => {
    // 等待 Electron 應用程式準備就緒
    await app.whenReady();
  });

  beforeEach(() => {
    // 創建測試視窗
    testWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'electron', 'preload.js')
      }
    });
  });

  afterEach(() => {
    if (testWindow && !testWindow.isDestroyed()) {
      testWindow.close();
    }
  });

  afterAll(() => {
    app.quit();
  });

  test('應該能夠處理 select-folder IPC 調用', async () => {
    // 模擬 dialog.showOpenDialog
    const mockDialog = jest.spyOn(dialog, 'showOpenDialog');
    mockDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\test\\folder']
    });

    // 模擬 IPC 調用
    const result = await new Promise((resolve) => {
      ipcMain.handleOnce('select-folder', async () => {
        const windowToUse = testWindow && !testWindow.isDestroyed() 
          ? testWindow 
          : BrowserWindow.getFocusedWindow();
        
        if (!windowToUse) {
          throw new Error('無法找到有效的視窗');
        }
        
        const dialogResult = await dialog.showOpenDialog(windowToUse, {
          properties: ['openDirectory'],
          title: '選擇輸入資料夾'
        });
        
        if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
          return null;
        }
        
        return dialogResult.filePaths[0];
      });

      // 觸發 IPC 調用
      testWindow.webContents.send('test-select-folder');
      
      setTimeout(() => resolve('test'), 1000);
    });

    mockDialog.mockRestore();
    expect(mockDialog).toHaveBeenCalled();
  });

  test('應該能夠處理 select-output-folder IPC 調用', async () => {
    const mockDialog = jest.spyOn(dialog, 'showOpenDialog');
    mockDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\test\\output']
    });

    const result = await new Promise((resolve) => {
      ipcMain.handleOnce('select-output-folder', async () => {
        const windowToUse = testWindow && !testWindow.isDestroyed() 
          ? testWindow 
          : BrowserWindow.getFocusedWindow();
        
        if (!windowToUse) {
          throw new Error('無法找到有效的視窗');
        }
        
        const dialogResult = await dialog.showOpenDialog(windowToUse, {
          properties: ['openDirectory'],
          title: '選擇輸出資料夾'
        });
        
        if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
          return null;
        }
        
        return dialogResult.filePaths[0];
      });

      testWindow.webContents.send('test-select-output-folder');
      setTimeout(() => resolve('test'), 1000);
    });

    mockDialog.mockRestore();
    expect(mockDialog).toHaveBeenCalled();
  });
});
