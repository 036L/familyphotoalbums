// src/hooks/useAuth.ts - デモモード削除版
import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/core';

// デバッグログ関数
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[useAuth] ${message}`, data);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // 初期化処理
  useEffect(() => {
    let mounted = true;
    debugLog('useAuth初期化開始');

    const initAuth = async () => {
      try {
        setLoading(true);
        
        debugLog('Supabase認証初期化開始');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          debugLog('Session取得エラー', error);
        }
        
        debugLog('Session取得結果', { hasSession: !!session });
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (error) {
        debugLog('認証初期化エラー', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          debugLog('認証初期化完了', {
            hasUser: !!user,
            hasProfile: !!profile
          });
        }
      }
    };

    // 即座に初期化を開始
    initAuth();

    return () => {
      mounted = false;
      debugLog('useAuthクリーンアップ');
    };
  }, []); // 依存配列は空

  // Supabase認証状態変更の監視
  useEffect(() => {
    if (!initialized) return; // 初期化前は不要

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        debugLog('認証状態変更', { event, hasSession: !!session });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized]);

  // プロフィール取得
  const fetchProfile = async (userId: string) => {
    try {
      debugLog('プロフィール取得開始', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        debugLog('プロフィール取得エラー', error);
        // プロフィールが存在しない場合はデフォルトを作成
        if (error.code === 'PGRST116') {
          await createDefaultProfile(userId);
        }
      } else {
        debugLog('プロフィール取得成功', data);
        setProfile(data);
      }
    } catch (error) {
      debugLog('プロフィール取得例外', error);
    }
  };

  // デフォルトプロフィール作成
  const createDefaultProfile = async (userId: string) => {
    try {
      debugLog('デフォルトプロフィール作成開始', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: 'ユーザー',
          role: 'editor',
          settings: {}
        })
        .select()
        .single();

      if (error) throw error;
      
      debugLog('デフォルトプロフィール作成成功', data);
      setProfile(data);
    } catch (error) {
      debugLog('デフォルトプロフィール作成エラー', error);
    }
  };

  // ログイン関数
  const signInWithEmail = async (email: string, password: string) => {
    debugLog('ログイン試行', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    debugLog('Supabaseログイン成功', data);
    return data;
  };

  // サインアップ関数
  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // プロフィール作成
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name,
          role: 'editor',
        });

      if (profileError) {
        debugLog('プロフィール作成エラー', profileError);
      }
    }

    return data;
  };

  // ログアウト関数
  const signOut = async () => {
    debugLog('ログアウト開始');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    debugLog('Supabaseログアウト完了');
  };

  // プロフィール更新関数
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) throw new Error('ユーザーがログインしていません');

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  }, [user]);

  // デバッグ用の状態ログ出力
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugLog('状態変更', { 
        hasUser: !!user, 
        hasProfile: !!profile, 
        loading,
        initialized,
        userId: user?.id,
        profileName: profile?.name,
        profileRole: profile?.role
      });
    }
  }, [user, profile, loading, initialized]);

  return {
    user,
    profile,
    session,
    loading,
    initialized,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateProfile,
  };
};