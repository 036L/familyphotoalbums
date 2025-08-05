import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  photo_count?: number;
  creator_name?: string;
}

export const useAlbums = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('albums')
        .select(`
          *,
          profiles!albums_created_by_fkey(name),
          photos(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const albumsWithCounts = data.map(album => ({
        ...album,
        photo_count: album.photos?.[0]?.count || 0,
        creator_name: album.profiles?.name || '不明',
      }));

      setAlbums(albumsWithCounts);
    } catch (err) {
      console.error('アルバム取得エラー:', err);
      setError('アルバムの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const createAlbum = async (albumData: {
    title: string;
    description?: string;
    is_public?: boolean;
  }) => {
    try {
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
      return data;
    } catch (err) {
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

  useEffect(() => {
    fetchAlbums();
  }, []);

  return {
    albums,
    loading,
    error,
    fetchAlbums,
    createAlbum,
    updateAlbum,
    deleteAlbum,
  };
};