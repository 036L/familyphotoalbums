// src/utils/debugUtils.ts

// 開発環境でのデバッグユーティリティ

export const clearAllData = () => {
  console.log('[Debug] 全データクリア開始');
  
  // ローカルストレージをクリア
  localStorage.removeItem('demoAuth');
  localStorage.removeItem('demoProfile');
  localStorage.removeItem('demoAlbums');
  localStorage.removeItem('accessibilitySettings');
  localStorage.removeItem('userSettings');
  localStorage.removeItem('webPushSubscription');
  
  console.log('[Debug] ローカルストレージクリア完了');
  
  // セッションストレージもクリア
  sessionStorage.clear();
  
  console.log('[Debug] 全データクリア完了');
  
  // ページをリロード
  window.location.reload();
};

export const setupDemoData = () => {
  console.log('[Debug] デモデータセットアップ開始');
  
  const demoProfile = {
    id: 'demo-user-1',
    name: 'デモユーザー',
    email: 'test@example.com',
    avatar_url: null,
    role: 'admin',
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  localStorage.setItem('demoAuth', 'authenticated');
  localStorage.setItem('demoProfile', JSON.stringify(demoProfile));
  
  console.log('[Debug] デモデータセットアップ完了', demoProfile);
  
  // ページをリロード
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

export const debugState = () => {
  console.log('[Debug] 現在の状態:');
  console.log('- demoAuth:', localStorage.getItem('demoAuth'));
  console.log('- demoProfile:', localStorage.getItem('demoProfile'));
  console.log('- demoAlbums:', localStorage.getItem('demoAlbums'));
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Location:', window.location.href);
};

// デバッグボタンを画面に追加（開発時のみ）
export const addDebugButtons = () => {
  // デバッグボタンの自動生成を無効化
  return;
  
  /* デバッグボタンが必要な場合は以下のコメントを外してください
  if (import.meta.env.MODE !== 'development') return;
  
  const debugContainer = document.createElement('div');
  debugContainer.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 9999;
    background: #000;
    color: #fff;
    padding: 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
  `;
  
  debugContainer.innerHTML = `
    <div>デバッグツール</div>
    <button id="clear-data" style="margin: 2px; padding: 4px; font-size: 10px;">データクリア</button>
    <button id="setup-demo" style="margin: 2px; padding: 4px; font-size: 10px;">デモ設定</button>
    <button id="debug-state" style="margin: 2px; padding: 4px; font-size: 10px;">状態確認</button>
  `;
  
  document.body.appendChild(debugContainer);
  
  document.getElementById('clear-data')?.addEventListener('click', clearAllData);
  document.getElementById('setup-demo')?.addEventListener('click', setupDemoData);
  document.getElementById('debug-state')?.addEventListener('click', debugState);
  */
};

// ページ読み込み時の自動実行を無効化
/* デバッグボタンが必要な場合は以下のコメントを外してください
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(addDebugButtons, 1000);
  });
}
*/