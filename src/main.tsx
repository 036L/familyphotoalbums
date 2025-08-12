import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// デバッグユーティリティのインポート（開発時のみ）
if (import.meta.env.MODE === 'development') {
  import('./utils/debugUtils').then(({ addDebugButtons, debugState }) => {
    console.log('[Main] 開発モードでデバッグツールを読み込み');
    // ページ読み込み完了後にデバッグツールを追加
    setTimeout(() => {
      addDebugButtons();
      debugState();
    }, 1000);
  }).catch(err => {
    console.warn('[Main] デバッグツールの読み込みに失敗:', err);
  });
}

// エラーハンドリング
window.addEventListener('error', (event) => {
  console.error('[Main] グローバルエラー:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Main] 未処理のPromise拒否:', event.reason);
});

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

// 開発環境ではStrictModeを無効化してデバッグしやすくする
root.render(
  import.meta.env.MODE === 'development' ? <App /> : (
    <StrictMode>
      <App />
    </StrictMode>
  )
);