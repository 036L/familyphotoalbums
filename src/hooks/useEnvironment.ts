// src/hooks/useEnvironment.ts
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
    
    // Supabaseの設定がない場合はデモモード
    const isDemo = !supabaseUrl || !supabaseAnonKey;
    
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