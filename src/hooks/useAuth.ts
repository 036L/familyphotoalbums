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
    console.log('[useAuth] 初期化useEffect開始');
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('[useAuth] Supabase認証状態取得開始');
        
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('[useAuth] Supabase認証結果:', {
          user: user ? { id: user.id, email: user.email } : null,
          error: error?.message
        });
        
        if (error) {
          console.error('[useAuth] 認証取得エラー:', error);
          setUser(null);
          setProfile(null);
          setInitialized(true);
          return;
        }
        
        setUser(user);
        
        if (user) {
          console.log('[useAuth] プロフィール取得開始:', user.id);
          await fetchProfile(user.id);
        } else {
          console.log('[useAuth] ユーザーなし - プロフィールクリア');
          setProfile(null);
        }
        
        setInitialized(true);
        console.log('[useAuth] 初期化完了');
        
      } catch (err) {
        console.error('[useAuth] 初期化エラー:', err);
        setUser(null);
        setProfile(null);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] 認証状態変更:', event, session?.user?.id);
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // プロフィール取得
  const fetchProfile = useCallback(async (userId: string) => {
    console.log('[useAuth] プロフィール取得開始:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('[useAuth] プロフィール取得結果:', {
        data: data ? { id: data.id, name: data.name, role: data.role } : null,
        error: error?.message
      });
      
      if (error) {
        console.error('[useAuth] プロフィール取得エラー:', error);
        setProfile(null);
        return null;
      }
      
      setProfile(data);
      return data;
      
    } catch (err) {
      console.error('[useAuth] プロフィール取得例外:', err);
      setProfile(null);
      return null;
    }
  }, []); 

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