import React from 'react';
import './ControlPanel.css';

function ControlPanel({ 
  onStart, 
  onPause, 
  onResume, 
  onStop, 
  isProcessing, 
  isPaused,
  disabled,
  stats 
}) {
  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ControlPanel] 開始轉換按鈕被點擊');
    console.log('[ControlPanel] disabled:', disabled);
    console.log('[ControlPanel] isProcessing:', isProcessing);
    console.log('[ControlPanel] onStart 函數:', typeof onStart);
    
    if (disabled) {
      console.warn('[ControlPanel] 按鈕被禁用，無法執行');
      alert('請先選擇輸出資料夾');
      return;
    }
    
    if (!onStart) {
      console.error('[ControlPanel] onStart 回調函數不存在');
      return;
    }
    
    console.log('[ControlPanel] 調用 onStart 回調函數');
    onStart(e);
  };

  return (
    <div className="control-panel">
      <div className="control-buttons">
        {!isProcessing && (
          <button 
            className="btn btn-start" 
            onClick={handleStart}
            disabled={disabled}
            type="button"
            style={{
              position: 'relative',
              zIndex: 10,
              pointerEvents: disabled ? 'none' : 'auto'
            }}
          >
            ▶️ 開始轉換
          </button>
        )}
        
        {isProcessing && !isPaused && (
          <button 
            className="btn btn-pause" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[ControlPanel] 暫停按鈕被點擊');
              onPause && onPause(e);
            }}
            type="button"
            style={{ position: 'relative', zIndex: 10 }}
          >
            ⏸️ 暫停
          </button>
        )}
        
        {isProcessing && isPaused && (
          <button 
            className="btn btn-resume" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[ControlPanel] 繼續按鈕被點擊');
              onResume && onResume(e);
            }}
            type="button"
            style={{ position: 'relative', zIndex: 10 }}
          >
            ▶️ 繼續
          </button>
        )}
        
        {isProcessing && (
          <button 
            className="btn btn-stop" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[ControlPanel] 停止按鈕被點擊');
              onStop && onStop(e);
            }}
            type="button"
            style={{ position: 'relative', zIndex: 10 }}
          >
            ⏹️ 停止
          </button>
        )}
      </div>

      {stats && (
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">總計:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item stat-success">
            <span className="stat-label">已完成:</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
          <div className="stat-item stat-processing">
            <span className="stat-label">處理中:</span>
            <span className="stat-value">{stats.processing}</span>
          </div>
          <div className="stat-item stat-failed">
            <span className="stat-label">失敗:</span>
            <span className="stat-value">{stats.failed}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ControlPanel;
