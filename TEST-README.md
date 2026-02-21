# 測試和診斷工具說明

## 快速診斷

### 方法 1: 使用應用程式內的診斷面板（推薦）

1. 啟動應用程式（`npm run dev`）
2. 在應用程式頂部點擊「顯示診斷面板」按鈕
3. 診斷面板會顯示：
   - 環境檢查結果
   - Electron API 可用性
   - 各個 API 方法的狀態
   - 功能測試按鈕
   - 詳細日誌

### 方法 2: 使用瀏覽器控制台

1. 啟動應用程式
2. 打開開發者工具（F12 或右鍵 > 檢查）
3. 在 Console 標籤頁中，複製並貼上以下代碼：

```javascript
// 檢查 window.electronAPI
console.log('window.electronAPI:', typeof window.electronAPI !== 'undefined' ? '存在' : '不存在');

if (window.electronAPI) {
  console.log('可用的方法:', Object.keys(window.electronAPI));
  
  // 測試 selectFolder
  window.electronAPI.selectFolder()
    .then(result => console.log('選擇的資料夾:', result))
    .catch(error => console.error('錯誤:', error));
} else {
  console.error('❌ window.electronAPI 不存在！');
}
```

### 方法 3: 使用獨立的診斷頁面

1. 停止當前運行的應用程式
2. 運行：`npm run dev -- --diagnostic`
3. 這會載入獨立的診斷頁面，提供完整的測試功能

## 常見問題診斷

### 問題 1: window.electronAPI 不存在

**可能原因：**
- preload.js 文件路徑不正確
- contextIsolation 設置錯誤
- preload 腳本執行失敗

**解決方法：**
1. 檢查 `electron/main.js` 中的 preload 路徑：
   ```javascript
   preload: path.join(__dirname, 'preload.js')
   ```
2. 確認 `webPreferences` 設置：
   ```javascript
   webPreferences: {
     nodeIntegration: false,
     contextIsolation: true,
     preload: path.join(__dirname, 'preload.js')
   }
   ```
3. 檢查開發者工具控制台是否有錯誤訊息

### 問題 2: selectFolder 返回 null

**可能原因：**
- 用戶取消了對話框
- 對話框沒有正確顯示
- IPC 通信失敗

**診斷步驟：**
1. 使用診斷面板測試
2. 查看日誌中的詳細錯誤訊息
3. 檢查 Electron 主進程的控制台輸出

### 問題 3: 點擊按鈕沒有反應

**可能原因：**
- 事件處理器未正確綁定
- 按鈕被禁用
- JavaScript 錯誤阻止執行

**診斷步驟：**
1. 打開開發者工具
2. 檢查 Console 標籤頁是否有錯誤
3. 檢查 Network 標籤頁確認資源是否正確載入
4. 使用診斷面板測試 API 是否可用

## 測試文件說明

### test-diagnostic.html
獨立的 HTML 診斷頁面，可以在 Electron 中載入進行完整測試。

### test-api-check.js
簡單的檢查腳本，可以在瀏覽器控制台運行。

### test-electron-api.js
單元測試文件（需要 Jest 和 Electron 測試框架）。

### electron/test-main.js
主進程測試腳本，用於測試 IPC handlers。

## 手動測試步驟

1. **檢查 API 是否存在**
   ```javascript
   console.log(window.electronAPI);
   ```

2. **測試 selectFolder**
   ```javascript
   window.electronAPI.selectFolder()
     .then(folder => console.log('選擇的資料夾:', folder))
     .catch(error => console.error('錯誤:', error));
   ```

3. **測試 selectOutputFolder**
   ```javascript
   window.electronAPI.selectOutputFolder()
     .then(folder => console.log('選擇的資料夾:', folder))
     .catch(error => console.error('錯誤:', error));
   ```

## 獲取幫助

如果診斷工具顯示問題，請：
1. 截圖診斷面板的結果
2. 複製控制台的錯誤訊息
3. 檢查 `electron/main.js` 和 `electron/preload.js` 文件
4. 確認所有依賴都已正確安裝
