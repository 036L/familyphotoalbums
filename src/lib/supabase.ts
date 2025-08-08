// src/lib/supabase.ts に一時的に追加して確認

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 環境変数確認:');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定済み' : '未設定');
console.log('URL length:', supabaseUrl ? supabaseUrl.length : 0);
console.log('Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.log('必要な設定:');
  console.log('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 接続テスト
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase接続エラー:', error);
  } else {
    console.log('✅ Supabase接続成功');
    console.log('セッション:', data.session ? 'あり' : 'なし');
  }
}).catch(err => {
  console.error('❌ Supabase接続テスト失敗:', err);
});

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
    };
  };
}