// src/utils/errorTypes.ts
// エラーの種類を定義
export type ErrorType = 
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'FILE_ERROR'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

// エラーの重要度レベル
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// アプリケーションエラーの基本インターface
export interface AppError {
  type: ErrorType;
  message: string;
  severity: ErrorSeverity;
  code?: string;
  details?: string;
  timestamp: string;
  userId?: string;
  context?: Record<string, any>;
  recoverable?: boolean;
  userMessage?: string; // ユーザー向けのフレンドリーなメッセージ
}

// エラーハンドリングのオプション
export interface ErrorHandlingOptions {
  showToUser?: boolean;
  logToConsole?: boolean;
  logToServer?: boolean;
  autoRecover?: boolean;
  retryable?: boolean;
  customHandler?: (error: AppError) => void;
}