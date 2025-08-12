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

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (isDemo) {
      // デモモードの初期化
      const initDemo = () => {
        const demoAuth = localStorage.getItem('demoAuth');
        const demoProfile = localStorage.getItem('demoProfile');
        
        if (demoAuth === 'authenticated' && demoProfile) {
          try {
            const parsedProfile = JSON.parse(demoProfile);
            if (mounted) {
              setProfile(parsedProfile);
              setUser({
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
              } as User);
            }
          } catch (error) {
            console.error('デモプロフィール解析エラー:', error);
            localStorage.removeItem('demoAuth');
            localStorage.removeItem('demoProfile');
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      };

      // 少し遅延を入れて確実にDOMが準備されてから実行
      setTimeout(initDemo, 100);
      return () => { mounted = false; };
    }

    // 実際のSupabase認証処理
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session取得エラー:', error);
        }
        
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
        console.error('認証初期化エラー:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;
        
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
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      if (isDemo) {
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('プロフィール取得エラー:', error);
        // プロフィールが存在しない場合はデフォルトを作成
        if (error.code === 'PGRST116') {
          await createDefaultProfile(userId);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
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
      setProfile(data);
    } catch (error) {
      console.error('デフォルトプロフィール作成エラー:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
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
        
        localStorage.setItem('demoAuth', 'authenticated');
        localStorage.setItem('demoProfile', JSON.stringify(demoProfile));
        
        setProfile(demoProfile);
        setUser({
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
        } as User);
        
        return {
          data: {
            user: {
              id: demoProfile.id,
              email: demoProfile.email,
            },
            session: { access_token: 'demo-token' }
          },
          error: null
        };
      } else {
        throw new Error('認証情報が正しくありません');
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
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
        console.error('プロフィール作成エラー:', profileError);
      }
    }

    return data;
  };

  const signOut = async () => {
    if (isDemo) {
      localStorage.removeItem('demoAuth');
      localStorage.removeItem('demoProfile');
      setUser(null);
      setProfile(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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