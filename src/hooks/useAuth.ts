import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  role: 'admin' | 'editor' | 'viewer';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 useAuth初期化開始');
    
    // 初期セッション取得
    const initializeAuth = async () => {
      try {
        console.log('🔍 初期セッション取得中...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ セッション取得エラー:', error);
          setLoading(false);
          return;
        }

        console.log('✅ セッション取得完了:', session ? 'ログイン済み' : '未ログイン');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 ユーザー情報:', {
            id: session.user.id,
            email: session.user.email
          });
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ 認証初期化エラー:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 認証状態変更:', event, session ? 'ログイン済み' : '未ログイン');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 useAuth cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 プロフィール取得中...', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ プロフィール取得エラー:', error);
        // プロフィールが存在しない場合は、デフォルトプロフィールを作成
        if (error.code === 'PGRST116') {
          console.log('📝 デフォルトプロフィール作成中...');
          await createDefaultProfile(userId);
        }
      } else {
        console.log('✅ プロフィール取得成功:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ プロフィール取得例外:', error);
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
        })
        .select()
        .single();

      if (error) {
        console.error('❌ デフォルトプロフィール作成エラー:', error);
      } else {
        console.log('✅ デフォルトプロフィール作成成功:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ デフォルトプロフィール作成例外:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log('🔑 メール認証開始:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ ログインエラー:', error);
      throw error;
    }
    
    console.log('✅ ログイン成功');
    return data;
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    console.log('📝 新規登録開始:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ 新規登録エラー:', error);
      throw error;
    }

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
        console.error('❌ プロフィール作成エラー:', profileError);
      } else {
        console.log('✅ プロフィール作成成功');
      }
    }

    return data;
  };

  const signOut = async () => {
    console.log('🚪 ログアウト開始');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ ログアウトエラー:', error);
      throw error;
    }
    console.log('✅ ログアウト完了');
  };

  const updateProfile = async (updates: Partial<Profile>) => {
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

  console.log('🎭 useAuth状態:', {
    user: user ? 'あり' : 'なし',
    profile: profile ? 'あり' : 'なし',
    loading
  });

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