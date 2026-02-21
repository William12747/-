const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const logger = require('./logger');

// 設定 FFmpeg 和 FFprobe 路徑
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

// 支援的輸入格式
const SUPPORTED_FORMATS = ['.flv', '.asf', '.rmvb', '.mpeg', '.mpg', '.wmv', '.avi'];

/**
 * 遞迴掃描資料夾，找出支援的影片檔案
 */
function scanFolder(folderPath) {
  return new Promise((resolve, reject) => {
    const files = [];
    
    function scanDirectory(dir) {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          
          if (item.isDirectory()) {
            scanDirectory(fullPath);
          } else if (item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            if (SUPPORTED_FORMATS.includes(ext)) {
              files.push({
                path: fullPath,
                name: item.name,
                extension: ext,
                relativePath: path.relative(folderPath, fullPath)
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
      }
    }
    
    try {
      scanDirectory(folderPath);
      resolve(files);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 獲取影片資訊
 */
function getVideoInfo(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        videoCodec: videoStream ? videoStream.codec_name : null,
        audioCodec: audioStream ? audioStream.codec_name : null,
        width: videoStream ? videoStream.width : null,
        height: videoStream ? videoStream.height : null,
        fps: videoStream ? (() => {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
          return den ? num / den : null;
        })() : null
      });
    });
  });
}

/**
 * 轉換影片為 MP4 (H.264 + AAC)
 */
function convertVideo(inputPath, outputPath, onProgress) {
  return new Promise((resolve, reject) => {
    logger.section('轉換視頻文件開始');
    logger.log('VideoProcessor', '檢查點 1: 參數驗證');
    logger.log('VideoProcessor', '輸入路徑: ' + inputPath);
    logger.log('VideoProcessor', '輸出路徑: ' + outputPath);
    
    // 檢查輸入文件
    logger.log('VideoProcessor', '檢查點 2: 檢查輸入文件...');
    if (!fs.existsSync(inputPath)) {
      const error = new Error(`輸入文件不存在: ${inputPath}`);
      logger.error('VideoProcessor', '輸入文件不存在', error);
      reject(error);
      return;
    }
    logger.log('VideoProcessor', '✅ 檢查點 2 通過: 輸入文件存在');
    
    // 確保輸出目錄存在
    logger.log('VideoProcessor', '檢查點 3: 確保輸出目錄存在...');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      logger.log('VideoProcessor', '創建輸出目錄: ' + outputDir);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    logger.log('VideoProcessor', '✅ 檢查點 3 通過: 輸出目錄準備就緒');
    
    let duration = 0;
    
    // 先獲取影片時長
    logger.log('VideoProcessor', '檢查點 4: 使用 ffprobe 獲取影片資訊...');
    const probeStartTime = Date.now();
    
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      const probeDuration = ((Date.now() - probeStartTime) / 1000).toFixed(2);
      
      if (err) {
        logger.error('VideoProcessor', 'ffprobe 失敗', err);
        reject(new Error(`無法讀取影片資訊: ${err.message}`));
        return;
      }
      
      logger.log('VideoProcessor', '✅ 檢查點 4 通過: ffprobe 完成');
      logger.log('VideoProcessor', '探測耗時: ' + probeDuration + ' 秒', {
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate
      });
      
      duration = metadata.format.duration;
      
      // 開始轉換
      logger.log('VideoProcessor', '檢查點 5: 啟動 FFmpeg 轉換...');
      const convertStartTime = Date.now();
      
      const ffmpegProcess = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',           // 影片編碼器：H.264
          '-preset fast',           // 編碼速度與品質平衡（fast 會更快）
          '-crf 22',                // 品質參數（18-28，22 為好品質）
          '-c:a aac',               // 音訊編碼器：AAC
          '-b:a 192k',              // 音訊位元率（增加到 192k 以確保音質）
          '-ac 2',                  // 確保立體聲
          '-ar 44100',              // 音頻採樣率
          '-max_muxing_queue_size 9999',  // 增加緩衝區以避免音視訊同步問題
          '-movflags +faststart',   // 優化網路播放（快速開始）
          '-shortest',              // 確保輸出與最短流的長度一致
          '-y'                      // 覆蓋輸出檔案
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.log('VideoProcessor', '✅ 檢查點 5 通過: FFmpeg 進程已啟動');
          logger.log('VideoProcessor', '開始時間: ' + new Date().toISOString());
        })
        .on('progress', (progress) => {
          const elapsed = ((Date.now() - convertStartTime) / 1000).toFixed(2);
          
          // 解析時間標記 (HH:MM:SS.mmm 格式)
          let currentTime = 0;
          let percent = 0;
          if (progress.timemark && duration > 0) {
            const parts = progress.timemark.split(':');
            if (parts.length === 3) {
              currentTime = parseFloat(parts[0]) * 3600 + 
                           parseFloat(parts[1]) * 60 + 
                           parseFloat(parts[2]);
            }
            percent = duration > 0 ? (currentTime / duration) * 100 : 0;
            percent = Math.min(100, Math.max(0, percent));
          }
          
          // 計算剩餘時間
          let remainingTime = null;
          if (percent > 0 && percent < 100) {
            const totalElapsed = Date.now() - convertStartTime;
            const estimatedTotal = totalElapsed / (percent / 100);
            remainingTime = ((estimatedTotal - totalElapsed) / 1000).toFixed(0);
          }
          
          // 使用日誌系統記錄進度（每秒最多一次）
          if (Math.round(elapsed) % 1 === 0) {
            logger.progress('VideoProcessor', path.basename(inputPath), percent, {
              timemark: progress.timemark,
              elapsed: parseFloat(elapsed),
              remaining: remainingTime ? parseFloat(remainingTime) : null,
              bitrate: progress.currentKbps ? Math.round(progress.currentKbps) + ' kbps' : 'N/A',
              fileSize: progress.targetSize ? (progress.targetSize / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'
            });
          }
          
          if (onProgress && duration > 0) {
            onProgress({
              percent: percent,
              timemark: progress.timemark,
              targetSize: progress.targetSize,
              currentKbps: progress.currentKbps,
              elapsed: parseFloat(elapsed),
              remaining: remainingTime ? parseFloat(remainingTime) : null
            });
          }
        })
        .on('end', () => {
          const convertDuration = ((Date.now() - convertStartTime) / 1000).toFixed(2);
          logger.log('VideoProcessor', '✅ 檢查點 6: 轉換完成');
          logger.log('VideoProcessor', '轉換耗時: ' + convertDuration + ' 秒');
          logger.log('VideoProcessor', '結束時間: ' + new Date().toISOString());
          
          // 檢查輸出文件是否存在
          if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            logger.log('VideoProcessor', '輸出文件大小: ' + (stats.size / 1024 / 1024).toFixed(2) + ' MB');
            resolve(outputPath);
          } else {
            reject(new Error('轉換完成但輸出文件不存在'));
          }
        })
        .on('error', (err) => {
          const convertDuration = ((Date.now() - convertStartTime) / 1000).toFixed(2);
          logger.error('VideoProcessor', '轉換失敗', err);
          logger.log('VideoProcessor', '轉換耗時: ' + convertDuration + ' 秒');
          reject(new Error(`轉換失敗: ${err.message}`));
        })
        .on('stderr', (stderrLine) => {
          // 記錄 FFmpeg 的標準錯誤輸出
          if (stderrLine && stderrLine.trim()) {
            const line = stderrLine.trim();
            
            // 檢查關鍵訊息
            if (line.includes('error') || line.includes('Error') || line.includes('ERROR')) {
              logger.log('VideoProcessor', '⚠️ FFmpeg stderr 錯誤訊息: ' + line);
            }
          }
        });
      
      logger.log('VideoProcessor', '執行 FFmpeg.run()...');
      ffmpegProcess.run();
    });
  });
}

module.exports = {
  scanFolder,
  convertVideo,
  getVideoInfo,
  SUPPORTED_FORMATS
};
