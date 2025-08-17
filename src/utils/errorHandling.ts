// src/utils/errorHandling.ts
// TypeScript対応の安全なエラーハンドリングシステム

import React from 'react';

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
    if (typeof window === 'undefined') return;

    switch (error.level) {
      case 'critical':
        // クリティカルエラーはページリロードを提案
        if (confirm(`${error.message}\n\nページをリロードしますか？`)) {
          window.location.reload();
        }
        break;
      case 'error':
        // エラーはトースト表示
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
    // サーバーサイドレンダリング対応
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // 既存のトーストをチェック
    const existingToast = document.querySelector('.app-error-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // 必要なスタイルを追加
    this.ensureToastStyles();

    // トースト要素を作成
    const toast = document.createElement('div');
    toast.className = `app-error-toast ${type}`;
    toast.textContent = message;
    
    // クリックで閉じる
    toast.addEventListener('click', () => this.closeToast(toast));
    
    document.body.appendChild(toast);
    
    // 自動で閉じる
    setTimeout(() => this.closeToast(toast), 5000);
  }

  private closeToast(toast: HTMLElement): void {
    if (toast.parentNode) {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  private ensureToastStyles(): void {
    if (typeof document === 'undefined') return;
    
    const styleId = 'app-error-toast-styles';
    if (document.querySelector(`#${styleId}`)) return;

    const style = document.createElement('style');
    style.id = styleId;
    
    // CSS文字列を安全に構築
    const cssRules = [
      '.app-error-toast {',
      '  position: fixed;',
      '  top: 20px;',
      '  right: 20px;',
      '  z-index: 9999;',
      '  max-width: 300px;',
      '  padding: 12px 16px;',
      '  border-radius: 8px;',
      '  color: white;',
      '  font-size: 14px;',
      '  line-height: 1.4;',
      '  cursor: pointer;',
      '  box-shadow: 0 4px 12px rgba(0,0,0,0.2);',
      '  animation: slideIn 0.3s ease-out;',
      '}',
      '.app-error-toast.error {',
      '  background: #EF4444;',
      '}',
      '.app-error-toast.warning {',
      '  background: #F59E0B;',
      '}',
      '@keyframes slideIn {',
      '  from {',
      '    transform: translateX(100%);',
      '    opacity: 0;',
      '  }',
      '  to {',
      '    transform: translateX(0);',
      '    opacity: 1;',
      '  }',
      '}',
      '@keyframes slideOut {',
      '  from {',
      '    transform: translateX(0);',
      '    opacity: 1;',
      '  }',
      '  to {',
      '    transform: translateX(100%);',
      '    opacity: 0;',
      '  }',
      '}'
    ];

    style.textContent = cssRules.join('\n');
    document.head.appendChild(style);
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

// エラーバウンダリー用のインターフェース
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

// デフォルトのエラーフォールバックコンポーネント
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  React.createElement('div', {
    className: 'min-h-screen bg-gray-50 flex items-center justify-center p-4'
  }, 
    React.createElement('div', {
      className: 'max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center'
    },
      React.createElement('div', {
        className: 'text-red-500 text-4xl mb-4'
      }, '⚠️'),
      React.createElement('h2', {
        className: 'text-lg font-semibold text-gray-900 mb-2'
      }, 'エラーが発生しました'),
      React.createElement('p', {
        className: 'text-gray-600 mb-4'
      }, error.message),
      React.createElement('button', {
        onClick: () => window.location.reload(),
        className: 'bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors'
      }, 'ページを再読み込み')
    )
  )
);

// エラーバウンダリー（React Class Component）
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    errorHandler.handle(error, 'critical');
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return React.createElement(FallbackComponent, { error: this.state.error });
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

// グローバルエラーハンドリングの設定
export const setupGlobalErrorHandling = (): void => {
  if (typeof window === 'undefined') return;

  // 未処理のPromise拒否
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    handleError.unexpected(error);
    event.preventDefault();
  });
  
  // 未処理のエラー
  window.addEventListener('error', (event) => {
    console.error('Unhandled Error:', event.error);
    if (event.error instanceof Error) {
      handleError.unexpected(event.error);
    }
  });
};
