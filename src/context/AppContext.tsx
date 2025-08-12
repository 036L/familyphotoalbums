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

  // 認証状態に基づいてアルバムを再取得
  useEffect(() => {
    if (auth.user && !auth.loading && !albumsHook.initialized) {
      // 認証完了後にアルバムを取得
      const timer = setTimeout(() => {
        albumsHook.fetchAlbums();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [auth.user, auth.loading, albumsHook.initialized]);

  const logout = async () => {
    try {
      await auth.signOut();
      setCurrentAlbum(null);
      // ローカルストレージもクリア
      localStorage.removeItem('demoAlbums');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleSetCurrentAlbum = (album: Album | null) => {
    setCurrentAlbum(album);
    if (album) {
      photosHook.fetchPhotos(album.id);
    }
  };

  // プロフィール更新の処理を追加
  const updateProfile = async (updates: any) => {
    try {
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
        return await auth.updateProfile(updates);
      } else {
        // 実際のSupabase実装
        return await auth.updateProfile(updates);
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      throw error;
    }
  };

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