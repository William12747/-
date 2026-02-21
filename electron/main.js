const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');
const { scanFolder, convertVideo, getVideoInfo } = require('./videoProcessor');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(__dirname, '../public/icon.png')
  });

  // 初始化日誌系統
  logger.setMainWindow(mainWindow);
  logger.log('Main', '主窗口已建立，日誌系統已初始化');

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    // 檢查是否要載入診斷頁面
    if (process.argv.includes('--diagnostic')) {
      mainWindow.loadFile(path.join(__dirname, '../test-diagnostic.html'));
    } else {
      mainWindow.loadURL('http://localhost:3000');
    }
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  try {
    // 嘗試使用 mainWindow，如果不存在則使用當前聚焦的視窗
    const windowToUse = mainWindow && !mainWindow.isDestroyed() 
      ? mainWindow 
      : BrowserWindow.getFocusedWindow();
    
    if (!windowToUse) {
      console.error('無法找到有效的視窗來顯示對話框');
      throw new Error('無法找到有效的視窗');
    }
    
    const result = await dialog.showOpenDialog(windowToUse, {
      properties: ['openDirectory'],
      title: '選擇輸入資料夾'
    });
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('選擇資料夾時發生錯誤:', error);
    throw error;
  }
});

ipcMain.handle('select-output-folder', async () => {
  try {
    // 嘗試使用 mainWindow，如果不存在則使用當前聚焦的視窗
    const windowToUse = mainWindow && !mainWindow.isDestroyed() 
      ? mainWindow 
      : BrowserWindow.getFocusedWindow();
    
    if (!windowToUse) {
      console.error('無法找到有效的視窗來顯示對話框');
      throw new Error('無法找到有效的視窗');
    }
    
    const result = await dialog.showOpenDialog(windowToUse, {
      properties: ['openDirectory'],
      title: '選擇輸出資料夾'
    });
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('選擇資料夾時發生錯誤:', error);
    throw error;
  }
});

ipcMain.handle('scan-folder', async (event, folderPath) => {
  try {
    const files = await scanFolder(folderPath);
    return { success: true, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('convert-video', async (event, { inputPath, outputPath, onProgress }) => {
  logger.log('IPC', '========== convert-video IPC 處理開始 ==========');
  logger.log('IPC', '接收參數', { inputPath, outputPath });
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    logger.log('IPC', '檢查點 1: 驗證輸入參數');
    if (!inputPath) {
      throw new Error('未提供輸入路徑');
    }
    if (!outputPath) {
      throw new Error('未提供輸出路徑');
    }
    
    // 智能處理輸出路徑
    logger.log('IPC', '檢查點 2: 處理輸出路徑...');
    let finalOutputPath = outputPath;
    
    // 檢查輸出路徑是資料夾還是文件
    try {
      const outputStat = fs.statSync(outputPath);
      if (outputStat.isDirectory()) {
        // 如果是資料夾，從輸入路徑提取文件名並生成輸出路徑
        const inputFileName = path.basename(inputPath);
        const nameWithoutExt = path.parse(inputFileName).name;
        finalOutputPath = path.join(outputPath, `${nameWithoutExt}.mp4`);
        logger.log('IPC', '輸出路徑是資料夾，自動生成文件路徑: ' + finalOutputPath);
      } else {
        // 如果是文件但沒有副檔名，添加 .mp4
        if (!path.extname(finalOutputPath)) {
          finalOutputPath = `${finalOutputPath}.mp4`;
          logger.log('IPC', '輸出路徑沒有副檔名，自動添加 .mp4: ' + finalOutputPath);
        }
      }
    } catch (err) {
      // 路徑不存在，檢查是否有副檔名
      if (!path.extname(finalOutputPath)) {
        finalOutputPath = `${finalOutputPath}.mp4`;
        logger.log('IPC', '輸出路徑不存在且沒有副檔名，自動添加 .mp4: ' + finalOutputPath);
      }
    }
    
    logger.log('IPC', '最終輸出路徑: ' + finalOutputPath);
    
    // 檢查輸入路徑
    logger.log('IPC', '檢查點 3: 檢查輸入路徑...');
    
    if (!fs.existsSync(inputPath)) {
      throw new Error(`輸入文件不存在: ${inputPath}`);
    }
    logger.log('IPC', '✅ 輸入文件存在');
    
    // 檢查文件是否可讀
    try {
      fs.accessSync(inputPath, fs.constants.R_OK);
      logger.log('IPC', '✅ 輸入文件可讀');
    } catch (err) {
      throw new Error(`無法讀取輸入文件: ${err.message}`);
    }
    
    logger.log('IPC', '檢查點 4: 調用 convertVideo 函數...');
    const startTime = Date.now();
    
    await convertVideo(inputPath, finalOutputPath, (progress) => {
      // 通過 IPC 發送進度更新到渲染進程
      try {
        mainWindow.webContents.send('conversion-progress', {
          inputPath: inputPath,
          progress: progress
        });
      } catch (error) {
        logger.error('IPC', '發送進度更新失敗', error);
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.log('IPC', '✅ 轉換完成', { 耗時秒數: duration });
    
    return { success: true, outputPath: finalOutputPath };
  } catch (error) {
    logger.error('IPC', '轉換視頻失敗', error);
    return { success: false, error: error.message };
  }
});
    
ipcMain.handle('get-video-info', async (event, videoPath) => {
  try {
    const info = await getVideoInfo(videoPath);
    return { success: true, info };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-file-dialog', async () => {
  const windowToUse = mainWindow && !mainWindow.isDestroyed() 
    ? mainWindow 
    : BrowserWindow.getFocusedWindow();
  
  if (!windowToUse) {
    console.error('[IPC] 無法找到有效的視窗來顯示文件對話框');
    return null;
  }
  
  const result = await dialog.showOpenDialog(windowToUse, {
    properties: ['openFile', 'openDirectory'], // 允許選擇文件和資料夾
    title: '選擇要轉換的影片文件或資料夾',
    filters: [
      { name: '所有文件', extensions: ['*'] }, // 將所有文件放在第一位
      { name: '支援的影片格式', extensions: ['flv', 'asf', 'rmvb', 'mpeg', 'mpg', 'wmv', 'avi', 'mp4', 'mov', 'mkv'] }
    ]
  });
  
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  
  return result.filePaths[0];
});

// 日誌相關的 IPC 處理器
ipcMain.handle('get-log-file', async () => {
  logger.log('IPC', '獲取日誌文件路徑');
  return logger.getLogFilePath();
});

ipcMain.handle('get-all-logs', async () => {
  logger.log('IPC', '獲取所有日誌');
  return logger.getAllLogs();
});

ipcMain.on('logger:subscribe', (event) => {
  logger.log('IPC', '客戶端已訂閱日誌更新');
  // 監聽器已在 logger 中添加
});

ipcMain.handle('get-video-url', async (event, filePath) => {
  // 在 Electron 中，我们需要将文件路径转换为可访问的 URL
  // 使用 file:// 协议，但需要正确处理路径分隔符
  if (process.platform === 'win32') {
    return `file:///${filePath.replace(/\\/g, '/')}`;
  } else {
    return `file://${filePath}`;
  }
});
