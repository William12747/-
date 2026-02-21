import React from 'react';
import './QueueList.css';

const STATUS_LABELS = {
  queued: '等待中',
  processing: '處理中',
  paused: '已暫停',
  completed: '已完成',
  failed: '失敗'
};

const STATUS_COLORS = {
  queued: '#cbd5e0',
  processing: '#667eea',
  paused: '#ed8936',
  completed: '#48bb78',
  failed: '#f56565'
};

function QueueList({ queue, currentProcessing, onPreview, onRemove }) {
  if (queue.length === 0) return null;

  return (
    <div className="queue-list">
      <h2 className="queue-title">轉換佇列 ({queue.length})</h2>
      <div className="queue-items">
        {queue.map((item) => {
          const isCurrent = currentProcessing && currentProcessing.id === item.id;
          const canRemove = item.status === 'queued' || item.status === 'failed';
          
          return (
            <div 
              key={item.id} 
              className={`queue-item ${isCurrent ? 'current' : ''} ${item.status}`}
            >
              <div className="queue-item-header">
                <div className="queue-item-name">
                  <span className="file-icon">🎬</span>
                  <span className="name-text" title={item.name}>{item.name}</span>
                </div>
                <div className="queue-item-status" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: STATUS_COLORS[item.status] }}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                  {canRemove && (
                    <button 
                      className="btn-remove"
                      onClick={() => onRemove && onRemove(item.id)}
                      title="從佇列中移除"
                      style={{
                        padding: '4px 8px',
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✕ 移除
                    </button>
                  )}
                </div>
              </div>

              {item.status === 'processing' && item.progress !== undefined && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${item.progress.percent || 0}%` }}
                    />
                  </div>
                  <div className="progress-info">
                    <span className="progress-text">
                      {Math.round(item.progress.percent || 0)}%
                    </span>
                    {item.progress.timemark && (
                      <span className="progress-time" style={{ 
                        fontSize: '0.85rem', 
                        color: '#666', 
                        marginLeft: '10px' 
                      }}>
                        時間: {item.progress.timemark}
                      </span>
                    )}
                    {item.progress.elapsed && (
                      <span className="progress-elapsed" style={{ 
                        fontSize: '0.85rem', 
                        color: '#666', 
                        marginLeft: '10px' 
                      }}>
                        已用: {Math.round(item.progress.elapsed)}秒
                      </span>
                    )}
                    {item.progress.remaining && (
                      <span className="progress-remaining" style={{ 
                        fontSize: '0.85rem', 
                        color: '#666', 
                        marginLeft: '10px' 
                      }}>
                        剩餘: {Math.round(item.progress.remaining)}秒
                      </span>
                    )}
                    {item.progress.currentKbps && (
                      <span className="progress-bitrate" style={{ 
                        fontSize: '0.85rem', 
                        color: '#666', 
                        marginLeft: '10px' 
                      }}>
                        位元率: {Math.round(item.progress.currentKbps)} kbps
                      </span>
                    )}
                    {item.progress.lastUpdate && (
                      <span className="progress-update" style={{ 
                        fontSize: '0.75rem', 
                        color: '#999', 
                        marginLeft: '10px',
                        fontStyle: 'italic'
                      }}>
                        (最後更新: {new Date(item.progress.lastUpdate).toLocaleTimeString('zh-TW')})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {item.status === 'completed' && (
                <div className="queue-item-actions">
                  <button 
                    className="btn-preview"
                    onClick={() => onPreview(item)}
                  >
                    👁️ 預覽
                  </button>
                </div>
              )}

              {item.status === 'failed' && item.error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{item.error}</span>
                </div>
              )}

              <div className="queue-item-path">
                <span className="path-label">輸出:</span>
                <span className="path-value" title={item.outputPath}>
                  {item.outputPath || '未設定'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QueueList;
