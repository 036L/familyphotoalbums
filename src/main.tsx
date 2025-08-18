import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { setupGlobalErrorHandling } from './utils/errorHandling';

// グローバルエラーハンドリングを設定
setupGlobalErrorHandling();

// デモデータ初期化の改善版
const initializeDemoData = () => {
  console.log('[Demo Setup] デモデータ初期化開始');
  
  // 環境変数チェック
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!isDemo) {
    console.log('[Demo Setup] 実環境のため、デモデータ初期化をスキップ');
    return;
  }
  
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
  
  // 認証状態を設定
  localStorage.setItem('demoAuth', 'authenticated');
  localStorage.setItem('demoProfile', JSON.stringify(demoProfile));
  localStorage.setItem('demoInitialized', 'true');
  
  console.log('[Demo Setup] デモプロフィール強制設定完了:', demoProfile);
  
  // アルバムデータの初期化状態をクリア（useAlbumsで再初期化される）
  const existingAlbums = localStorage.getItem('demoAlbums');
  if (!existingAlbums) {
    console.log('[Demo Setup] デモアルバムを初期化準備完了');
  } else {
    console.log('[Demo Setup] 既存のデモアルバムを保持:', JSON.parse(existingAlbums).length, '件');
  }
  
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
  try {
    console.log('demoAuth:', localStorage.getItem('demoAuth'));
    const profileStr = localStorage.getItem('demoProfile');
    console.log('demoProfile:', profileStr ? JSON.parse(profileStr) : null);
    const albumsStr = localStorage.getItem('demoAlbums');
    console.log('demoAlbums count:', albumsStr ? JSON.parse(albumsStr).length : 0);
    console.log('demoInitialized:', localStorage.getItem('demoInitialized'));
  } catch (error) {
    console.error('ローカルストレージ確認エラー:', error);
  }
  console.groupEnd();
};

// デバッグ用のコンソール関数を追加（開発時のみ）
const addDebugFunctions = () => {
  if (import.meta.env.DEV) {
    (window as any).debugDemo = {
      // デモデータの確認
      check: debugLocalStorage,
      
      // デモデータのリセット
      reset: () => {
        console.log('[Debug] デモデータリセット');
        localStorage.removeItem('demoAuth');
        localStorage.removeItem('demoProfile');
        localStorage.removeItem('demoAlbums');
        localStorage.removeItem('demoInitialized');
        console.log('[Debug] リセット完了 - ページをリロードしてください');
      },
      
      // デモデータの再初期化
      reinit: () => {
        console.log('[Debug] デモデータ再初期化');
        initializeDemoData();
        setTimeout(() => window.location.reload(), 100);
      },
      
      // アルバム状態の確認
      albums: () => {
        console.log('Demo Albums:', localStorage.getItem('demoAlbums'));
      }
    };
    
    console.log('🛠️ 開発モード: window.debugDemo でデバッグ関数が利用可能です');
    console.log('- debugDemo.check(): ローカルストレージ確認');
    console.log('- debugDemo.reset(): デモデータリセット');
    console.log('- debugDemo.reinit(): 再初期化');
    console.log('- debugDemo.albums(): アルバム確認');
  }
};

const root = createRoot(document.getElementById('root')!);

// 初期化処理
initializeDemoData();

// 開発時のデバッグ
if (import.meta.env.DEV) {
  debugLocalStorage();
  addDebugFunctions();
}

// アプリケーションをレンダリング
root.render(<App />);