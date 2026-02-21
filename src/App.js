import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import FolderSelector from './components/FolderSelector';
import QueueList from './components/QueueList';
import ControlPanel from './components/ControlPanel';
import PreviewPlayer from './components/PreviewPlayer';
import FailedList from './components/FailedList';
import DiagnosticPanel from './components/DiagnosticPanel';
import ConversionTestPanel from './components/ConversionTestPanel';
import LogViewer from './components/LogViewer';

const STATUS = {
  PENDING: 'pending',
  SCANNING: 'scanning',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

function App() {
  const [inputFolder, setInputFolder] = useState(null);
  const [outputFolder, setOutputFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentProcessing, setCurrentProcessing] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [failedFiles, setFailedFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [showConversionTest, setShowConversionTest] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // 使用 ref 來追蹤處理狀態，避免閉包問題
  const isProcessingRef = useRef(false);
  const isPausedRef = useRef(false);
  const queueRef = useRef([]);

  // 同步 queue 到 ref，以便在異步函數中訪問
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // 監聽轉換進度
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onConversionProgress((data) => {
        const timestamp = new Date().toLocaleTimeString('zh-TW');
        console.log(`[${timestamp}] 📊 進度更新:`, {
          文件: data.inputPath.split(/[/\\]/).pop(),
          進度: `${Math.round(data.progress.percent || 0)}%`,
          時間標記: data.progress.timemark,
          位元率: data.progress.currentKbps ? `${Math.round(data.progress.currentKbps)} kbps` : 'N/A'
        });
        
        setQueue(prev => prev.map(item => {
          if (item.inputPath === data.inputPath) {
            return { 
              ...item, 
              progress: {
                ...data.progress,
                lastUpdate: Date.now() // 記錄最後更新時間
              }
            };
          }
          return item;
        }));
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeConversionProgressListener();
      }
    };
  }, []);

  // 監聽日誌更新
  useEffect(() => {
    if (window.electronAPI) {
      // 訂閱日誌
      window.electronAPI.subscribeToLogs();

      // 監聽日誌更新
      window.electronAPI.onLogUpdate((logEntry) => {
        setLogs(prev => {
          // 限制日誌數量不超過 500 條
          const newLogs = [...prev, logEntry];
          return newLogs.slice(-500);
        });
        setShowLogs(true); // 自動展開日誌查看器
      });

      // 監聽進度更新
      window.electronAPI.onLogProgress((logEntry) => {
        setLogs(prev => {
          const newLogs = [...prev, logEntry];
          return newLogs.slice(-500);
        });
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeLogListeners();
      }
    };
  }, []);

  const handleSelectInputFolder = async (e) => {
    // 防止事件冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('=== 開始選擇輸入資料夾 ===');
    console.log('1. 檢查 window.electronAPI...');
    
    if (!window.electronAPI) {
      const errorMsg = 'Electron API 不可用，請確認應用程式已正確啟動';
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }
    
    console.log('✅ window.electronAPI 存在');
    console.log('2. 檢查 selectFolder 方法...');
    
    if (typeof window.electronAPI.selectFolder !== 'function') {
      const errorMsg = 'selectFolder 方法不存在';
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }
    
    console.log('✅ selectFolder 方法存在');
    console.log('3. 調用 selectFolder...');

    try {
      // 顯示載入狀態
      const folder = await window.electronAPI.selectFolder();
      
      console.log('4. 收到結果:', folder);
      
      if (folder) {
        console.log('✅ 成功選擇資料夾:', folder);
        setInputFolder(folder);
        setFiles([]);
        setQueue([]);
        setFailedFiles([]);
        console.log('✅ 狀態已更新');
      } else {
        console.log('ℹ️ 用戶取消了資料夾選擇或返回 null');
      }
    } catch (error) {
      console.error('❌ 選擇資料夾時發生錯誤:');
      console.error('錯誤訊息:', error.message);
      console.error('錯誤堆疊:', error.stack);
      alert(`選擇資料夾時發生錯誤: ${error.message || '未知錯誤'}\n\n請查看控制台獲取詳細資訊。`);
    }
  };

  const handleSelectOutputFolder = async (e) => {
    // 防止事件冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('=== 開始選擇輸出資料夾 ===');
    console.log('1. 檢查 window.electronAPI...');
    
    if (!window.electronAPI) {
      const errorMsg = 'Electron API 不可用，請確認應用程式已正確啟動';
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }
    
    console.log('✅ window.electronAPI 存在');
    console.log('2. 檢查 selectOutputFolder 方法...');
    
    if (typeof window.electronAPI.selectOutputFolder !== 'function') {
      const errorMsg = 'selectOutputFolder 方法不存在';
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }
    
    console.log('✅ selectOutputFolder 方法存在');
    console.log('3. 調用 selectOutputFolder...');

    try {
      const folder = await window.electronAPI.selectOutputFolder();
      
      console.log('4. 收到結果:', folder);
      
      if (folder) {
        console.log('✅ 成功選擇資料夾:', folder);
        setOutputFolder(folder);
        console.log('✅ 狀態已更新');
      } else {
        console.log('ℹ️ 用戶取消了資料夾選擇或返回 null');
      }
    } catch (error) {
      console.error('❌ 選擇資料夾時發生錯誤:');
      console.error('錯誤訊息:', error.message);
      console.error('錯誤堆疊:', error.stack);
      alert(`選擇資料夾時發生錯誤: ${error.message || '未知錯誤'}\n\n請查看控制台獲取詳細資訊。`);
    }
  };

  const handleScanFolder = async () => {
    if (!inputFolder || !window.electronAPI) return;

    setIsScanning(true);
    setFiles([]);
    setQueue([]);

    try {
      const result = await window.electronAPI.scanFolder(inputFolder);
      if (result.success) {
        setFiles(result.files);
        // 初始化佇列
        const newQueue = result.files.map((file, index) => {
          // 處理輸出路徑，確保跨平台相容
          let outputPath = null;
          if (outputFolder) {
            const relativePath = file.relativePath.replace(/\.[^.]+$/, '.mp4');
            // 統一使用正斜線，Electron 會處理平台差異
            const separator = outputFolder.includes('\\') ? '\\' : '/';
            outputPath = `${outputFolder}${separator}${relativePath.replace(/\//g, separator)}`;
          }
          
          return {
            id: index,
            inputPath: file.path,
            outputPath: outputPath,
            name: file.name,
            relativePath: file.relativePath,
            status: STATUS.QUEUED,
            progress: 0
          };
        });
        setQueue(newQueue);
      } else {
        alert(`掃描失敗: ${result.error}`);
      }
    } catch (error) {
      alert(`掃描出錯: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  // 同步 ref 和 state
  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);
  
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const processNext = useCallback(async () => {
    console.log('[processNext] ========== 開始執行 ==========');
    console.log('[processNext] isPaused (ref):', isPausedRef.current);
    console.log('[processNext] isProcessing (ref):', isProcessingRef.current);
    
    // 檢查暫停或停止狀態
    if (isPausedRef.current || !isProcessingRef.current) {
      console.log('[processNext] ⚠️ 已暫停或未在處理中，退出');
      return;
    }

    // 從 ref 中直接訪問最新的隊列（不依賴 setState）
    const currentQueue = queueRef.current;
    console.log('[processNext] 當前佇列長度:', currentQueue.length);
    console.log('[processNext] 佇列狀態:', currentQueue.map(item => ({ 
      name: item.name, 
      status: item.status 
    })));
    
    // 查找待處理項目
    const nextItem = currentQueue.find(item => item.status === STATUS.QUEUED);
    
    if (!nextItem) {
      console.log('[processNext] ✅ 沒有待處理的項目，所有任務完成');
      setIsProcessing(false);
      setCurrentProcessing(null);
      return;
    }

    console.log('[processNext] 找到下一個項目:', nextItem.name);
    console.log('[processNext] 輸入路徑:', nextItem.inputPath);
    console.log('[processNext] 輸出路徑:', nextItem.outputPath);

    // 檢查輸出路徑
    if (!nextItem.outputPath) {
      console.error('[processNext] ❌ 沒有輸出路徑，標記為失敗');
      setQueue(prev => 
        prev.map(item => 
          item.id === nextItem.id 
            ? { ...item, status: STATUS.FAILED, error: '未設定輸出資料夾' }
            : item
        )
      );
      setFailedFiles(prev => [...prev, { ...nextItem, error: '未設定輸出資料夾' }]);
      // 繼續處理下一個
      setTimeout(() => processNext(), 200);
      return;
    }

    // 標記為處理中
    setCurrentProcessing(nextItem);
    setQueue(prev => 
      prev.map(item => 
        item.id === nextItem.id 
          ? { ...item, status: STATUS.PROCESSING }
          : item
      )
    );

    // 異步執行轉換
    try {
      console.log('[processNext] ========== 開始轉換流程 ==========');
      console.log('[processNext] 檔案名稱:', nextItem.name);
      console.log('[processNext] 輸入路徑:', nextItem.inputPath);
      console.log('[processNext] 輸出路徑:', nextItem.outputPath);
      
      if (!window.electronAPI) {
        throw new Error('window.electronAPI 不存在');
      }
      
      if (typeof window.electronAPI.convertVideo !== 'function') {
        throw new Error('convertVideo 方法不存在');
      }
      
      console.log('[processNext] ✅ 檢查點 1 通過: API 可用');
      
      const startTime = Date.now();
      const startTimestamp = new Date().toLocaleTimeString('zh-TW');
      console.log(`[${startTimestamp}] [processNext] 開始轉換時間:`, new Date().toISOString());
      
      // 添加超時檢查
      const timeoutId = setTimeout(() => {
        console.error('[processNext] ⚠️ 警告: convertVideo 調用超過 60 秒未返回');
      }, 60000);
      
      console.log('[processNext] 調用 window.electronAPI.convertVideo...');
      const result = await window.electronAPI.convertVideo({
        inputPath: nextItem.inputPath,
        outputPath: nextItem.outputPath
      });
      
      clearTimeout(timeoutId);
      console.log('[processNext] ✅ convertVideo 已返回');
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      const endTimestamp = new Date().toLocaleTimeString('zh-TW');
      
      console.log(`[${endTimestamp}] [processNext] ✅ 轉換完成，耗時: ${duration} 秒`);
      console.log(`[${endTimestamp}] [processNext] 轉換結果:`, result);

      if (result.success) {
        console.log(`[${endTimestamp}] [processNext] ✅ 轉換成功:`, nextItem.name);
        
        // 更新為已完成
        setQueue(prev =>
          prev.map(item => 
            item.id === nextItem.id 
              ? { ...item, status: STATUS.COMPLETED, progress: 100 }
              : item
          )
        );
        
        // 立即繼續處理下一個
        setTimeout(() => processNext(), 200);
      } else {
        throw new Error(result.error || '轉換失敗');
      }
    } catch (error) {
      console.error('[processNext] ❌ 轉換錯誤:', error);
      console.error('[processNext] 錯誤消息:', error.message);
      console.error('[processNext] 錯誤棧:', error.stack);
      
      // 標記為失敗
      setQueue(prev =>
        prev.map(item => 
          item.id === nextItem.id 
            ? { ...item, status: STATUS.FAILED, error: error.message }
            : item
        )
      );
      
      setFailedFiles(prev => [...prev, { ...nextItem, error: error.message }]);
      
      // 繼續處理下一個
      setTimeout(() => processNext(), 200);
    }
  }, []);

  const handleStart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('=== 開始轉換流程 ===');
    console.log('1. 檢查輸出資料夾...');
    
    if (!outputFolder) {
      const errorMsg = '請先選擇輸出資料夾';
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }
    
    console.log('✅ 輸出資料夾:', outputFolder);
    console.log('2. 檢查佇列...');
    console.log('   佇列長度:', queue.length);
    
    if (queue.length === 0) {
      const errorMsg = '沒有待轉換的檔案，請先掃描影片檔案';
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }
    
    console.log('✅ 佇列中有', queue.length, '個檔案');
    console.log('3. 更新佇列中的輸出路徑...');

    // 更新佇列中的輸出路徑
    setQueue(prev => {
      const updated = prev.map(item => {
        const relativePath = item.relativePath.replace(/\.[^.]+$/, '.mp4');
        // 統一使用正斜線，Electron 會處理平台差異
        const separator = outputFolder.includes('\\') ? '\\' : '/';
        const newOutputPath = `${outputFolder}${separator}${relativePath.replace(/\//g, separator)}`;
        console.log(`   檔案: ${item.name}`);
        console.log(`   輸出路徑: ${newOutputPath}`);
        return {
          ...item,
          outputPath: newOutputPath
        };
      });
      console.log('✅ 佇列已更新');
      return updated;
    });

    console.log('4. 開始處理...');
    
    // 先更新 ref，這樣 processNext 可以立即使用
    isProcessingRef.current = true;
    isPausedRef.current = false;
    
    // 然後更新 state（用於 UI 顯示）
    setIsProcessing(true);
    setIsPaused(false);
    
    // 立即調用 processNext，因為我們已經更新了 ref
    setTimeout(() => {
      console.log('5. 調用 processNext...');
      console.log('   當前佇列狀態:', queue);
      processNext();
    }, 100);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    if (isProcessing) {
      processNext();
    }
  };

  const handleStop = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentProcessing(null);
    setQueue(prev => prev.map(item => 
      item.status === STATUS.PROCESSING 
        ? { ...item, status: STATUS.QUEUED, progress: 0 }
        : item
    ));
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  const handleExportFailedList = () => {
    if (failedFiles.length === 0) return;

    const content = failedFiles.map((file, index) => 
      `${index + 1}. ${file.name}\n   路徑: ${file.inputPath}\n   錯誤: ${file.error || '未知錯誤'}\n`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `失敗清單_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 從入列中移除特定的視頻
  const handleRemoveFromQueue = (itemId) => {
    const itemToRemove = queue.find(item => item.id === itemId);
    if (!itemToRemove) return;

    // 確認刪除
    if (!window.confirm(`確認要移除「${itemToRemove.name}」嗎？`)) {
      return;
    }

    console.log(`[移除入列] 刪除項目: ${itemToRemove.name} (ID: ${itemId})`);
    
    // 從入列中移除
    setQueue(prevQueue => prevQueue.filter(item => item.id !== itemId));
    
    // 如果正在處理中的是這個項目，停止
    if (currentProcessing && currentProcessing.id === itemId) {
      setIsProcessing(false);
      setCurrentProcessing(null);
    }
  };

  // 狀態診斷函數
  const printDiagnosticInfo = () => {
    console.clear();
    console.log('%c=== 🔍 Retro2MP4 應用狀態診斷 ===', 'color: blue; font-size: 16px; font-weight: bold;');
    console.log('%c📂 文件夾設定:', 'color: green; font-weight: bold;');
    console.log('  • 輸入文件夾:', inputFolder || '❌ 未設定');
    console.log('  • 輸出文件夾:', outputFolder || '❌ 未設定');
    
    console.log('%c📋 隊列狀態:', 'color: green; font-weight: bold;');
    console.log('  • 隊列長度:', queue.length);
    console.log('  • 隊列內容:', queue.map(item => ({ 
      name: item.name, 
      status: item.status,
      outputPath: item.outputPath ? '✅' : '❌'
    })));
    
    console.log('%c🎬 轉換狀態:', 'color: green; font-weight: bold;');
    console.log('  • 正在處理:', isProcessing ? '✅ 是' : '❌ 否');
    console.log('  • 已暫停:', isPaused ? '✅ 是' : '❌ 否');
    console.log('  • 當前處理文件:', currentProcessing?.name || '無');
    
    console.log('%c💾 統計數據:', 'color: green; font-weight: bold;');
    const completed = queue.filter(item => item.status === STATUS.COMPLETED).length;
    const processing = queue.filter(item => item.status === STATUS.PROCESSING).length;
    const failed = queue.filter(item => item.status === STATUS.FAILED).length;
    const queued = queue.filter(item => item.status === STATUS.QUEUED).length;
    console.log('  • 已完成:', completed);
    console.log('  • 處理中:', processing);
    console.log('  • 失敗:', failed);
    console.log('  • 等待中:', queued);
    console.log('  • 失敗文件列表:', failedFiles);
    
    console.log('%c🔌 API 檢查:', 'color: green; font-weight: bold;');
    console.log('  • window.electronAPI 存在:', !!window.electronAPI ? '✅' : '❌');
    if (window.electronAPI) {
      console.log('  • convertVideo:', typeof window.electronAPI.convertVideo === 'function' ? '✅' : '❌');
      console.log('  • scanFolder:', typeof window.electronAPI.scanFolder === 'function' ? '✅' : '❌');
    }
  };

  const completedCount = queue.filter(item => item.status === STATUS.COMPLETED).length;
  const failedCount = queue.filter(item => item.status === STATUS.FAILED).length;
  const totalCount = queue.length;
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // 在開發模式下自動檢查 API
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Electron API 檢查 ===');
      console.log('window.electronAPI:', typeof window.electronAPI !== 'undefined' ? '存在' : '不存在');
      if (window.electronAPI) {
        console.log('API 方法:', Object.keys(window.electronAPI));
      } else {
        console.error('❌ window.electronAPI 不存在！這可能是問題所在。');
        console.error('請檢查:');
        console.error('1. electron/main.js 中的 preload 路徑');
        console.error('2. webPreferences 設置');
        console.error('3. 開發者工具控制台的錯誤訊息');
      }
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Retro2MP4 - 影片批量轉換工具</h1>
        <p className="subtitle">Legacy Video Batch Converter</p>
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                printDiagnosticInfo();
                alert('📊 應用狀態已輸出到控制台\n請按 F12 打開開發者工具查看');
              }}
              style={{
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📊 狀態檢查
            </button>
            <button 
              onClick={() => setShowDiagnostic(!showDiagnostic)}
              style={{
                padding: '8px 16px',
                background: showDiagnostic ? '#f44336' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showDiagnostic ? '隱藏診斷面板' : '顯示診斷面板'}
            </button>
            <button 
              onClick={() => setShowConversionTest(!showConversionTest)}
              style={{
                padding: '8px 16px',
                background: showConversionTest ? '#f44336' : '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showConversionTest ? '隱藏轉換測試' : '顯示轉換測試'}
            </button>
          </div>
        )}
      </header>

      <main className="App-main">
        {showDiagnostic && <DiagnosticPanel />}
        {showConversionTest && <ConversionTestPanel />}
        <section className="folder-section">
          <FolderSelector
            label="輸入資料夾"
            folder={inputFolder}
            onSelect={handleSelectInputFolder}
            onScan={handleScanFolder}
            isScanning={isScanning}
            disabled={false}
          />
          
          <FolderSelector
            label="輸出資料夾"
            folder={outputFolder}
            onSelect={handleSelectOutputFolder}
            disabled={false}
          />
        </section>

        {files.length > 0 && (
          <section className="info-section">
            <div className="info-card">
              <h3>掃描結果</h3>
              <p>找到 <strong>{files.length}</strong> 個支援的影片檔案</p>
              <p>輸出格式：<strong>MP4 (H.264 + AAC)</strong></p>
            </div>
            <div className="scanned-files-list">
              <h4>已掃描的影片檔案：</h4>
              <div className="files-grid">
                {files.map((file, index) => (
                  <div key={index} className="scanned-file-item">
                    <span className="file-icon-small">🎬</span>
                    <div className="file-info">
                      <div className="file-name-small" title={file.path}>{file.name}</div>
                      <div className="file-path-small" title={file.path}>{file.relativePath}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {queue.length > 0 && (
          <>
            <ControlPanel
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              isProcessing={isProcessing}
              isPaused={isPaused}
              disabled={!outputFolder}
              stats={{
                total: totalCount,
                completed: completedCount,
                failed: failedCount,
                processing: currentProcessing ? 1 : 0
              }}
            />

            <QueueList
              queue={queue}
              currentProcessing={currentProcessing}
              onPreview={handlePreview}
              onRemove={handleRemoveFromQueue}
            />
          </>
        )}

        {failedFiles.length > 0 && (
          <FailedList
            failedFiles={failedFiles}
            onExport={handleExportFailedList}
          />
        )}

        {/* 日誌查看器 */}
        <LogViewer 
          isVisible={true}
          logs={logs}
        />
      </main>

      {previewFile && (
        <PreviewPlayer
          file={previewFile}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}

export default App;
