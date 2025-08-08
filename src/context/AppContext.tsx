import React, { createContext, useContext, ReactNode } from 'react';
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
  logout: () => void;
  
  // Albums
  albums: Album[];
  albumsLoading: boolean;
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

  const logout = async () => {
    try {
      await auth.signOut();
      setCurrentAlbum(null);
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
        logout,
        
        // Albums
        albums: albumsHook.albums,
        albumsLoading: albumsHook.loading,
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