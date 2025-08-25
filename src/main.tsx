import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { setupGlobalErrorHandling } from './utils/errorHandling';

// グローバルエラーハンドリングを設定
setupGlobalErrorHandling();

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

const root = createRoot(document.getElementById('root')!);

// アプリケーションをレンダリング
root.render(<App />);