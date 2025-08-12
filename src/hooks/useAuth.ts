import { useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
  role: 'admin' | 'editor' | 'viewer';
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

const isDemo = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

// デバッグログ関数
const debugLog = (message: string, data?: any) => {
  console.log(`[useAuth] ${message}`, data);
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    debugLog('useAuth初期化開始', { isDemo });

    if (isDemo) {
      debugLog('デモモード初期化');
      
      // デモモードの初期化
      const initDemo = () => {
        try {
          const demoAuth = localStorage.getItem('demoAuth');
          const demoProfile = localStorage.getItem('demoProfile');
          
          debugLog('ローカルストレージ確認', { demoAuth, hasProfile: !!demoProfile });
          
          if (demoAuth === 'authenticated' && demoProfile) {
            try {
              const parsedProfile = JSON.parse(demoProfile);
              debugLog('プロフィール解析成功', parsedProfile);
              
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
                  app_metadata: {},
                  user_metadata: {},
                  identities: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as User;
                
                setProfile(parsedProfile);
                setUser(demoUser);
                debugLog('認証状態設定完了', { user: demoUser, profile: parsedProfile });
              }
            } catch (error) {
              debugLog('プロフィール解析エラー', error);
              localStorage.removeItem('demoAuth');
              localStorage.removeItem('demoProfile');
            }
          } else {
            debugLog('未認証状態');
          }
          
          if (mounted) {
            setLoading(false);
            debugLog('初期化完了');
          }
        } catch (error) {
          debugLog('デモ初期化エラー', error);
          if (mounted) {
            setLoading(false);
          }
        }
      };

      // 確実にDOMが準備されてから実行
      const timer = setTimeout(initDemo, 50);
      return () => {
        mounted = false;
        clearTimeout(timer);
      };
    }

    // 実際のSupabase認証処理
    const initAuth = async () => {
      try {
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
      } catch (error) {
        debugLog('認証初期化エラー', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        
        debugLog('認証状態変更', { event: _event, hasSession: !!session });
        
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
      mounted = false;
      subscription.unsubscribe();
      debugLog('useAuthクリーンアップ');
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      debugLog('プロフィール取得開始', userId);
      
      if (isDemo) {
        return;
      }

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
          role: 'admin',
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        debugLog('デモログイン成功', demoProfile);
        
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
          app_metadata: {},
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User;
        
        setProfile(demoProfile);
        setUser(demoUser);
        
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    debugLog('Supabaseログイン成功', data);
    return data;
  };

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

  const updateProfile = async (updates: Partial<Profile>) => {
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

      debugLog('プロフィール更新', updatedProfile);
      
      localStorage.setItem('demoProfile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
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
  };

  // デバッグ用の状態ログ出力
  useEffect(() => {
    debugLog('状態変更', { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      loading,
      userId: user?.id,
      profileName: profile?.name
    });
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