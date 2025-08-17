import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGlobalErrorHandling } from './utils/errorHandling';

// グローバルエラーハンドリングを設定
setupGlobalErrorHandling();

// 強制的にデモデータを設定（管理者権限で確実に設定）
const forceInitializeDemo = () => {
  console.log('[Demo Setup] デモデータ初期化開始');
  
  // 常に最新の管理者プロフィールで上書き
  const demoProfile = {
    id: 'demo-user-1',
    name: 'デモユーザー',
    email: 'test@example.com',
    avatar_url: null,
    role: 'admin', // 確実に管理者として設定
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  localStorage.setItem('demoAuth', 'authenticated');
  localStorage.setItem('demoProfile', JSON.stringify(demoProfile));
  localStorage.setItem('demoInitialized', 'true');
  
  console.log('[Demo Setup] デモプロフィール強制設定完了:', demoProfile);
  
  // 設定後の確認
  const savedProfile = localStorage.getItem('demoProfile');
  if (savedProfile) {
    const parsed = JSON.parse(savedProfile);
    console.log('[Demo Setup] 保存確認 - ロール:', parsed.role);
  }
};

// デバッグ用：ローカルストレージの状態確認
const debugLocalStorage = () => {
  console.group('=== デモデータ確認 ===');
  console.log('demoAuth:', localStorage.getItem('demoAuth'));
  console.log('demoProfile:', JSON.parse(localStorage.getItem('demoProfile') || '{}'));
  console.log('demoInitialized:', localStorage.getItem('demoInitialized'));
  console.groupEnd();
};

const root = createRoot(document.getElementById('root')!);

// 初期化処理
forceInitializeDemo();

// 開発時のデバッグ
if (import.meta.env.DEV) {
  debugLocalStorage();
}

// アプリケーションをレンダリング
root.render(<App />);