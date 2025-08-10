// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// デモ用の設定（実際の開発では環境変数を使用してください）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';

// デモモードかどうかを判定
const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

// デモモード用のモッククライアント
const createMockClient = () => ({
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } }
    }),
    signInWithPassword: ({ email, password }: { email: string; password: string }) => {
      if (email === 'test@example.com' && password === 'password123') {
        return Promise.resolve({
          data: {
            user: {
              id: 'demo-user-1',
              email: 'test@example.com',
              user_metadata: { name: 'デモユーザー' }
            },
            session: { access_token: 'demo-token' }
          },
          error: null
        });
      }
      return Promise.resolve({
        data: { user: null, session: null },
        error: new Error('認証情報が正しくありません')
      });
    },
    signUp: () => Promise.resolve({
      data: { user: null, session: null },
      error: new Error('デモモードではサインアップできません')
    }),
    signOut: () => Promise.resolve({ error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({
          data: {
            id: 'demo-user-1',
            name: 'デモユーザー',
            avatar_url: null,
            role: 'admin'
          },
          error: null
        }),
        order: () => Promise.resolve({
          data: [],
          error: null
        })
      }),
      order: () => Promise.resolve({
        data: [],
        error: null
      })
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({
          data: { id: 'new-item', created_at: new Date().toISOString() },
          error: null
        })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: () => Promise.resolve({
            data: { id: 'updated-item', updated_at: new Date().toISOString() },
            error: null
          })
        })
      })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ error: null })
    })
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({
        data: { path: 'demo/path.jpg' },
        error: null
      }),
      getPublicUrl: () => ({
        data: { publicUrl: 'https://via.placeholder.com/800x600' }
      }),
      remove: () => Promise.resolve({ error: null })
    })
  }
});

export const supabase = isDemoMode ? createMockClient() as any : createClient(supabaseUrl, supabaseAnonKey);

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