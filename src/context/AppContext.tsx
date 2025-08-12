import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAlbums, Album } from '../hooks/useAlbums';
import { usePhotos } from '../hooks/usePhotos';

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  user: any;
  profile: any;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<any>;
  updateProfile: (updates: any) => Promise<any>;
  logout: () => void;
  
  // Albums
  albums: Album[];
  albumsLoading: boolean;
  albumsInitialized: boolean;
  createAlbum: (data: any) => Promise<any>;
  updateAlbum: (id: string, updates: any) => Promise<any>;
  deleteAlbum: (id: string) => Promise<void>;
  
  // Photos
  photos: any[];
  photosLoading: boolean;
  uploadProgress: any[];
  fetchPhotos: (albumId?: string) => Promise<void>;
  uploadPhotos: (files: File[], albumId: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
  
  // UI State
  currentAlbum: Album | null;
  setCurrentAlbum: (album: Album | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// デバッグログ関数
const debugLog = (message: string, data?: any) => {
  console.log(`[AppContext] ${message}`, data);
};

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
  const auth = useAuth();
  const albumsHook = useAlbums();
  const photosHook = usePhotos();
  const [currentAlbum, setCurrentAlbum] = React.useState<Album | null>(null);

  debugLog('AppProvider初期化', {
    hasUser: !!auth.user,
    authLoading: auth.loading,
    albumsLoading: albumsHook.loading,
    albumsInitialized: albumsHook.initialized
  });

  // 認証状態に基づいてアルバムを再取得
  useEffect(() => {
    debugLog('認証状態変更エフェクト', {
      hasUser: !!auth.user,
      authLoading: auth.loading,
      albumsInitialized: albumsHook.initialized,
      albumCount: albumsHook.albums.length
    });

    // 認証が完了し、ユーザーが存在し、まだアルバムが初期化されていない場合
    if (auth.user && !auth.loading && !albumsHook.initialized) {
      debugLog('アルバム初期化をトリガー');
      
      // わずかな遅延を入れて確実に実行
      const timer = setTimeout(() => {
        debugLog('アルバム取得実行');
        albumsHook.fetchAlbums();
      }, 200);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [auth.user, auth.loading, albumsHook.initialized]);

  const logout = async () => {
    try {
      debugLog('ログアウト開始');
      await auth.signOut();
      setCurrentAlbum(null);
      // ローカルストレージもクリア
      localStorage.removeItem('demoAlbums');
      debugLog('ログアウト完了');
    } catch (error) {
      debugLog('ログアウトエラー', error);
      console.error('ログアウトエラー:', error);
    }
  };

  const handleSetCurrentAlbum = (album: Album | null) => {
    debugLog('現在のアルバム変更', album?.title);
    setCurrentAlbum(album);
    if (album) {
      photosHook.fetchPhotos(album.id);
    }
  };

  // プロフィール更新の処理を追加
  const updateProfile = async (updates: any) => {
    try {
      debugLog('プロフィール更新開始', updates);
      
      // デモモードの場合
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // ローカルストレージにプロフィール情報を保存
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
        
        // auth.updateProfileを呼び出して状態を更新
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
  };

  // 全体の状態をデバッグログに出力
  useEffect(() => {
    debugLog('全体状態更新', {
      isAuthenticated: !!auth.user,
      authLoading: auth.loading,
      albumCount: albumsHook.albums.length,
      albumsLoading: albumsHook.loading,
      albumsInitialized: albumsHook.initialized,
      currentAlbum: currentAlbum?.title,
      photoCount: photosHook.photos.length
    });
  }, [
    auth.user, 
    auth.loading, 
    albumsHook.albums.length, 
    albumsHook.loading, 
    albumsHook.initialized, 
    currentAlbum, 
    photosHook.photos.length
  ]);

  return (
    <AppContext.Provider
      value={{
        // Auth
        isAuthenticated: !!auth.user,
        user: auth.user,
        profile: auth.profile,
        loading: auth.loading,
        signInWithEmail: auth.signInWithEmail,
        signUpWithEmail: auth.signUpWithEmail,
        updateProfile,
        logout,
        
        // Albums
        albums: albumsHook.albums,
        albumsLoading: albumsHook.loading,
        albumsInitialized: albumsHook.initialized,
        createAlbum: albumsHook.createAlbum,
        updateAlbum: albumsHook.updateAlbum,
        deleteAlbum: albumsHook.deleteAlbum,
        
        // Photos
        photos: photosHook.photos,
        photosLoading: photosHook.loading,
        uploadProgress: photosHook.uploadProgress,
        fetchPhotos: photosHook.fetchPhotos,
        uploadPhotos: photosHook.uploadPhotos,
        deletePhoto: photosHook.deletePhoto,
        
        // UI State
        currentAlbum,
        setCurrentAlbum: handleSetCurrentAlbum,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};