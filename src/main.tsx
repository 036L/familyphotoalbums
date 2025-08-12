import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 緊急デバッグツール（インライン）
const addEmergencyDebugTools = () => {
  const debugContainer = document.createElement('div');
  debugContainer.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 9999;
    background: #ff0000;
    color: #fff;
    padding: 10px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    border: 2px solid #fff;
  `;
  
  const clearAllData = () => {
    console.log('[Emergency] 全データクリア開始');
    localStorage.clear();
    sessionStorage.clear();
    console.log('[Emergency] データクリア完了');
    window.location.reload();
  };
  
  const setupDemo = () => {
    console.log('[Emergency] デモデータ設定開始');
    localStorage.setItem('demoAuth', 'authenticated');
    localStorage.setItem('demoProfile', JSON.stringify({
      id: 'demo-user-1',
      name: 'デモユーザー',
      email: 'test@example.com',
      avatar_url: null,
      role: 'admin',
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    console.log('[Emergency] デモデータ設定完了');
    setTimeout(() => window.location.reload(), 100);
  };
  
  const checkState = () => {
    console.log('[Emergency] 現在の状態:');
    console.log('- localStorage keys:', Object.keys(localStorage));
    console.log('- demoAuth:', localStorage.getItem('demoAuth'));
    console.log('- demoProfile:', localStorage.getItem('demoProfile'));
    console.log('- Environment:', {
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL
    });
  };
  
  debugContainer.innerHTML = `
    <div>🚨 緊急デバッグ</div>
    <button id="emergency-clear" style="margin: 2px; padding: 4px; font-size: 10px; background: #fff; color: #000;">全クリア</button>
    <button id="emergency-demo" style="margin: 2px; padding: 4px; font-size: 10px; background: #fff; color: #000;">デモ設定</button>
    <button id="emergency-check" style="margin: 2px; padding: 4px; font-size: 10px; background: #fff; color: #000;">状態確認</button>
  `;
  
  document.body.appendChild(debugContainer);
  
  document.getElementById('emergency-clear')?.addEventListener('click', clearAllData);
  document.getElementById('emergency-demo')?.addEventListener('click', setupDemo);
  document.getElementById('emergency-check')?.addEventListener('click', checkState);
  
  console.log('[Emergency] デバッグツール追加完了');
};

// エラーハンドリング
window.addEventListener('error', (event) => {
  console.error('[Main] グローバルエラー:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Main] 未処理のPromise拒否:', event.reason);
  event.preventDefault(); // デフォルトの処理を停止
});

// 強制的にデモデータを設定（初回のみ）
const forceInitializeDemo = () => {
  const hasInitialized = localStorage.getItem('demoInitialized');
  if (!hasInitialized) {
    console.log('[Main] 初回起動: デモデータを強制設定');
    localStorage.setItem('demoAuth', 'authenticated');
    localStorage.setItem('demoProfile', JSON.stringify({
      id: 'demo-user-1',
      name: 'デモユーザー',
      email: 'test@example.com',
      avatar_url: null,
      role: 'admin',
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    localStorage.setItem('demoInitialized', 'true');
    console.log('[Main] デモデータ設定完了');
  }
};

const root = createRoot(document.getElementById('root')!);

// レンダリング前のログ
console.log('[Main] Reactアプリケーション開始');
console.log('[Main] 環境:', {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

// 初期化処理
forceInitializeDemo();

// デバッグツールを追加
setTimeout(addEmergencyDebugTools, 500);

// アプリケーションをレンダリング
try {
  root.render(<App />);
  console.log('[Main] アプリケーションレンダリング完了');
} catch (error) {
  console.error('[Main] レンダリングエラー:', error);
}