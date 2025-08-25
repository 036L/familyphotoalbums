// src/hooks/useEnvironment.ts - 改善版
import { useMemo } from 'react';
import type { EnvironmentInfo } from '../types/core';

/**
 * アプリケーションの実行環境を判定するHook
 */
export const useEnvironment = (): EnvironmentInfo => {
  return useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase設定が不足しています。環境変数を確認してください。');
    }
    
    return {
      isDemo: false, // 常にfalse
      isDevelopment: import.meta.env.DEV,
      isProduction: import.meta.env.PROD,
      supabaseUrl,
      supabaseAnonKey,
    };
  }, []);
};
