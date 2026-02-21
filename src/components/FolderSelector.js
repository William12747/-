import React from 'react';
import './FolderSelector.css';

function FolderSelector({ label, folder, onSelect, onScan, isScanning, disabled }) {
  const handleSelectClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`[FolderSelector] ${label} - 按鈕被點擊`);
    
    if (disabled) {
      console.warn(`[FolderSelector] ${label} - 按鈕被禁用，無法執行`);
      return;
    }
    
    if (!onSelect) {
      console.error(`[FolderSelector] ${label} - onSelect 回調函數不存在`);
      return;
    }
    
    console.log(`[FolderSelector] ${label} - 調用 onSelect 回調函數`);
    onSelect(e);
  };

  return (
    <div className="folder-selector">
      <label className="folder-label">{label}</label>
      <div className="folder-controls">
        <button 
          className="btn btn-primary" 
          onClick={handleSelectClick}
          disabled={disabled}
          type="button"
        >
          {folder ? '更改資料夾' : '選擇資料夾'}
        </button>
        {onScan && (
          <button 
            className="btn btn-secondary" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(`[FolderSelector] ${label} - 掃描按鈕被點擊`);
              onScan(e);
            }}
            disabled={disabled || isScanning}
            type="button"
          >
            {isScanning ? '掃描中...' : '掃描影片檔案'}
          </button>
        )}
      </div>
      {folder && (
        <div className="folder-path">
          <span className="path-icon">📁</span>
          <span className="path-text" title={folder}>{folder}</span>
        </div>
      )}
    </div>
  );
}

export default FolderSelector;
