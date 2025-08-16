// src/utils/errors.ts
// 最小限のエラーハンドリングユーティリティ

export type ErrorLevel = 'info' | 'warning' | 'error' | 'critical';

// 統一されたエラーメッセージ
export const ERROR_MESSAGES = {
  AUTH_FAILED: '認証に失敗しました。再度ログインしてください。',
  PERMISSION_DENIED: 'この操作を行う権限がありません。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  FILE_TOO_LARGE: 'ファイルサイズが上限を超えています。',
  FILE_INVALID_TYPE: 'サポートされていないファイル形式です。',
  UPLOAD_FAILED: 'アップロードに失敗しました。再度お試しください。',
  DELETE_FAILED: '削除に失敗しました。再度お試しください。',
  SAVE_FAILED: '保存に失敗しました。再度お試しください。',
  LOAD_FAILED: 'データの読み込みに失敗しました。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。',
} as const;

// シンプルなエラー表示関数
export const showError = (message: string, level: ErrorLevel = 'error'): void => {
  // コンソールログ
  const prefix = `[${level.toUpperCase()}]`;
  switch (level) {
    case 'info':
      console.info(`${prefix} ${message}`);
      break;
    case 'warning':
      console.warn(`${prefix} ${message}`);
      break;
    case 'error':
      console.error(`${prefix} ${message}`);
      break;
    case 'critical':
      console.error(`🚨 ${prefix} ${message}`);
      break;
  }

  // ユーザー向け表示
  if (level === 'critical') {
    if (confirm(`${message}\n\nページをリロードしますか？`)) {
      window.location.reload();
    }
  } else if (level === 'error') {
    showToast(message, 'error');
  } else if (level === 'warning') {
    showToast(message, 'warning');
  }
};

// 簡易トースト表示
const showToast = (message: string, type: 'error' | 'warning'): void => {
  const toast = document.createElement('div');
  const bgColor = type === 'error' ? '#EF4444' : '#F59E0B';
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: ${bgColor};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    max-width: 300px;
    font-size: 14px;
    line-height: 1.4;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 5000);
};

// よく使うエラーパターンの便利関数
export const errorHelpers = {
  // 認証エラー
  authFailed: (customMessage?: string) => 
    showError(customMessage || ERROR_MESSAGES.AUTH_FAILED, 'error'),
  
  // 権限エラー
  permissionDenied: (customMessage?: string) => 
    showError(customMessage || ERROR_MESSAGES.PERMISSION_DENIED, 'warning'),
  
  // ネットワークエラー
  networkError: (customMessage?: string) => 
    showError(customMessage || ERROR_MESSAGES.NETWORK_ERROR, 'error'),
  
  // ファイルエラー
  fileError: (type: 'size' | 'type' | 'upload', customMessage?: string) => {
    const messages = {
      size: ERROR_MESSAGES.FILE_TOO_LARGE,
      type: ERROR_MESSAGES.FILE_INVALID_TYPE,
      upload: ERROR_MESSAGES.UPLOAD_FAILED,
    };
    showError(customMessage || messages[type], 'warning');
  },
  
  // 操作失敗
  operationFailed: (operation: 'save' | 'delete' | 'load', customMessage?: string) => {
    const messages = {
      save: ERROR_MESSAGES.SAVE_FAILED,
      delete: ERROR_MESSAGES.DELETE_FAILED,
      load: ERROR_MESSAGES.LOAD_FAILED,
    };
    showError(customMessage || messages[operation], 'error');
  },
  
  // 予期しないエラー
  unexpected: (error?: Error) => {
    const message = error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
    showError(message, 'critical');
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
  },
  
  // 情報メッセージ
  info: (message: string) => showError(message, 'info'),
};

// Try-catch を簡単にするヘルパー
export const safeAsync = async <T>(
  asyncFn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    if (error instanceof Error) {
      errorHelpers.unexpected(error);
    } else {
      showError(errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR, 'error');
    }
    return null;
  }
};

// ファイル検証ヘルパー
export const validateFile = (
  file: File,
  options: {
    maxSize?: number; // bytes
    allowedTypes?: string[];
  } = {}
): { isValid: boolean; error?: string } => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [] } = options;
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `ファイルサイズが上限（${Math.round(maxSize / (1024 * 1024))}MB）を超えています`,
    };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'サポートされていないファイル形式です',
    };
  }
  
  return { isValid: true };
};

// エラー境界用の簡単なチェック
export const setupGlobalErrorHandling = (): void => {
  // 未処理のPromise拒否
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    errorHelpers.unexpected(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    );
    event.preventDefault();
  });
  
  // 未処理のエラー
  window.addEventListener('error', (event) => {
    console.error('Unhandled Error:', event.error);
    errorHelpers.unexpected(event.error);
  });
};

// 開発時のテスト用（自動で削除される）
if (import.meta.env.DEV) {
  (window as any).testErrors = {
    auth: () => errorHelpers.authFailed(),
    permission: () => errorHelpers.permissionDenied(),
    network: () => errorHelpers.networkError(),
    file: () => errorHelpers.fileError('size'),
    save: () => errorHelpers.operationFailed('save'),
    critical: () => errorHelpers.unexpected(new Error('テスト用クリティカルエラー')),
    info: () => errorHelpers.info('これは情報メッセージです'),
  };
  
  console.log('🛠️ 開発モード: window.testErrors でエラーテストが可能です');
}