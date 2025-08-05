import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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