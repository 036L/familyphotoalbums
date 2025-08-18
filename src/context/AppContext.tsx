// src/context/AppContext.tsx - 修正版
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

  // 強制リフレッシュ関数（デバッグ用）
  const forceRefresh = useCallback(() => {
    debugLog('強制リフレッシュ実行');
    if (albumsHook.forceReinitialize) {
      albumsHook.forceReinitialize();
    }
  }, [albumsHook.forceReinitialize]);

  // 認証状態の変更とアルバム初期化の同期（大幅改善）
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
      if (isDemo || auth.user) {
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
      isDemo,
      shouldInitialize: shouldInitializeAlbums()
    });

    if (shouldInitializeAlbums()) {
      debugLog('アルバム初期化をトリガー');
      
      // 少し遅延を入れて確実に実行
      const timer = setTimeout(() => {
        debugLog('アルバム取得実行');
        albumsHook.fetchAlbums();
      }, 50); // 遅延を短縮
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [
    auth.loading,
    auth.initialized,
    auth.user,
    albumsHook.initialized,
    albumsHook.loading,
    albumsHook.fetchAlbums,
    isDemo
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
        photoCount: photosState.photos.length,
        isDemo
      });
    }
  }, [
    authState, 
    auth.initialized, 
    albumsState, 
    photosState, 
    currentAlbum, 
    isDemo
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
    forceRefresh,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};