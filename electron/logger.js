const fs = require('fs');
const path = require('path');
const os = require('os');

class Logger {
  constructor() {
    const logsDir = path.join(os.homedir(), '.retro2mp4', 'logs');
    
    // 確保日誌目錄存在
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // 生成日誌文件名 (包含時間戳)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    this.logFilePath = path.join(logsDir, `conversion-${timestamp}.log`);
    this.mainWindow = null;
    this.listeners = [];
    
    // 寫入日誌開始消息
    this.writeToFile('[Logger] ========== 日誌系統初始化 ==========\n');
    this.writeToFile(`[Logger] 日誌文件: ${this.logFilePath}\n`);
    this.writeToFile(`[Logger] 時間: ${new Date().toISOString()}\n`);
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFilePath, message);
    } catch (error) {
      console.error('寫入日誌文件失敗:', error);
    }
  }

  notifyListeners(logEntry) {
    this.listeners.forEach(callback => {
      try {
        callback(logEntry);
      } catch (error) {
        console.error('通知日誌監聽器時出錯:', error);
      }
    });
  }

  log(module, message, data = null) {
    const timestamp = new Date().toLocaleTimeString('zh-TW');
    const isoTimestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${module}] ${message}`;
    
    if (data) {
      logMessage += '\n' + JSON.stringify(data, null, 2);
    }
    
    logMessage += '\n';

    // 寫入文件
    this.writeToFile(logMessage);

    // 輸出到控制台
    console.log(logMessage);

    // 通知所有監聽器
    const logEntry = {
      timestamp,
      isoTimestamp,
      module,
      message,
      data,
      level: 'info'
    };
    this.notifyListeners(logEntry);

    // 發送給渲染進程 - 這是關鍵，需要確保每次都發送
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.webContents.send('logger:update', logEntry);
      } catch (error) {
        console.error('發送日誌到渲染進程失敗:', error);
      }
    }
  }

  error(module, message, error = null) {
    const timestamp = new Date().toLocaleTimeString('zh-TW');
    const isoTimestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${module}] ❌ 錯誤: ${message}`;
    
    if (error) {
      logMessage += '\n錯誤信息: ' + (error.message || String(error));
      if (error.stack) {
        logMessage += '\n堆棧: ' + error.stack;
      }
    }
    
    logMessage += '\n';

    // 寫入文件
    this.writeToFile(logMessage);

    // 輸出到控制台
    console.error(logMessage);

    // 通知所有監聽器
    const logEntry = {
      timestamp,
      isoTimestamp,
      module,
      message,
      error: error ? (error.message || String(error)) : null,
      level: 'error'
    };
    this.notifyListeners(logEntry);

    // 發送給渲染進程
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.webContents.send('logger:update', logEntry);
      } catch (error) {
        console.error('發送錯誤日誌到渲染進程失敗:', error);
      }
    }
  }

  progress(module, currentFile, percent, additionalInfo = {}) {
    const timestamp = new Date().toLocaleTimeString('zh-TW');
    const isoTimestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      isoTimestamp,
      module,
      message: `進度更新: ${currentFile}`,
      percent: Math.round(percent),
      additionalInfo,
      level: 'progress'
    };

    // 發送給渲染進程 (進度不寫入文件，以免日誌過大)
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        this.mainWindow.webContents.send('logger:progress', logEntry);
      } catch (error) {
        console.error('發送進度更新到渲染進程失敗:', error);
      }
    }
  }

  getLogFilePath() {
    return this.logFilePath;
  }

  getAllLogs() {
    try {
      return fs.readFileSync(this.logFilePath, 'utf-8');
    } catch (error) {
      return `無法讀取日誌文件: ${error.message}`;
    }
  }

  section(title) {
    const separator = '='.repeat(50);
    const logMessage = `\n${separator}\n${title}\n${separator}\n`;
    this.writeToFile(logMessage);
    console.log(logMessage);
  }
}

// 導出單例
module.exports = new Logger();
