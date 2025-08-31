// src/hooks/useAlbums.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Album, AlbumCreateData } from '../types/core';

// デバッグログ関数
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[useAlbums] ${message}`, data);
  }
};

// データベースから取得される生のアルバムデータの型
interface RawAlbumData {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string;
  } | null;
  photos?: Array<{ count: number }>;
}

export const useAlbums = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  debugLog('useAlbums初期化');

  // カバー画像を自動設定する関数
  const getLatestPhotoForCover = async (albumId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('thumbnail_url, url')
        .eq('album_id', albumId)
        .eq('file_type', 'image')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return data.thumbnail_url || data.url;
    } catch (err) {
      console.warn('カバー画像取得エラー:', err);
      return null;
    }
  };

  // アルバムのカバー画像を更新する関数
  const updateAlbumCover = async (albumId: string, coverImageUrl: string) => {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ 
          cover_image_url: coverImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', albumId);

      if (error) throw error;

      // ローカル状態も更新
      setAlbums(prev => 
        prev.map(album => 
          album.id === albumId 
            ? { ...album, cover_image_url: coverImageUrl }
            : album
        )
      );
    } catch (err) {
      console.error('カバー画像更新エラー:', err);
    }
  };

  const fetchAlbums = useCallback(async () => {
    // 既に初期化済みの場合はスキップ
    if (initialized) {
      debugLog('既に初期化済みのためスキップ');
      return albums;
    }

    try {
      debugLog('アルバム取得開始');
      setLoading(true);
      setError(null);

      // Supabaseからの取得処理
      const { data, error } = await supabase
        .from('albums')
        .select(`
          *,
          profiles!albums_created_by_fkey(name),
          photos(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const albumsWithCounts = await Promise.all(
        (data as RawAlbumData[]).map(async (album: RawAlbumData) => {
          let coverImageUrl = album.cover_image_url;
          
          // カバー画像が設定されていない場合、最新の写真を取得
          if (!coverImageUrl) {
            coverImageUrl = await getLatestPhotoForCover(album.id);
            if (coverImageUrl) {
              // カバー画像を非同期で更新（UIをブロックしない）
              updateAlbumCover(album.id, coverImageUrl);
            }
          }

          const processedAlbum: Album = {
            ...album,
            createdAt: album.created_at,
            cover_image_url: coverImageUrl,
            photo_count: album.photos?.[0]?.count || 0,
            creator_name: album.profiles?.name || '不明',
          };

          return processedAlbum;
        })
      );

      setAlbums(albumsWithCounts);
      setInitialized(true);
      debugLog('Supabaseアルバム取得完了', albumsWithCounts);
      return albumsWithCounts;
    } catch (err) {
      debugLog('アルバム取得エラー', err);
      console.error('アルバム取得エラー:', err);
      setError('アルバムの取得に失敗しました');
      return [];
    } finally {
      setLoading(false);
    }
  }, [initialized, albums]);

  const createAlbum = async (albumData: AlbumCreateData) => {
    try {
      debugLog('アルバム作成開始', albumData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      const { data, error } = await supabase
        .from('albums')
        .insert({
          ...albumData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAlbums(); // アルバム一覧を再取得
      debugLog('Supabaseアルバム作成完了', data);
      return data;
    } catch (err) {
      debugLog('アルバム作成エラー', err);
      console.error('アルバム作成エラー:', err);
      throw new Error('アルバムの作成に失敗しました');
    }
  };

  const updateAlbum = async (id: string, updates: Partial<Album>) => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchAlbums(); // アルバム一覧を再取得
      return data;
    } catch (err) {
      console.error('アルバム更新エラー:', err);
      throw new Error('アルバムの更新に失敗しました');
    }
  };

  const deleteAlbum = async (id: string) => {
    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchAlbums(); // アルバム一覧を再取得
    } catch (err) {
      console.error('アルバム削除エラー:', err);
      throw new Error('アルバムの削除に失敗しました');
    }
  };

  // 写真が追加された時にカバー画像を自動更新
  const handlePhotoAdded = async (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album?.cover_image_url) {
      const newCoverImage = await getLatestPhotoForCover(albumId);
      if (newCoverImage) {
        await updateAlbumCover(albumId, newCoverImage);
      }
    }
  };

  // デバッグ用の状態ログ出力（開発時のみ）
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugLog('アルバム状態変更', { 
        albumCount: albums.length, 
        loading, 
        initialized, 
        error,
        albumTitles: albums.map(a => a.title).slice(0, 3) // 最初の3つのタイトルのみ
      });
    }
  }, [albums, loading, initialized, error]);

  return {
    albums,
    loading,
    error,
    initialized,
    fetchAlbums,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    updateAlbumCover,
    handlePhotoAdded, // 写真追加時の処理
  };
};