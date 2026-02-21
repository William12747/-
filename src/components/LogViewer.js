import React, { useState, useEffect, useRef } from 'react';
import './LogViewer.css';

function LogViewer({ isVisible, logs = [] }) {
  const [expandedLogs, setExpandedLogs] = useState(false);
  const logsEndRef = useRef(null);
  const containerRef = useRef(null);

  // 自動滾動到最新日誌
  useEffect(() => {
    if (expandedLogs) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, expandedLogs]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="log-viewer-container">
      <div className="log-viewer-header">
        <div className="log-viewer-title">
          <span>📋 實時日誌</span>
          <span className="log-count">({logs.length})</span>
        </div>
        <button
          className="log-viewer-toggle"
          onClick={() => setExpandedLogs(!expandedLogs)}
        >
          {expandedLogs ? '▼ 隱藏' : '▶ 展開'}
        </button>
      </div>

      {expandedLogs && (
        <div className="log-viewer-content" ref={containerRef}>
          {logs.length === 0 ? (
            <div className="log-empty">
              <p>等待日誌輸出...</p>
            </div>
          ) : (
            <div className="log-items">
              {logs.map((log, index) => (
                <LogEntry key={index} log={log} />
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LogEntry({ log }) {
  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'progress':
        return '🔄';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error':
        return '#f56565';
      case 'progress':
        return '#667eea';
      case 'info':
      default:
        return '#2d3748';
    }
  };

  return (
    <div
      className="log-entry"
      style={{
        borderLeftColor: getLogColor(log.level),
        backgroundColor: log.level === 'error' ? '#fff5f5' : 'transparent'
      }}
    >
      <div className="log-entry-header">
        <span className="log-icon">{getLogIcon(log.level)}</span>
        <span className="log-time">{log.timestamp}</span>
        <span className="log-module">[{log.module}]</span>
      </div>
      <div className="log-entry-message">
        {log.message}
        {log.percent !== undefined && (
          <span className="log-percent"> - {log.percent}%</span>
        )}
      </div>
      {log.additionalInfo && Object.keys(log.additionalInfo).length > 0 && (
        <div className="log-entry-details">
          {Object.entries(log.additionalInfo).map(([key, value]) => (
            <div key={key} className="log-detail-item">
              <span className="log-detail-key">{key}:</span>
              <span className="log-detail-value">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LogViewer;
