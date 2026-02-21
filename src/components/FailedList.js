import React from 'react';
import './FailedList.css';

function FailedList({ failedFiles, onExport }) {
  if (failedFiles.length === 0) return null;

  return (
    <div className="failed-list">
      <div className="failed-header">
        <h2 className="failed-title">
          ❌ 失敗檔案 ({failedFiles.length})
        </h2>
        <button className="btn-export" onClick={onExport}>
          📥 匯出失敗清單
        </button>
      </div>
      <div className="failed-items">
        {failedFiles.map((file, index) => (
          <div key={index} className="failed-item">
            <div className="failed-name">
              <span className="file-icon">🎬</span>
              <span className="name-text" title={file.name}>{file.name}</span>
            </div>
            <div className="failed-path">
              <span className="path-label">路徑:</span>
              <span className="path-value" title={file.inputPath}>
                {file.inputPath}
              </span>
            </div>
            {file.error && (
              <div className="failed-error">
                <span className="error-label">錯誤:</span>
                <span className="error-text">{file.error}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FailedList;
