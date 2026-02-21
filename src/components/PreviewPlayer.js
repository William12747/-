import React, { useState, useEffect } from 'react';
import './PreviewPlayer.css';

function PreviewPlayer({ file, onClose }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file || !window.electronAPI) {
      setError('預覽功能不可用');
      setLoading(false);
      return;
    }

    // 如果檔案已完成轉換，使用輸出路徑
    // 否則使用輸入路徑（如果瀏覽器支援）
    const pathToUse = file.status === 'completed' && file.outputPath 
      ? file.outputPath 
      : file.inputPath;

    // 在 Electron 中，透過 IPC 獲取正確的檔案 URL
    const loadVideo = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getVideoUrl) {
          const fileUrl = await window.electronAPI.getVideoUrl(pathToUse);
          setVideoSrc(fileUrl);
          setLoading(false);
        } else {
          // 降级方案：直接使用 file:// 协议
          // 检测是否为 Windows 路径（包含反斜杠）
          const isWindowsPath = pathToUse.includes('\\');
          const fileUrl = isWindowsPath
            ? `file:///${pathToUse.replace(/\\/g, '/')}`
            : `file://${pathToUse}`;
          setVideoSrc(fileUrl);
          setLoading(false);
        }
      } catch (err) {
        setError(`無法載入影片: ${err.message}`);
        setLoading(false);
      }
    };

    loadVideo();
  }, [file]);

  if (!file) return null;

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-container" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <h3 className="preview-title">影片預覽</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="preview-content">
          {loading && (
            <div className="preview-loading">
              <div className="spinner"></div>
              <p>載入中...</p>
            </div>
          )}
          
          {error && (
            <div className="preview-error">
              <p>⚠️ {error}</p>
              <p className="error-hint">
                提示：如果影片已轉換完成，請使用系統播放器開啟輸出檔案
              </p>
            </div>
          )}
          
          {videoSrc && !error && (
            <video 
              className="preview-video"
              controls
              autoPlay
              src={videoSrc}
              onError={(e) => {
                setError('無法播放此影片檔案');
                setLoading(false);
              }}
              onLoadedData={() => {
                setLoading(false);
              }}
            >
              您的瀏覽器不支援影片播放
            </video>
          )}
        </div>

        <div className="preview-info">
          <p><strong>檔案名稱:</strong> {file.name}</p>
          {file.outputPath && (
            <p><strong>輸出路徑:</strong> {file.outputPath}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewPlayer;
