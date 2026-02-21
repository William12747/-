import React, { useState } from 'react';

function ConversionTestPanel() {
  const [inputPath, setInputPath] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);

  const addLog = (message, type = 'info', timestamp = null) => {
    const ts = timestamp || new Date().toISOString();
    setLogs(prev => [...prev, { timestamp: ts, message, type }]);
    console.log(`[${ts}] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
    setResult(null);
  };

  const selectInputFile = async () => {
    if (!window.electronAPI || typeof window.electronAPI.openFileDialog !== 'function') {
      alert('無法打開文件選擇對話框，請手動輸入路徑');
      return;
    }

    try {
      const selectedPath = await window.electronAPI.openFileDialog();
      if (selectedPath) {
        setInputPath(selectedPath);
        // 簡單判斷：如果路徑沒有副檔名，可能是資料夾
        const hasExtension = /\.\w+$/.test(selectedPath);
        if (!hasExtension) {
          addLog(`已選擇輸入資料夾: ${selectedPath}`, 'success');
          addLog('提示: 如果選擇資料夾，程式會自動掃描其中的影片文件', 'info');
        } else {
          addLog(`已選擇輸入文件: ${selectedPath}`, 'success');
        }
      }
    } catch (error) {
      addLog(`選擇文件時發生錯誤: ${error.message}`, 'error');
    }
  };

  const selectOutputFolder = async () => {
    if (!window.electronAPI || typeof window.electronAPI.selectOutputFolder !== 'function') {
      alert('無法打開資料夾選擇對話框，請手動輸入路徑');
      return;
    }

    try {
      const folderPath = await window.electronAPI.selectOutputFolder();
      if (folderPath) {
        // 如果輸入路徑有文件名，提取文件名並生成輸出路徑
        if (inputPath) {
          const fileName = inputPath.split(/[/\\]/).pop();
          // 移除副檔名（如果有的話）
          const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
          setOutputPath(`${folderPath}\\${nameWithoutExt}.mp4`);
        } else {
          // 如果沒有輸入路徑，只設置資料夾路徑
          setOutputPath(folderPath);
        }
        addLog(`已選擇輸出資料夾: ${folderPath}`, 'success');
      }
    } catch (error) {
      addLog(`選擇資料夾時發生錯誤: ${error.message}`, 'error');
    }
  };

  const testConversion = async () => {
    if (!inputPath || !outputPath) {
      alert('請輸入或選擇輸入和輸出路徑');
      return;
    }

    setIsTesting(true);
    setResult(null);
    clearLogs();

    addLog('========== 開始轉換測試 ==========', 'info');
    addLog(`輸入路徑: ${inputPath}`, 'info');
    addLog(`輸出路徑: ${outputPath}`, 'info');
    addLog('', 'info');

    try {
      // 檢查 API
      addLog('檢查點 1: 檢查 window.electronAPI...', 'info');
      if (!window.electronAPI) {
        throw new Error('window.electronAPI 不存在');
      }
      if (typeof window.electronAPI.convertVideo !== 'function') {
        throw new Error('convertVideo 方法不存在');
      }
      addLog('✅ 檢查點 1 通過: API 可用', 'success');

      // 調用轉換
      addLog('檢查點 2: 調用 convertVideo API...', 'info');
      const startTime = Date.now();
      addLog(`開始時間: ${new Date().toISOString()}`, 'info');

      // 監聽進度
      if (window.electronAPI.onConversionProgress) {
        window.electronAPI.onConversionProgress((data) => {
          addLog(`進度更新: ${JSON.stringify(data)}`, 'info');
        });
      }

      const result = await window.electronAPI.convertVideo({
        inputPath: inputPath,
        outputPath: outputPath
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      addLog(`✅ 檢查點 2 通過: API 調用完成`, 'success');
      addLog(`耗時: ${duration} 秒`, 'info');
      addLog(`結果: ${JSON.stringify(result, null, 2)}`, 'info');

      if (result.success) {
        addLog('✅ 轉換成功！', 'success');
        setResult({ success: true, message: '轉換成功', outputPath: result.outputPath });
      } else {
        addLog(`❌ 轉換失敗: ${result.error}`, 'error');
        setResult({ success: false, message: result.error });
      }
    } catch (error) {
      addLog(`❌ 測試失敗: ${error.message}`, 'error');
      addLog(`錯誤堆疊: ${error.stack}`, 'error');
      setResult({ success: false, message: error.message, stack: error.stack });
    } finally {
      setIsTesting(false);
      addLog('========== 測試完成 ==========', 'info');
    }
  };

  const exportLogs = () => {
    if (logs.length === 0) return;

    const content = logs.map(log => 
      `[${log.timestamp}] ${log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : 'ℹ️'} ${log.message}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `轉換測試日誌_${new Date().toISOString().split('T')[0]}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f5f5f5', 
      borderRadius: '8px', 
      margin: '20px',
      maxWidth: '1000px'
    }}>
      <h2>🧪 轉換測試面板</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        使用此面板測試單個文件的轉換，並查看完整的日誌輸出
      </p>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
            輸入文件路徑:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              placeholder="例如: C:\Users\Rosh\Videos\test.avi"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              disabled={isTesting}
            />
            <button
              onClick={selectInputFile}
              disabled={isTesting}
              style={{
                padding: '10px 20px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isTesting ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              選擇文件
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
            輸出路徑:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
              placeholder="例如: C:\Users\Rosh\Videos\output 或 C:\Users\Rosh\Videos\output.mp4"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
              disabled={isTesting}
            />
            <button
              onClick={selectOutputFolder}
              disabled={isTesting}
              style={{
                padding: '10px 20px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isTesting ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              選擇資料夾
            </button>
          </div>
          <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
            💡 可以是資料夾路徑或完整文件路徑，程式會自動處理
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={testConversion}
            disabled={isTesting || !inputPath || !outputPath}
            style={{
              padding: '10px 20px',
              background: isTesting ? '#ccc' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isTesting ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isTesting ? '測試中...' : '開始測試轉換'}
          </button>

          <button
            onClick={clearLogs}
            disabled={isTesting}
            style={{
              padding: '10px 20px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isTesting ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            清除日誌
          </button>

          {logs.length > 0 && (
            <button
              onClick={exportLogs}
              style={{
                padding: '10px 20px',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              匯出日誌
            </button>
          )}
        </div>
      </div>

      {result && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          background: result.success ? '#e8f5e9' : '#ffebee',
          borderLeft: `4px solid ${result.success ? '#4caf50' : '#f44336'}`,
          borderRadius: '4px'
        }}>
          <strong>{result.success ? '✅' : '❌'} {result.message}</strong>
          {result.outputPath && (
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              輸出文件: {result.outputPath}
            </div>
          )}
          {result.stack && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer' }}>錯誤詳情</summary>
              <pre style={{
                marginTop: '10px',
                padding: '10px',
                background: '#fff',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px'
              }}>{result.stack}</pre>
            </details>
          )}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3>日誌輸出 ({logs.length} 條)</h3>
          {logs.length > 0 && (
            <button
              onClick={() => {
                const logContent = logs.map(log => 
                  `[${log.timestamp}] ${log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : 'ℹ️'} ${log.message}`
                ).join('\n');
                navigator.clipboard.writeText(logContent);
                alert('日誌已複製到剪貼板');
              }}
              style={{
                padding: '5px 10px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              複製所有日誌
            </button>
          )}
        </div>
        <div style={{
          background: '#263238',
          color: '#aed581',
          padding: '15px',
          borderRadius: '4px',
          maxHeight: '500px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.6'
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#666' }}>還沒有日誌，請開始測試...</div>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index}
                style={{
                  marginBottom: '5px',
                  color: log.type === 'error' ? '#f44336' : log.type === 'success' ? '#4caf50' : '#aed581'
                }}
              >
                [{new Date(log.timestamp).toLocaleTimeString('zh-TW')}] {log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : 'ℹ️'} {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversionTestPanel;
