// src/types/core.ts - User型の修正版
// 家族アルバムアプリケーション - 全型定義統一ファイル

// =========================
// ユーザー・認証関連
// =========================

export interface User {
    id: string;
    email: string; // Supabaseの email?: string との互換性のため必須フィールドとして維持
    aud: string;
    role: string;
    email_confirmed_at: string;
    phone: string;
    confirmed_at: string;
    last_sign_in_at: string;
    app_metadata: Record<string, any>;
    user_metadata: Record<string, any>;
    identities: any[];
    created_at: string;
    updated_at: string;
}

// Supabase Userとの互換性のための代替型（必要に応じて使用）
export interface FlexibleUser {
    id: string;
    email?: string; // undefinedを許可
    aud?: string;
    role?: string;
    email_confirmed_at?: string;
    phone?: string;
    confirmed_at?: string;
    last_sign_in_at?: string;
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
    identities?: any[];
    created_at?: string;
    updated_at?: string;
}
  
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
  
// =========================
// アルバム関連
// =========================
  
export interface Album {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    created_by: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    // 計算フィールド
    photo_count?: number;
    creator_name?: string;
    // 互換性フィールド
    createdAt: string;
}
  
export type AlbumCreateData = Pick<Album, 'title' | 'description' | 'is_public'>;
export type AlbumUpdateData = Partial<AlbumCreateData>;
  
// =========================
// 写真関連
// =========================
  
export interface Photo {
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
    // 計算フィールド
    uploader_name?: string;
    // 互換性フィールド
    uploadedAt?: string;
}
  
export interface UploadProgress {
    file: File;
    progress: number;
    status: 'compressing' | 'uploading' | 'completed' | 'error';
    error?: string;
}
  
// =========================
// コメント関連
// =========================
  
export interface Comment {
    id: string;
    content: string;
    photo_id: string;
    user_id: string;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
    // 計算フィールド
    user_name?: string;
    user_avatar?: string | null;
    replies?: Comment[];
    likes_count?: number;
    is_liked?: boolean;
}
  
// =========================
// タグ関連
// =========================
  
export interface PhotoTag {
    id: string;
    name: string;
    color: string;
    created_by: string;
    created_at: string;
    usage_count?: number;
}
  
export interface PhotoTagAssignment {
    photo_id: string;
    tag_id: string;
    assigned_by: string;
    assigned_at: string;
}
  
// =========================
// 権限関連
// =========================
  
export type Permission = 
    // アルバム関連
    | 'album.create'
    | 'album.edit'
    | 'album.delete'
    | 'album.view'
    // 写真関連
    | 'photo.upload'
    | 'photo.edit'
    | 'photo.delete'
    | 'photo.view'
    // コメント関連
    | 'comment.create'
    | 'comment.edit'
    | 'comment.delete'
    | 'comment.view'
    // 招待関連
    | 'invite.create'
    | 'invite.manage'
    // 設定関連
    | 'settings.edit'
    | 'family.manage'
    // 管理者権限
    | 'admin.all';
  
export type Role = 'admin' | 'editor' | 'viewer';
  
export interface ResourceOwnership {
    createdBy?: string;
    uploadedBy?: string;
    userId?: string;
}
  
// =========================
// アクセシビリティ関連
// =========================
  
export interface AccessibilitySettings {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    darkMode: boolean;
    reducedMotion: boolean;
    announcements: boolean;
    keyboardNavigation: boolean;
}
  
// =========================
// 通知関連
// =========================
  
export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
}
  
export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
}
  
// =========================
// ソート・フィルタリング関連
// =========================
  
export interface SortCriteria {
    field: 'date' | 'name' | 'size' | 'type' | 'location';
    order: 'asc' | 'desc';
}
  
export interface GroupCriteria {
    by: 'date' | 'month' | 'year' | 'location' | 'camera' | 'tags' | 'none';
    showCount?: boolean;
}
  
export interface FilterCriteria {
    dateRange?: {
      start: string;
      end: string;
    };
    fileTypes?: string[];
    sizeRange?: {
      min: number;
      max: number;
    };
    tags?: string[];
    location?: string;
    camera?: string;
}
  
export interface PhotoGroup {
    key: string;
    label: string;
    photos: Photo[];
    count: number;
    metadata?: Record<string, any>;
}
  
// =========================
// UI関連
// =========================
  
export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    children: React.ReactNode;
}
  
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}
  
export interface InputProps {
    label?: string;
    error?: string;
    className?: string;
    required?: boolean;
}
  
// =========================
// データベース関連
// =========================
  
export interface Database {
    public: {
      Tables: {
        profiles: {
          Row: Profile & { created_at: string; updated_at: string };
          Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { id: string };
          Update: Partial<Omit<Profile, 'id'>>;
        };
        albums: {
          Row: Album;
          Insert: Omit<Album, 'id' | 'created_at' | 'updated_at' | 'createdAt'>;
          Update: Partial<Omit<Album, 'id' | 'created_at' | 'createdAt'>>;
        };
        photos: {
          Row: Photo;
          Insert: Omit<Photo, 'id' | 'created_at' | 'uploader_name' | 'uploadedAt'>;
          Update: Partial<Omit<Photo, 'id' | 'created_at' | 'uploader_name' | 'uploadedAt'>>;
        };
        comments: {
          Row: Comment;
          Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'user_name' | 'user_avatar'>;
          Update: Partial<Omit<Comment, 'id' | 'created_at' | 'user_name' | 'user_avatar'>>;
        };
      };
    };
}
  
// =========================
// 環境・設定関連
// =========================
  
export interface EnvironmentInfo {
    isDemo: false; 
    isDevelopment: boolean;
    isProduction: boolean;
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  }
  
export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    quality?: number;
}