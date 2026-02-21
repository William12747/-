/**
 * 簡單的 API 檢查腳本
 * 可以在瀏覽器控制台或 Electron 開發者工具中運行
 */

(function() {
  console.log('%c=== Electron API 診斷 ===', 'font-size: 16px; font-weight: bold; color: #2196f3;');
  
  // 檢查環境
  console.log('\n1. 環境檢查:');
  console.log('   - window 對象:', typeof window !== 'undefined' ? '✅ 存在' : '❌ 不存在');
  console.log('   - process 對象:', typeof process !== 'undefined' ? '✅ 存在' : '❌ 不存在');
  console.log('   - 是否在 Electron 中:', typeof window !== 'undefined' && window.process && window.process.type === 'renderer' ? '✅ 是' : '❌ 否');
  
  // 檢查 electronAPI
  console.log('\n2. Electron API 檢查:');
  if (typeof window.electronAPI === 'undefined') {
    console.error('   ❌ window.electronAPI 不存在！');
    console.error('   這表示 preload.js 沒有正確執行或 contextBridge 沒有正確暴露 API。');
    console.log('\n   可能的問題:');
    console.log('   1. preload.js 文件路徑不正確');
    console.log('   2. contextIsolation 設置錯誤');
    console.log('   3. preload 腳本執行失敗');
  } else {
    console.log('   ✅ window.electronAPI 存在');
    
    // 檢查各個方法
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
    
    console.log('\n3. API 方法檢查:');
    methods.forEach(method => {
      if (typeof window.electronAPI[method] === 'function') {
        console.log(`   ✅ ${method}: 存在`);
      } else {
        console.error(`   ❌ ${method}: 不存在或不是函數`);
      }
    });
    
    // 測試 selectFolder
    console.log('\n4. 測試 selectFolder:');
    console.log('   嘗試調用 window.electronAPI.selectFolder()...');
    
    window.electronAPI.selectFolder()
      .then(result => {
        if (result) {
          console.log(`   ✅ 成功！選擇的資料夾: ${result}`);
        } else {
          console.log('   ⚠️ 返回 null（用戶可能取消了選擇）');
        }
      })
      .catch(error => {
        console.error(`   ❌ 錯誤: ${error.message}`);
        console.error('   錯誤堆疊:', error.stack);
      });
  }
  
  console.log('\n=== 診斷完成 ===\n');
  console.log('提示: 如果 window.electronAPI 不存在，請檢查:');
  console.log('1. electron/main.js 中的 preload 路徑是否正確');
  console.log('2. webPreferences 中的 contextIsolation 是否為 true');
  console.log('3. webPreferences 中的 nodeIntegration 是否為 false');
  console.log('4. 檢查開發者工具的控制台是否有錯誤訊息');
})();
