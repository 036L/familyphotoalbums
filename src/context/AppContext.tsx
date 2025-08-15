// src/context/AppContext.tsx
import React, { createContext, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAlbums } from '../hooks/useAlbums';
import { usePhotos } from '../hooks/usePhotos';
import { useEnvironment } from '../hooks/useEnvironment';
import type { Album } from '../types/core';

// デバッグログ関数（開発時のみ有効）
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[AppContext] ${message}`, data);
  }
};

interface AppContextType {
  // Auth - メモ化された認証状態
  isAuthenticated: boolean;
  user: any;
  profile: any;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<any>;
  updateProfile: (updates: any) => Promise<any>;
  logout: () => void;
  
  // Albums - メモ化されたアルバム状態
  albums: Album[];
  albumsLoading: boolean;
  albumsInitialized: boolean;
  createAlbum: (data: any) => Promise<any>;
  updateAlbum: (id: string, updates: any) => Promise<any>;
  deleteAlbum: (id: string) => Promise<void>;
  
  // Photos - メモ化された写真状態
  photos: any[];
  photosLoading: boolean;
  uploadProgress: any[];
  fetchPhotos: (albumId?: string) => Promise<void>;
  uploadPhotos: (files: File[], albumId: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  
  // UI State - 最適化されたUI状態管理
  currentAlbum: Album | null;
  setCurrentAlbum: (album: Album | null) => void;
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
  const { isDemo } = useEnvironment();
  const [currentAlbum, setCurrentAlbum] = React.useState<Album | null>(null);

  // メモ化された認証状態
  const authState = useMemo(() => ({
    isAuthenticated: !!auth.user,
    user: auth.user,
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
      
      // デモモードの場合のクリーンアップ
      if (isDemo) {
        localStorage.removeItem('demoAlbums');
      }
      
      debugLog('ログアウト完了');
    } catch (error) {
      debugLog('ログアウトエラー', error);
      console.error('ログアウトエラー:', error);
    }
  }, [auth.signOut, isDemo]);

  // 最適化されたアルバム選択処理
  const handleSetCurrentAlbum = useCallback((album: Album | null) => {
    debugLog('現在のアルバム変更', album?.title);
    setCurrentAlbum(album);
    if (album) {
      photosHook.fetchPhotos(album.id);
    }
  }, [photosHook.fetchPhotos]);

  // 最適化されたプロフィール更新処理
  const updateProfile = useCallback(async (updates: any) => {
    try {
      debugLog('プロフィール更新開始', updates);
      
      if (isDemo) {
        // デモモードでの更新処理
        const currentProfile = auth.profile || {
          id: 'demo-user-1',
          name: 'デモユーザー',
          email: 'test@example.com',
          avatar_url: null,
          role: 'admin'
        };
        
        const updatedProfile = {
          ...currentProfile,
          ...updates,
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('demoProfile', JSON.stringify(updatedProfile));
        const result = await auth.updateProfile(updates);
        debugLog('プロフィール更新完了', result);
        return result;
      } else {
        // 実際のSupabase実装
        return await auth.updateProfile(updates);
      }
    } catch (error) {
      debugLog('プロフィール更新エラー', error);
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  }, [auth.updateProfile, auth.profile, isDemo]);

  // 認証状態変更時のアルバム取得処理（最適化）
  useEffect(() => {
    debugLog('認証状態変更エフェクト', {
      hasUser: !!auth.user,
      authLoading: auth.loading,
      albumsInitialized: albumsHook.initialized,
      albumCount: albumsHook.albums.length
    });

    // 条件を明確にして不要な実行を防ぐ
    const shouldFetchAlbums = 
      auth.user && 
      !auth.loading && 
      !albumsHook.initialized &&
      !albumsHook.loading; // 既に読み込み中でない場合のみ

    if (shouldFetchAlbums) {
      debugLog('アルバム初期化をトリガー');
      
      // 確実に実行するための最小限の遅延
      const timer = setTimeout(() => {
        debugLog('アルバム取得実行');
        albumsHook.fetchAlbums();
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [auth.user, auth.loading, albumsHook.initialized, albumsHook.loading]);

  // デバッグ用：状態変更の監視（開発時のみ）
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugLog('全体状態更新', {
        isAuthenticated: authState.isAuthenticated,
        authLoading: authState.loading,
        albumCount: albumsState.albums.length,
        albumsLoading: albumsState.albumsLoading,
        albumsInitialized: albumsState.albumsInitialized,
        currentAlbum: currentAlbum?.title,
        photoCount: photosState.photos.length
      });
    }
  }, [authState, albumsState, photosState, currentAlbum]);

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
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};