import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// エラーハンドリング
window.addEventListener('error', (event) => {
  console.error('[Main] グローバルエラー:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Main] 未処理のPromise拒否:', event.reason);
  event.preventDefault();
});

// 強制的にデモデータを設定（初回のみ）
const forceInitializeDemo = () => {
  const hasInitialized = localStorage.getItem('demoInitialized');
  if (!hasInitialized) {
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
  }
};

const root = createRoot(document.getElementById('root')!);

// 初期化処理
forceInitializeDemo();

// アプリケーションをレンダリング
root.render(<App />);