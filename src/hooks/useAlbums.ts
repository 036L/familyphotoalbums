// src/hooks/useAlbums.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEnvironment } from './useEnvironment';
import type { Album, AlbumCreateData } from '../types/core';

// デバッグログ関数
const debugLog = (message: string, data?: any) => {
  console.log(`[useAlbums] ${message}`, data);
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

// デモデータを改善（実際の画像URLを使用）
const demoAlbums: Album[] = [
  {
    id: '1',
    title: '2024年家族旅行',
    description: '沖縄での楽しい思い出',
    cover_image_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
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
    cover_image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
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
    cover_image_url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=400&fit=crop',
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
    cover_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    created_by: 'demo-user-1',
    is_public: false,
    created_at: '2024-07-20T00:00:00Z',
    updated_at: '2024-07-20T00:00:00Z',
    createdAt: '2024-07-20T00:00:00Z',
    photo_count: 30,
    creator_name: 'デモユーザー'
  },
  {
    id: '5',
    title: '秋の紅葉狩り',
    description: '山に紅葉を見に行きました',
    cover_image_url: 'https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=400&h=400&fit=crop',
    created_by: 'demo-user-1',
    is_public: false,
    created_at: '2024-11-10T00:00:00Z',
    updated_at: '2024-11-10T00:00:00Z',
    createdAt: '2024-11-10T00:00:00Z',
    photo_count: 45,
    creator_name: 'デモユーザー'
  },
  {
    id: '6',
    title: '誕生日パーティー',
    description: 'おじいちゃんの80歳のお祝い',
    cover_image_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=400&fit=crop',
    created_by: 'demo-user-1',
    is_public: false,
    created_at: '2024-08-25T00:00:00Z',
    updated_at: '2024-08-25T00:00:00Z',
    createdAt: '2024-08-25T00:00:00Z',
    photo_count: 67,
    creator_name: 'デモユーザー'
  }
];

export const useAlbums = () => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // 環境情報をHookで取得
  const { isDemo } = useEnvironment();

  debugLog('useAlbums初期化', { isDemo });

  // カバー画像を自動設定する関数
  const getLatestPhotoForCover = async (albumId: string): Promise<string | null> => {
    try {
      if (isDemo) {
        // デモモードでは既にカバー画像が設定されている
        return null;
      }

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
      if (isDemo) return;

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

  const fetchAlbums = async () => {
    try {
      debugLog('アルバム取得開始');
      setLoading(true);
      setError(null);

      if (isDemo) {
        debugLog('デモモードでアルバム取得');
        
        // ローカルストレージから追加されたアルバムも読み込み
        let allAlbums = [...demoAlbums];
        
        try {
          const savedAlbums = localStorage.getItem('demoAlbums');
          if (savedAlbums) {
            const parsedSavedAlbums = JSON.parse(savedAlbums);
            if (Array.isArray(parsedSavedAlbums)) {
              allAlbums = [...parsedSavedAlbums, ...demoAlbums];
              debugLog('保存されたアルバムを統合', { savedCount: parsedSavedAlbums.length });
            }
          }
        } catch (e) {
          debugLog('保存されたアルバムの読み込みに失敗', e);
        }
        
        debugLog('最終アルバム数', allAlbums.length);
        
        // 少し遅延を入れて確実に状態を更新
        setTimeout(() => {
          setAlbums(allAlbums);
          setLoading(false);
          setInitialized(true);
          debugLog('デモアルバム設定完了', allAlbums);
        }, 100);
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
    } catch (err) {
      debugLog('アルバム取得エラー', err);
      console.error('アルバム取得エラー:', err);
      setError('アルバムの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const createAlbum = async (albumData: AlbumCreateData) => {
    try {
      debugLog('アルバム作成開始', albumData);
      
      if (isDemo) {
        // デモモードでは新しいアルバムをローカルに追加
        const newAlbum: Album = {
          id: `demo-${Date.now()}`,
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
        
        const newAlbums = [newAlbum, ...albums];
        setAlbums(newAlbums);
        
        // ローカルストレージに保存（デモアルバムは除外）
        const userCreatedAlbums = newAlbums.filter(album => 
          !demoAlbums.find(demo => demo.id === album.id)
        );
        localStorage.setItem('demoAlbums', JSON.stringify(userCreatedAlbums));
        
        debugLog('デモアルバム作成完了', newAlbum);
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
      if (isDemo) {
        // デモモードではローカルで更新
        const updatedAlbums = albums.map(album => 
          album.id === id 
            ? { ...album, ...updates, updated_at: new Date().toISOString() }
            : album
        );
        setAlbums(updatedAlbums);
        
        // ローカルストレージも更新
        const userCreatedAlbums = updatedAlbums.filter(album => 
          !demoAlbums.find(demo => demo.id === album.id)
        );
        localStorage.setItem('demoAlbums', JSON.stringify(userCreatedAlbums));
        
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
        const updatedAlbums = albums.filter(album => album.id !== id);
        setAlbums(updatedAlbums);
        
        // ローカルストレージも更新
        const userCreatedAlbums = updatedAlbums.filter(album => 
          !demoAlbums.find(demo => demo.id === album.id)
        );
        localStorage.setItem('demoAlbums', JSON.stringify(userCreatedAlbums));
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

  useEffect(() => {
    let mounted = true;
    
    debugLog('useAlbumsエフェクト実行');
    
    // 少し遅延を入れて確実に実行
    const timer = setTimeout(() => {
      if (mounted) {
        debugLog('アルバム取得開始タイマー実行');
        fetchAlbums();
      }
    }, 50);

    return () => {
      mounted = false;
      clearTimeout(timer);
      debugLog('useAlbumsクリーンアップ');
    };
  }, [isDemo]); // isDemo が変更されたときに再実行

  // デバッグ用の状態ログ出力
  useEffect(() => {
    debugLog('アルバム状態変更', { 
      albumCount: albums.length, 
      loading, 
      initialized, 
      error 
    });
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