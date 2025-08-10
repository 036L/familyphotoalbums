// src/hooks/useAlbums.ts
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
  createdAt: string; // 互換性のため
}

// デモデータ
const demoAlbums: Album[] = [
  {
    id: '1',
    title: '2024年家族旅行',
    description: '沖縄での楽しい思い出',
    cover_image_url: 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_by: 'demo-user-1',
    is_public: false,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    photo_count: 24,
    creator_name: 'デモユーザー'
  },
  {
    id: '2',
    title: 'お正月2024',
    description: 'みんなでお雑煮を食べました',
    cover_image_url: 'https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_by: 'demo-user-1',
    is_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    photo_count: 18,
    creator_name: 'デモユーザー'
  },
  {
    id: '3',
    title: '桜の季節',
    description: '近所の公園で花見',
    cover_image_url: 'https://images.pexels.com/photos/1647962/pexels-photo-1647962.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_by: 'demo-user-1',
    is_public: false,
    created_at: '2024-04-05T00:00:00Z',
    updated_at: '2024-04-05T00:00:00Z',
    createdAt: '2024-04-05T00:00:00Z',
    photo_count: 12,
    creator_name: 'デモユーザー'
  },
  {
    id: '4',
    title: '夏祭り',
    description: '地域の夏祭りに参加',
    cover_image_url: 'https://images.pexels.com/photos/1679618/pexels-photo-1679618.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_by: 'demo-user-1',
    is_public: false,
    created_at: '2024-07-20T00:00:00Z',
    updated_at: '2024-07-20T00:00:00Z',
    createdAt: '2024-07-20T00:00:00Z',
    photo_count: 30,
    creator_name: 'デモユーザー'
  }
];

const isDemo = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

export const useAlbums = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // デモモードの場合はデモデータを使用
        setTimeout(() => {
          setAlbums(demoAlbums);
          setLoading(false);
        }, 500);
        return;
      }

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
        createdAt: album.created_at,
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
      if (isDemo) {
        // デモモードでは新しいアルバムをローカルに追加
        const newAlbum: Album = {
          id: Date.now().toString(),
          ...albumData,
          description: albumData.description || null,
          cover_image_url: null,
          created_by: 'demo-user-1',
          is_public: albumData.is_public || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          photo_count: 0,
          creator_name: 'デモユーザー'
        };
        setAlbums(prev => [newAlbum, ...prev]);
        return newAlbum;
      }

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
      if (isDemo) {
        // デモモードではローカルで更新
        setAlbums(prev => 
          prev.map(album => 
            album.id === id 
              ? { ...album, ...updates, updated_at: new Date().toISOString() }
              : album
          )
        );
        return { id, ...updates };
      }

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
      if (isDemo) {
        // デモモードではローカルから削除
        setAlbums(prev => prev.filter(album => album.id !== id));
        return;
      }

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