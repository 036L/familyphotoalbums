// src/hooks/useAuth.ts - 完成版
import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useEnvironment } from './useEnvironment';
import type { Profile } from '../types/core';

// デバッグログ関数
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[useAuth] ${message}`, data);
  }
};

export const useAuth = () => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 環境情報をHookで取得
  const { isDemo } = useEnvironment();

  // プロフィール変更の監視（デモモード用）
  useEffect(() => {
    if (!isDemo) return;

    const handleStorageChange = () => {
      try {
        const demoProfile = localStorage.getItem('demoProfile');
        if (demoProfile) {
          const parsedProfile = JSON.parse(demoProfile);
          debugLog('ローカルストレージ変更検知', parsedProfile);
          setProfile(parsedProfile);
        }
      } catch (error) {
        debugLog('ローカルストレージ読み込みエラー', error);
      }
    };

    // storage イベントリスナー（他のタブでの変更を検知）
    window.addEventListener('storage', handleStorageChange);
    
    // 定期的にローカルストレージをチェック（同一タブ内での変更検知）
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isDemo]);

  // 初期化処理
  useEffect(() => {
    let mounted = true;
    debugLog('useAuth初期化開始', { isDemo });

    const initAuth = async () => {
      try {
        if (isDemo) {
          // デモモードの初期化
          debugLog('デモモード初期化');
          
          const demoAuth = localStorage.getItem('demoAuth');
          const demoProfile = localStorage.getItem('demoProfile');
          
          debugLog('ローカルストレージ確認', { 
            hasDemoAuth: !!demoAuth, 
            hasProfile: !!demoProfile,
            demoAuth,
            demoProfile: demoProfile ? JSON.parse(demoProfile) : null
          });
          
          if (demoAuth === 'authenticated' && demoProfile) {
            try {
              const parsedProfile = JSON.parse(demoProfile);
              debugLog('プロフィール解析結果', parsedProfile);
              
              // ロールが正しく設定されているかチェック
              if (!parsedProfile.role || parsedProfile.role === 'viewer') {
                debugLog('ロールが正しくない、管理者に修正', { 
                  currentRole: parsedProfile.role 
                });
                
                // 管理者ロールに強制修正
                parsedProfile.role = 'admin';
                parsedProfile.updated_at = new Date().toISOString();
                localStorage.setItem('demoProfile', JSON.stringify(parsedProfile));
              }
              
              if (mounted) {
                const demoUser = {
                  id: parsedProfile.id,
                  email: parsedProfile.email,
                  aud: 'authenticated',
                  role: 'authenticated',
                  email_confirmed_at: new Date().toISOString(),
                  phone: '',
                  confirmed_at: new Date().toISOString(),
                  last_sign_in_at: new Date().toISOString(),
                  app_metadata: { role: parsedProfile.role },
                  user_metadata: { 
                    role: parsedProfile.role,
                    name: parsedProfile.name 
                  },
                  identities: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as User;
                
                setProfile(parsedProfile);
                setUser(demoUser);
                
                debugLog('認証状態設定完了', { 
                  user: demoUser, 
                  profile: parsedProfile,
                  finalRole: parsedProfile.role
                });
              }
            } catch (error) {
              debugLog('プロフィール解析エラー', error);
              
              // エラー時は新しい管理者プロフィールを作成
              const newProfile: Profile = {
                id: 'demo-user-1',
                name: 'デモユーザー',
                email: 'test@example.com',
                avatar_url: null,
                role: 'admin',
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              localStorage.setItem('demoAuth', 'authenticated');
              localStorage.setItem('demoProfile', JSON.stringify(newProfile));
              
              if (mounted) {
                const demoUser = {
                  id: newProfile.id,
                  email: newProfile.email,
                  aud: 'authenticated',
                  role: 'authenticated',
                  email_confirmed_at: new Date().toISOString(),
                  phone: '',
                  confirmed_at: new Date().toISOString(),
                  last_sign_in_at: new Date().toISOString(),
                  app_metadata: { role: 'admin' },
                  user_metadata: { role: 'admin', name: newProfile.name },
                  identities: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as User;
                
                setProfile(newProfile);
                setUser(demoUser);
                
                debugLog('新規プロフィール作成完了', { user: demoUser, profile: newProfile });
              }
            }
          } else {
            debugLog('未認証状態');
          }
          
          if (mounted) {
            setLoading(false);
            debugLog('デモ初期化完了');
          }
        } else {
          // 実際のSupabase認証処理
          debugLog('Supabase認証初期化開始');
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            debugLog('Session取得エラー', error);
          }
          
          debugLog('Session取得結果', { hasSession: !!session, user: session?.user?.id });
          
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              await fetchProfile(session.user.id);
            } else {
              setLoading(false);
            }
          }
        }
      } catch (error) {
        debugLog('認証初期化エラー', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // 確実にDOMが準備されてから実行
    const timer = setTimeout(initAuth, 50);

    return () => {
      mounted = false;
      clearTimeout(timer);
      debugLog('useAuthクリーンアップ');
    };
  }, [isDemo]);

  // Supabase認証状態変更の監視
  useEffect(() => {
    if (isDemo) return; // デモモードでは不要

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        debugLog('認証状態変更', { event, hasSession: !!session });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemo]);

  // プロフィール取得（Supabase用）
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
    } finally {
      setLoading(false);
    }
  };

  // デフォルトプロフィール作成（Supabase用）
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
    debugLog('ログイン試行', { email, isDemo });
    
    if (isDemo) {
      // デモモードでの認証
      if (email === 'test@example.com' && password === 'password123') {
        const demoProfile: Profile = {
          id: 'demo-user-1',
          name: 'デモユーザー',
          email: 'test@example.com',
          avatar_url: null,
          role: 'admin', // 確実に管理者権限
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        debugLog('デモログイン - プロフィール作成', demoProfile);
        
        // ローカルストレージに保存
        localStorage.setItem('demoAuth', 'authenticated');
        localStorage.setItem('demoProfile', JSON.stringify(demoProfile));
        
        const demoUser = {
          id: demoProfile.id,
          email: demoProfile.email,
          aud: 'authenticated',
          role: 'authenticated',
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: { role: 'admin' },
          user_metadata: { role: 'admin', name: demoProfile.name },
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User;
        
        // 状態を更新
        setProfile(demoProfile);
        setUser(demoUser);
        
        debugLog('デモログイン成功', { 
          profile: demoProfile, 
          user: demoUser,
          profileRole: demoProfile.role,
          userRole: demoUser.user_metadata?.role
        });
        
        return {
          data: {
            user: demoUser,
            session: { access_token: 'demo-token' }
          },
          error: null
        };
      } else {
        debugLog('デモログイン失敗');
        throw new Error('認証情報が正しくありません');
      }
    }

    // 実際のSupabaseログイン処理
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
    if (isDemo) {
      throw new Error('デモモードではサインアップできません');
    }

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
    
    if (isDemo) {
      localStorage.removeItem('demoAuth');
      localStorage.removeItem('demoProfile');
      setUser(null);
      setProfile(null);
      debugLog('デモログアウト完了');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    debugLog('Supabaseログアウト完了');
  };

  // プロフィール更新関数
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user && !isDemo) throw new Error('ユーザーがログインしていません');

    if (isDemo) {
      // デモモードでの更新
      const currentProfile = profile || {
        id: 'demo-user-1',
        name: 'デモユーザー',
        email: 'test@example.com',
        avatar_url: null,
        role: 'admin' as const
      };

      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updated_at: new Date().toISOString()
      };

      debugLog('プロフィール更新（デモ）', { 
        before: currentProfile, 
        updates, 
        after: updatedProfile 
      });
      
      localStorage.setItem('demoProfile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      
      // userオブジェクトのメタデータも更新
      if (user) {
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            role: updatedProfile.role,
            name: updatedProfile.name
          },
          app_metadata: {
            ...user.app_metadata,
            role: updatedProfile.role
          }
        };
        setUser(updatedUser);
        
        debugLog('ユーザーメタデータ更新完了', updatedUser);
      }
      
      return updatedProfile;
    }

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
  }, [user, profile, isDemo]);

  // デバッグ用の状態ログ出力
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugLog('状態変更', { 
        hasUser: !!user, 
        hasProfile: !!profile, 
        loading,
        userId: user?.id,
        profileName: profile?.name,
        profileRole: profile?.role,
        userMetaRole: user?.user_metadata?.role,
        appMetaRole: user?.app_metadata?.role
      });
    }
  }, [user, profile, loading]);

  return {
    user,
    profile,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateProfile,
  };
};