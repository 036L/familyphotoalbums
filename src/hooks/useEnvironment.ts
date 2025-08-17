// src/hooks/useEnvironment.ts - 改善版
import { useMemo } from 'react';
import type { EnvironmentInfo } from '../types/core';

/**
 * アプリケーションの実行環境を判定するHook
 * デモモード、開発環境、本番環境の判定を統一管理
 */
export const useEnvironment = (): EnvironmentInfo => {
  return useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // 強制デモモードの確認（開発時用）
    const forceDemoMode = localStorage.getItem('forceDemoMode') === 'true';
    
    // Supabaseの設定がない場合、または強制デモモードの場合はデモモード
    const isDemo = !supabaseUrl || !supabaseAnonKey || forceDemoMode;
    
    // デバッグログ（開発時のみ）
    if (import.meta.env.DEV) {
      console.log('[useEnvironment] 環境判定:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseAnonKey,
        forceDemoMode,
        isDemo,
        supabaseUrl: supabaseUrl ? '設定済み' : '未設定'
      });
    }
    
    return {
      isDemo,
      isDevelopment: import.meta.env.DEV,
      isProduction: import.meta.env.PROD,
      supabaseUrl,
      supabaseAnonKey,
    };
  }, []);
};

/**
 * デモモード判定のみを返すシンプルなHook
 * 既存コードとの互換性を保つため
 */
export const useIsDemo = (): boolean => {
  const { isDemo } = useEnvironment();
  return isDemo;
};

/**
 * デモモードを強制的に有効/無効にする関数（開発時用）
 */
export const setForceDemoMode = (enabled: boolean): void => {
  if (import.meta.env.DEV) {
    if (enabled) {
      localStorage.setItem('forceDemoMode', 'true');
      console.log('[useEnvironment] 強制デモモードを有効化');
    } else {
      localStorage.removeItem('forceDemoMode');
      console.log('[useEnvironment] 強制デモモードを無効化');
    }
    
    // 設定後にページをリロード
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
};

// グローバル関数として追加（開発時のみ）
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).setForceDemoMode = setForceDemoMode;
}