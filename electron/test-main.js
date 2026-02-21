/**
 * 主進程測試腳本
 * 用於測試 IPC handlers 是否正確註冊
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// 載入主進程代碼
require('./main.js');

// 測試 IPC handlers
function testIPCHandlers() {
  console.log('\n=== 測試 IPC Handlers ===\n');

  const handlers = [
    'select-folder',
    'select-output-folder',
    'scan-folder',
    'convert-video',
    'get-video-info',
    'open-file-dialog',
    'get-video-url'
  ];

  handlers.forEach(handler => {
    const isRegistered = ipcMain.listenerCount(handler) > 0 || 
                         ipcMain._events && ipcMain._events[handler];
    
    if (isRegistered) {
      console.log(`✅ ${handler}: 已註冊`);
    } else {
      console.log(`❌ ${handler}: 未註冊`);
    }
  });

  console.log('\n=== 測試完成 ===\n');
}

// 等待應用程式準備就緒
app.whenReady().then(() => {
  testIPCHandlers();
  
  // 創建一個測試視窗來測試 dialog
  const testWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 測試 select-folder handler
  setTimeout(async () => {
    console.log('\n=== 測試 select-folder Handler ===\n');
    try {
      // 模擬 IPC 調用
      const result = await ipcMain.handle('select-folder');
      console.log('✅ select-folder 調用成功');
      console.log('結果:', result);
    } catch (error) {
      console.log('❌ select-folder 調用失敗:', error.message);
    }

    // 測試 select-output-folder handler
    console.log('\n=== 測試 select-output-folder Handler ===\n');
    try {
      const result = await ipcMain.handle('select-output-folder');
      console.log('✅ select-output-folder 調用成功');
      console.log('結果:', result);
    } catch (error) {
      console.log('❌ select-output-folder 調用失敗:', error.message);
    }

    // 關閉測試視窗
    testWindow.close();
    app.quit();
  }, 2000);
});
