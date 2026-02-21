const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  scanFolder: (folderPath) => ipcRenderer.invoke('scan-folder', folderPath),
  convertVideo: (params) => ipcRenderer.invoke('convert-video', params),
  getVideoInfo: (videoPath) => ipcRenderer.invoke('get-video-info', videoPath),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  getVideoUrl: (filePath) => ipcRenderer.invoke('get-video-url', filePath),
  onConversionProgress: (callback) => {
    ipcRenderer.on('conversion-progress', (event, data) => callback(data));
  },
  removeConversionProgressListener: () => {
    ipcRenderer.removeAllListeners('conversion-progress');
  },
  // 日誌相關方法
  getLogFile: () => ipcRenderer.invoke('get-log-file'),
  getAllLogs: () => ipcRenderer.invoke('get-all-logs'),
  onLogUpdate: (callback) => {
    ipcRenderer.on('logger:update', (event, data) => callback(data));
  },
  onLogProgress: (callback) => {
    ipcRenderer.on('logger:progress', (event, data) => callback(data));
  },
  subscribeToLogs: () => {
    ipcRenderer.send('logger:subscribe');
  },
  removeLogListeners: () => {
    ipcRenderer.removeAllListeners('logger:update');
    ipcRenderer.removeAllListeners('logger:progress');
  }
});
