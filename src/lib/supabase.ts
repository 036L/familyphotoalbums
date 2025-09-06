// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 環境変数の取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] 設定確認:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  keyStart: supabaseAnonKey.substring(0, 20) + '...'
});

// 環境変数のチェック
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase環境変数が設定されていません。\n' +
    'VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を .env ファイルに設定してください。\n\n' +
    '例:\n' +
    'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// 接続テスト
supabase.auth.getSession().then(({ data, error }) => {
  console.log('[Supabase] 初期セッション:', {
    hasSession: !!data.session,
    hasUser: !!data.session?.user,
    error: error?.message
  });
});

/*
// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          role: 'admin' | 'editor' | 'viewer';
          settings: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          role?: 'admin' | 'editor' | 'viewer';
          settings?: Record<string, any>;
        };
        Update: {
          name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'editor' | 'viewer';
          settings?: Record<string, any>;
          updated_at?: string;
        };
      };
      albums: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          created_by: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          created_by: string;
          is_public?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          cover_image_url?: string | null;
          is_public?: boolean;
          updated_at?: string;
        };
      };
      photos: {
        Row: {
          id: string;
          filename: string;
          original_filename: string;
          url: string;
          thumbnail_url: string | null;
          file_type: 'image' | 'video';
          file_size: number;
          width: number | null;
          height: number | null;
          album_id: string;
          uploaded_by: string;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          filename: string;
          original_filename: string;
          url: string;
          thumbnail_url?: string | null;
          file_type: 'image' | 'video';
          file_size: number;
          width?: number | null;
          height?: number | null;
          album_id: string;
          uploaded_by: string;
          metadata?: Record<string, any>;
        };
        Update: {
          filename?: string;
          thumbnail_url?: string | null;
          metadata?: Record<string, any>;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          photo_id: string;
          user_id: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          photo_id: string;
          user_id: string;
          parent_id?: string | null;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
      comment_likes: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
        };
        Update: never;
      };
      families: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string | null;
          created_by: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: 'admin' | 'editor' | 'viewer';
          invited_by: string;
          joined_at: string;
          created_at: string;
        };
        Insert: {
          family_id: string;
          user_id: string;
          role: 'admin' | 'editor' | 'viewer';
          invited_by: string;
        };
        Update: {
          role?: 'admin' | 'editor' | 'viewer';
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'comment' | 'like' | 'photo_upload' | 'album_shared';
          target_type: 'photo' | 'album' | 'comment';
          target_id: string;
          source_user_id: string | null;
          message: string | null;
          metadata: Record<string, any>;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: 'comment' | 'like' | 'photo_upload' | 'album_shared';
          target_type: 'photo' | 'album' | 'comment';
          target_id: string;
          source_user_id?: string | null;
          message?: string | null;
          metadata?: Record<string, any>;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
          metadata?: Record<string, any>;
        };
      };
      user_last_seen: {
        Row: {
          user_id: string;
          target_type: 'photo' | 'album';
          target_id: string;
          last_seen_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          target_type: 'photo' | 'album';
          target_id: string;
          last_seen_at?: string;
        };
        Update: {
          last_seen_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}*/