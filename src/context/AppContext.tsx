// src/context/AppContext.tsx - エラー修正版
import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAlbums } from '../hooks/useAlbums';
import { usePhotos } from '../hooks/usePhotos';
import type { Album, AlbumCreateData, Profile, User, Photo, UploadProgress } from '../types/core';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// デバッグログ関数（開発時のみ有効）
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[AppContext] ${message}`, data);
  }
};

// Supabase Userを独自のUser型に変換する関数
const convertSupabaseUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '', // undefinedの場合は空文字に変換
    aud: supabaseUser.aud || 'authenticated',
    role: supabaseUser.role || 'authenticated',
    email_confirmed_at: supabaseUser.email_confirmed_at || '',
    phone: supabaseUser.phone || '',
    confirmed_at: supabaseUser.confirmed_at || '',
    last_sign_in_at: supabaseUser.last_sign_in_at || '',
    app_metadata: supabaseUser.app_metadata || {},
    user_metadata: supabaseUser.user_metadata || {},
    identities: supabaseUser.identities || [],
    created_at: supabaseUser.created_at || '',
    updated_at: supabaseUser.updated_at || '',
  };
};

interface AppContextType {
  // Auth - メモ化された認証状態
  isAuthenticated: boolean;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<any>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
  logout: () => void;
  
  // Albums - メモ化されたアルバム状態
  albums: Album[];
  albumsLoading: boolean;
  albumsInitialized: boolean;
  createAlbum: (data: AlbumCreateData) => Promise<Album>;
  updateAlbum: (id: string, updates: Partial<Album>) => Promise<Album>;
  deleteAlbum: (id: string) => Promise<void>;
  
  // Photos - メモ化された写真状態
  photos: Photo[];
  photosLoading: boolean;
  uploadProgress: UploadProgress[];
  fetchPhotos: (albumId?: string) => Promise<void>;
  uploadPhotos: (files: File[], albumId: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  
  // UI State - 最適化されたUI状態管理
  currentAlbum: Album | null;
  setCurrentAlbum: (album: Album | null) => void;

  // ★ 写真直接表示機能を追加
  openPhotoModal: (photoId: string) => Promise<void>;
  
  // Debug functions
  forceRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const auth = useAuth();
  const albumsHook = useAlbums();
  const photosHook = usePhotos();
  
  // ローカルUIステート
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);

  // メモ化された認証状態
  const authState = useMemo(() => ({
    isAuthenticated: !!auth.user,
    user: convertSupabaseUser(auth.user), // 型変換を適用
    profile: auth.profile,
    loading: auth.loading,
  }), [auth.user, auth.profile, auth.loading]);

  // メモ化されたアルバム状態
  const albumsState = useMemo(() => ({
    albums: albumsHook.albums,
    albumsLoading: albumsHook.loading,
    albumsInitialized: albumsHook.initialized,
  }), [albumsHook.albums, albumsHook.loading, albumsHook.initialized]);

  // メモ化された写真状態
  const photosState = useMemo(() => ({
    photos: photosHook.photos,
    photosLoading: photosHook.loading,
    uploadProgress: photosHook.uploadProgress,
  }), [photosHook.photos, photosHook.loading, photosHook.uploadProgress]);

  // 最適化されたログアウト処理
  const logout = useCallback(async () => {
    try {
      debugLog('ログアウト開始');
      await auth.signOut();
      setCurrentAlbum(null);
      
      debugLog('ログアウト完了');
    } catch (error) {
      debugLog('ログアウトエラー', error);
      console.error('ログアウトエラー:', error);
    }
  }, [auth.signOut]);

  // 最適化されたアルバム選択処理
  const handleSetCurrentAlbum = useCallback((album: Album | null) => {
    debugLog('現在のアルバム変更', album?.title);
    setCurrentAlbum(album);
    if (album) {
      // photosHookのfetchPhotosメソッドを直接呼び出し
      photosHook.fetchPhotos(album.id);
    }
  }, [photosHook]);

  // ★ 写真直接表示機能を追加
const openPhotoModal = useCallback(async (photoId: string) => {
  try {
    debugLog('写真直接表示開始', { photoId });
    
    // 1. 該当写真の情報を取得して、どのアルバムに属するかを特定
    // まず全アルバムから写真を探す
    let targetAlbum: Album | null = null;
    let targetPhoto: Photo | null = null;
    
    for (const album of albumsState.albums) {
      // そのアルバムの写真を一時的に取得
      await photosHook.fetchPhotos(album.id);
      const photo = photosState.photos.find(p => p.id === photoId);
      
      if (photo) {
        targetAlbum = album;
        targetPhoto = photo;
        break;
      }
    }
    
    if (targetAlbum && targetPhoto) {
      debugLog('対象写真発見', { 
        albumTitle: targetAlbum.title, 
        photoId: targetPhoto.id 
      });
      
      // 2. アルバムを設定
      setCurrentAlbum(targetAlbum);
      
      // 3. 写真一覧を取得
      await photosHook.fetchPhotos(targetAlbum.id);
      
      // 4. 少し遅延してからモーダルを開く（状態更新の完了を待つ）
      setTimeout(() => {
        // この処理は実際にはPhotoGrid側で処理される
        // ここでは写真IDを一時的に保存
        window.dispatchEvent(new CustomEvent('openPhotoModal', { 
          detail: { photoId } 
        }));
      }, 100);
      
      debugLog('写真直接表示完了');
    } else {
      debugLog('対象写真が見つかりません', { photoId });
      console.warn('指定された写真が見つかりません:', photoId);
    }
  } catch (error) {
    debugLog('写真直接表示エラー', error);
    console.error('写真直接表示エラー:', error);
  }
}, [albumsState.albums, photosState.photos, photosHook]);

  // 最適化されたプロフィール更新処理
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      debugLog('プロフィール更新開始', updates);
      
        // 実際のSupabase実装
        return await auth.updateProfile(updates);
      
    } catch (error) {
      debugLog('プロフィール更新エラー', error);
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  }, [auth.updateProfile, auth.profile]);

  // ★ 強制リフレッシュ関数（デバッグ用）を修正
const forceRefresh = useCallback(() => {
  debugLog('強制リフレッシュ実行');
  // forceReinitializeメソッドが存在するかチェック
  if ('forceReinitialize' in albumsHook && typeof albumsHook.forceReinitialize === 'function') {
    albumsHook.forceReinitialize();
  } else {
    // 存在しない場合は通常のfetchAlbumsを実行
    albumsHook.fetchAlbums();
  }
}, [albumsHook]);

  // 認証状態の変更とアルバム初期化の同期（修正版）
  useEffect(() => {
    // 認証が完了してからアルバム取得を開始
    const shouldInitializeAlbums = () => {
      // 認証が完了していない場合は待機
      if (auth.loading || !auth.initialized) {
        debugLog('認証初期化待機中', {
          authLoading: auth.loading,
          authInitialized: auth.initialized
        });
        return false;
      }

      // デモモードまたは認証済みユーザーが存在する場合
      if (auth.user) {
        // アルバムがまだ初期化されていない場合
        if (!albumsHook.initialized && !albumsHook.loading) {
          debugLog('アルバム初期化条件を満たした');
          return true;
        }
      }

      return false;
    };

    debugLog('認証・アルバム同期チェック', {
      authLoading: auth.loading,
      authInitialized: auth.initialized,
      hasUser: !!auth.user,
      albumsInitialized: albumsHook.initialized,
      albumsLoading: albumsHook.loading,
      albumCount: albumsHook.albums.length,
      shouldInitialize: shouldInitializeAlbums()
    });

    if (shouldInitializeAlbums()) {
      debugLog('アルバム初期化をトリガー');
      
      // 少し遅延を入れて確実に実行
      const timer = setTimeout(() => {
        debugLog('アルバム取得実行');
        albumsHook.fetchAlbums();
      }, 50);
      
      return () => {
        clearTimeout(timer);
      };
    }

    // すべてのパスで関数またはundefinedを返す
    return undefined;
  }, [
    auth.loading,
    auth.initialized,
    auth.user,
    albumsHook.initialized,
    albumsHook.loading,
    albumsHook
  ]);

  // デバッグ用：状態変更の監視（開発時のみ）
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugLog('全体状態更新', {
        // 認証状態
        isAuthenticated: authState.isAuthenticated,
        authLoading: authState.loading,
        authInitialized: auth.initialized,
        
        // アルバム状態
        albumCount: albumsState.albums.length,
        albumsLoading: albumsState.albumsLoading,
        albumsInitialized: albumsState.albumsInitialized,
        
        // その他
        currentAlbum: currentAlbum?.title,
        photoCount: photosState.photos.length
      });
    }
  }, [
    authState, 
    auth.initialized, 
    albumsState, 
    photosState, 
    currentAlbum
  ]);

  // メモ化されたコンテキスト値
  const contextValue = useMemo(() => ({
    // Auth
    ...authState,
    signInWithEmail: auth.signInWithEmail,
    signUpWithEmail: auth.signUpWithEmail,
    updateProfile,
    logout,
    
    // Albums
    ...albumsState,
    createAlbum: albumsHook.createAlbum,
    updateAlbum: albumsHook.updateAlbum,
    deleteAlbum: albumsHook.deleteAlbum,
    
    // Photos
    ...photosState,
    fetchPhotos: photosHook.fetchPhotos,
    uploadPhotos: photosHook.uploadPhotos,
    deletePhoto: photosHook.deletePhoto,
    
    // UI State
    currentAlbum,
    setCurrentAlbum: handleSetCurrentAlbum,

    // ★ 写真直接表示機能を追加
    openPhotoModal,
  
    // Debug
    forceRefresh,
  }), [
    authState,
    albumsState,
    photosState,
    currentAlbum,
    auth.signInWithEmail,
    auth.signUpWithEmail,
    updateProfile,
    logout,
    albumsHook.createAlbum,
    albumsHook.updateAlbum,
    albumsHook.deleteAlbum,
    photosHook.fetchPhotos,
    photosHook.uploadPhotos,
    photosHook.deletePhoto,
    handleSetCurrentAlbum,
    openPhotoModal,
    forceRefresh,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};