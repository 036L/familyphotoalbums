// src/utils/errorHandling.ts
// シンプルで実用的なエラーハンドリングシステム

// エラーレベル
export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

// アプリケーションエラー
export interface AppError {
  message: string;
  level: ErrorLevel;
  code?: string;
  details?: string;
  timestamp: string;
}

// エラーハンドラー関数
type ErrorHandlerFunction = (error: AppError) => void;

class SimpleErrorHandler {
  private listeners: ErrorHandlerFunction[] = [];

  // エラーリスナーを追加
  addListener(handler: ErrorHandlerFunction): () => void {
    this.listeners.push(handler);
    return () => {
      const index = this.listeners.indexOf(handler);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // エラーを処理
  handle(error: string | Error | AppError, level: ErrorLevel = 'error'): void {
    let appError: AppError;

    if (typeof error === 'string') {
      appError = {
        message: error,
        level,
        timestamp: new Date().toISOString(),
      };
    } else if (error instanceof Error) {
      appError = {
        message: error.message,
        level,
        details: error.stack,
        timestamp: new Date().toISOString(),
      };
    } else {
      appError = error;
    }

    // ログ出力
    this.logError(appError);

    // リスナーに通知
    this.listeners.forEach(listener => {
      try {
        listener(appError);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });

    // レベルに応じた処理
    this.handleByLevel(appError);
  }

  private logError(error: AppError): void {
    const prefix = `[${error.level.toUpperCase()}]`;
    const message = `${prefix} ${error.message}`;
    
    switch (error.level) {
      case 'info':
        console.info(message);
        break;
      case 'warning':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        if (error.details) console.error(error.details);
        break;
      case 'critical':
        console.error(`🚨 ${message}`);
        if (error.details) console.error(error.details);
        break;
    }
  }

  private handleByLevel(error: AppError): void {
    switch (error.level) {
      case 'critical':
        // クリティカルエラーはページリロードを提案
        if (confirm(`${error.message}\n\nページをリロードしますか？`)) {
          window.location.reload();
        }
        break;
      case 'error':
        // エラーはアラート表示
        this.showToast(error.message, 'error');
        break;
      case 'warning':
        // 警告はトースト表示
        this.showToast(error.message, 'warning');
        break;
      case 'info':
        // 情報はコンソールのみ
        break;
    }
  }

  private showToast(message: string, type: 'error' | 'warning'): void {
    // 簡易トースト実装
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
    
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm text-white ${bgColor}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }
}

// グローバルインスタンス
export const errorHandler = new SimpleErrorHandler();

// よく使うエラーパターン
export const handleError = {
  // 認証エラー
  auth: (message = '認証に失敗しました') => 
    errorHandler.handle(message, 'error'),
  
  // 権限エラー
  permission: (message = 'この操作を行う権限がありません') => 
    errorHandler.handle(message, 'warning'),
  
  // ネットワークエラー
  network: (message = 'ネットワークエラーが発生しました') => 
    errorHandler.handle(message, 'error'),
  
  // ファイルエラー
  file: (message = 'ファイルの処理に失敗しました') => 
    errorHandler.handle(message, 'warning'),
  
  // 予期しないエラー
  unexpected: (error: Error) => 
    errorHandler.handle(error, 'critical'),
  
  // 情報メッセージ
  info: (message: string) => 
    errorHandler.handle(message, 'info'),
};

// React Hook
export const useErrorHandler = () => {
  const [errors, setErrors] = React.useState<AppError[]>([]);

  React.useEffect(() => {
    const removeListener = errorHandler.addListener((error) => {
      setErrors(prev => [...prev, error].slice(-10)); // 最新10件のみ
    });
    
    return removeListener;
  }, []);

  const clearErrors = () => setErrors([]);
  
  return { errors, clearErrors, handleError };
};

// エラーバウンダリー（React Class Component）
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    errorHandler.handle(error, 'critical');
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 非同期処理のエラーハンドリング
export const withErrorHandling = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (error instanceof Error) {
        handleError.unexpected(error);
      } else {
        handleError.unexpected(new Error(String(error)));
      }
      return null;
    }
  };
};

// デバッグ用（開発時のみ）
export const testError = {
  info: () => handleError.info('これは情報メッセージです'),
  warning: () => handleError.permission(),
  error: () => handleError.network(),
  critical: () => handleError.unexpected(new Error('テスト用クリティカルエラー')),
};

// 開発時のテストボタンを追加
if (import.meta.env.DEV) {
  setTimeout(() => {
    const debugPanel = document.createElement('div');
    debugPanel.innerHTML = `
      <div style="position: fixed; bottom: 10px; left: 10px; z-index: 9999; background: #000; color: #fff; padding: 10px; border-radius: 5px; font-size: 12px;">
        <div>エラーテスト:</div>
        <button id="test-info" style="margin: 2px; padding: 4px; font-size: 10px;">Info</button>
        <button id="test-warning" style="margin: 2px; padding: 4px; font-size: 10px;">Warning</button>
        <button id="test-error" style="margin: 2px; padding: 4px; font-size: 10px;">Error</button>
        <button id="test-critical" style="margin: 2px; padding: 4px; font-size: 10px;">Critical</button>
      </div>
    `;
    
    document.body.appendChild(debugPanel);
    
    document.getElementById('test-info')?.addEventListener('click', testError.info);
    document.getElementById('test-warning')?.addEventListener('click', testError.warning);
    document.getElementById('test-error')?.addEventListener('click', testError.error);
    document.getElementById('test-critical')?.addEventListener('click', testError.critical);
  }, 1000);
}