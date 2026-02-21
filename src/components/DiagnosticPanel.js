import React, { useState, useEffect } from 'react';

function DiagnosticPanel() {
  const [checks, setChecks] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('zh-TW');
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = () => {
    const newChecks = [];

    // 檢查 1: window 對象
    newChecks.push({
      name: 'window 對象',
      passed: typeof window !== 'undefined',
      message: typeof window !== 'undefined' ? 'window 對象存在' : 'window 對象不存在'
    });

    // 檢查 2: electronAPI
    newChecks.push({
      name: 'window.electronAPI',
      passed: typeof window.electronAPI !== 'undefined',
      message: typeof window.electronAPI !== 'undefined' 
        ? 'window.electronAPI 存在' 
        : 'window.electronAPI 不存在 - 這是主要問題！'
    });

    // 檢查 3: 各個 API 方法
    if (window.electronAPI) {
      const methods = [
        'selectFolder',
        'selectOutputFolder',
        'scanFolder',
        'convertVideo',
        'getVideoInfo',
        'openFileDialog',
        'getVideoUrl',
        'onConversionProgress',
        'removeConversionProgressListener'
      ];

      methods.forEach(method => {
        newChecks.push({
          name: `electronAPI.${method}`,
          passed: typeof window.electronAPI[method] === 'function',
          message: typeof window.electronAPI[method] === 'function'
            ? `${method} 方法存在`
            : `${method} 方法不存在或不是函數`
        });
      });
    }

    setChecks(newChecks);
  };

  const testSelectFolder = async () => {
    addLog('開始測試 selectFolder...', 'info');
    setTestResult(null);

    if (!window.electronAPI) {
      setTestResult({ success: false, message: 'window.electronAPI 不存在' });
      addLog('window.electronAPI 不存在', 'error');
      return;
    }

    if (typeof window.electronAPI.selectFolder !== 'function') {
      setTestResult({ success: false, message: 'selectFolder 方法不存在' });
      addLog('selectFolder 方法不存在', 'error');
      return;
    }

    try {
      addLog('調用 window.electronAPI.selectFolder()...', 'info');
      const result = await window.electronAPI.selectFolder();
      addLog(`返回結果: ${result || 'null'}`, result ? 'success' : 'warning');
      
      if (result) {
        setTestResult({ success: true, message: `成功！選擇的資料夾: ${result}` });
      } else {
        setTestResult({ success: false, message: '返回 null（用戶可能取消了選擇）' });
      }
    } catch (error) {
      setTestResult({ success: false, message: `錯誤: ${error.message}` });
      addLog(`錯誤: ${error.message}`, 'error');
      addLog(`錯誤堆疊: ${error.stack}`, 'error');
    }
  };

  const testSelectOutputFolder = async () => {
    addLog('開始測試 selectOutputFolder...', 'info');
    setTestResult(null);

    if (!window.electronAPI) {
      setTestResult({ success: false, message: 'window.electronAPI 不存在' });
      addLog('window.electronAPI 不存在', 'error');
      return;
    }

    if (typeof window.electronAPI.selectOutputFolder !== 'function') {
      setTestResult({ success: false, message: 'selectOutputFolder 方法不存在' });
      addLog('selectOutputFolder 方法不存在', 'error');
      return;
    }

    try {
      addLog('調用 window.electronAPI.selectOutputFolder()...', 'info');
      const result = await window.electronAPI.selectOutputFolder();
      addLog(`返回結果: ${result || 'null'}`, result ? 'success' : 'warning');
      
      if (result) {
        setTestResult({ success: true, message: `成功！選擇的資料夾: ${result}` });
      } else {
        setTestResult({ success: false, message: '返回 null（用戶可能取消了選擇）' });
      }
    } catch (error) {
      setTestResult({ success: false, message: `錯誤: ${error.message}` });
      addLog(`錯誤: ${error.message}`, 'error');
      addLog(`錯誤堆疊: ${error.stack}`, 'error');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f5f5f5', 
      borderRadius: '8px', 
      margin: '20px',
      maxWidth: '800px'
    }}>
      <h2>🔍 Electron API 診斷面板</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>環境檢查</h3>
        {checks.map((check, index) => (
          <div 
            key={index}
            style={{
              padding: '10px',
              margin: '5px 0',
              background: check.passed ? '#e8f5e9' : '#ffebee',
              borderLeft: `4px solid ${check.passed ? '#4caf50' : '#f44336'}`,
              borderRadius: '4px'
            }}
          >
            <strong>{check.name}:</strong> {check.passed ? '✅' : '❌'} {check.message}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>功能測試</h3>
        <button 
          onClick={testSelectFolder}
          style={{
            padding: '10px 20px',
            margin: '5px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          測試選擇輸入資料夾
        </button>
        <button 
          onClick={testSelectOutputFolder}
          style={{
            padding: '10px 20px',
            margin: '5px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          測試選擇輸出資料夾
        </button>
        
        {testResult && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            background: testResult.success ? '#e8f5e9' : '#ffebee',
            borderLeft: `4px solid ${testResult.success ? '#4caf50' : '#f44336'}`,
            borderRadius: '4px'
          }}>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </div>
        )}
      </div>

      <div>
        <h3>日誌</h3>
        <div style={{
          background: '#263238',
          color: '#aed581',
          padding: '15px',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              [{log.timestamp}] {log.type === 'error' ? '❌' : log.type === 'success' ? '✅' : 'ℹ️'} {log.message}
            </div>
          ))}
        </div>
        <button 
          onClick={() => setLogs([])}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          清除日誌
        </button>
      </div>
    </div>
  );
}

export default DiagnosticPanel;
