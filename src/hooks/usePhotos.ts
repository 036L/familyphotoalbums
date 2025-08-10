import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage, createThumbnail, getImageDimensions } from '../lib/imageCompression';

export interface Photo {
  id: string;
  filename: string;
  original_filename: string;
  url: string;
  thumbnail_url: string | null;
  file_type: 'image' | 'video';
  file_size: number;
  width: number | null;
  height: number | null;
  album_id: string;
  uploaded_by: string;
  metadata: Record<string, any>;
  created_at: string;
  uploader_name?: string;
  uploadedAt?: string; // 互換性のため
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'compressing' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// デモデータ
const demoPhotos: Record<string, Photo[]> = {
  '1': [ // 2024年家族旅行
    {
      id: 'demo-1',
      filename: 'beach-sunset.jpg',
      original_filename: 'beach-sunset.jpg',
      url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=300&fit=crop',
      file_type: 'image',
      file_size: 1024000,
      width: 800,
      height: 600,
      album_id: '1',
      uploaded_by: 'demo-user-1',
      metadata: {},
      created_at: '2024-01-15T10:00:00Z',
      uploadedAt: '2024-01-15T10:00:00Z',
      uploader_name: 'デモユーザー'
    },
    {
      id: 'demo-2',
      filename: 'family-beach.jpg',
      original_filename: 'family-beach.jpg',
      url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&h=600&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=300&h=300&fit=crop',
      file_type: 'image',
      file_size: 956000,
      width: 800,
      height: 600,
      album_id: '1',
      uploaded_by: 'demo-user-1',
      metadata: {},
      created_at: '2024-01-15T12:30:00Z',
      uploadedAt: '2024-01-15T12:30:00Z',
      uploader_name: 'デモユーザー'
    },
    {
      id: 'demo-3',
      filename: 'tropical-fish.jpg',
      original_filename: 'tropical-fish.jpg',
      url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=300&fit=crop',
      file_type: 'image',
      file_size: 780000,
      width: 800,
      height: 600,
      album_id: '1',
      uploaded_by: 'demo-user-1',
      metadata: {},
      created_at: '2024-01-16T09:15:00Z',
      uploadedAt: '2024-01-16T09:15:00Z',
      uploader_name: 'デモユーザー'
    },
    {
      id: 'demo-4',
      filename: 'hotel-pool.jpg',
      original_filename: 'hotel-pool.jpg',
      url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=300&fit=crop',
      file_type: 'image',
      file_size: 1200000,
      width: 800,
      height: 600,
      album_id: '1',
      uploaded_by: 'demo-user-1',
      metadata: {},
      created_at: '2024-01-16T16:45:00Z',
      uploadedAt: '2024-01-16T16:45:00Z',
      uploader_name: 'デモユーザー'
    }
  ],
  '2': [ // お正月2024
    {
      id: 'demo-5',
      filename: 'osechi.jpg',
      original_filename: 'osechi.jpg',
      url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop',
      file_type: 'image',
      file_size: 890000,
      width: 800,
      height: 600,
      album_id: '2',
      uploaded_by: 'demo-user-1',
      metadata: {},
      created_at: '2024-01-01T12:00:00Z',
      uploadedAt: '2024-01-01T12:00:00Z',
      uploader_name: 'デモユーザー'
    },
    {
      id: 'demo-6',
      filename: 'family-new-year.jpg',
      original_filename: 'family-new-year.jpg',
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
      file_type: 'image',
      file_size: 1100000,
      width: 800,
      height: 600,
      album_id: '2',
      uploaded_by: 'demo-user-1',
      metadata: {},
      created_at: '2024-01-01T15:30:00Z',
      uploadedAt: '2024-01-01T15:30:00Z',
      uploader_name: 'デモユーザー'
    }
  ],
  '3': [ // 桜の季節
    {
      id: 'demo-7',
      filename: 'sakura-tree.jpg',
      original_filename: 'sakura-tree.jpg',
      url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&h=600&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=300&h=300&fit=crop',
      file_type: 'image',
      file_size: 1050000,
      width: 800,
      height: 600,
      album_id: '3',
      uploaded_by: 'demo-user-1',
      metadata: {},
      created_at: '2024-04-05T14:20:00Z',
      uploadedAt: '2024-04-05T14:20:00Z',
      uploader_name: 'デモユーザー'
    },
    {
      id: 'demo-8',
      filename: 'hanami-picnic.jpg',
      original_filename: 'hanami-picnic.jpg',
      url: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800&h=600&fit=crop',
      thumbnail_url: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=300&h=300&fit=crop',
      file_type: 'image',
      file_size: 920000,
      width: 800,
      height: 600,
      album_id: '3',
      uploaded_by: 'demo-user-1',
      metadata: {},
      created_at: '2024-04-05T16:10:00Z',
      uploadedAt: '2024-04-05T16:10:00Z',
      uploader_name: 'デモユーザー'
    }
  ]
};

const isDemo = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

export const usePhotos = (albumId?: string) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const fetchPhotos = async (targetAlbumId?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // デモモードの場合
        setTimeout(() => {
          const albumPhotos = demoPhotos[targetAlbumId || albumId || ''] || [];
          setPhotos(albumPhotos);
          setLoading(false);
        }, 300);
        return;
      }

      let query = supabase
        .from('photos')
        .select(`
          *,
          profiles!photos_uploaded_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (targetAlbumId || albumId) {
        query = query.eq('album_id', targetAlbumId || albumId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const photosWithUploaderName = data.map(photo => ({
        ...photo,
        uploader_name: photo.profiles?.name || '不明',
        uploadedAt: photo.created_at,
      }));

      setPhotos(photosWithUploaderName);
    } catch (err) {
      console.error('写真取得エラー:', err);
      setError('写真の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhotos = async (files: File[], targetAlbumId: string) => {
    if (isDemo) {
      // デモモードでのアップロードシミュレーション
      const initialProgress = files.map(file => ({
        file,
        progress: 0,
        status: 'compressing' as const,
      }));
      setUploadProgress(initialProgress);

      // 段階的な進行状況の更新をシミュレート
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 圧縮段階
        setUploadProgress(prev => 
          prev.map((item, index) => 
            index === i ? { ...item, status: 'compressing', progress: 20 } : item
          )
        );
        await new Promise(resolve => setTimeout(resolve, 500));

        // アップロード段階
        setUploadProgress(prev => 
          prev.map((item, index) => 
            index === i ? { ...item, status: 'uploading', progress: 60 } : item
          )
        );
        await new Promise(resolve => setTimeout(resolve, 800));

        // 完了
        setUploadProgress(prev => 
          prev.map((item, index) => 
            index === i ? { ...item, status: 'completed', progress: 100 } : item
          )
        );

        // デモ写真をローカルに追加
        const newPhoto: Photo = {
          id: `demo-new-${Date.now()}-${i}`,
          filename: file.name,
          original_filename: file.name,
          url: URL.createObjectURL(file),
          thumbnail_url: URL.createObjectURL(file),
          file_type: file.type.startsWith('image/') ? 'image' : 'video',
          file_size: file.size,
          width: 800,
          height: 600,
          album_id: targetAlbumId,
          uploaded_by: 'demo-user-1',
          metadata: { demo: true },
          created_at: new Date().toISOString(),
          uploadedAt: new Date().toISOString(),
          uploader_name: 'デモユーザー'
        };

        setPhotos(prev => [newPhoto, ...prev]);
      }

      // 進行状況をクリア
      setTimeout(() => {
        setUploadProgress([]);
      }, 2000);

      return;
    }

    // 実際のSupabaseアップロード処理
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ログインが必要です');

    // 進行状況の初期化
    const initialProgress = files.map(file => ({
      file,
      progress: 0,
      status: 'compressing' as const,
    }));
    setUploadProgress(initialProgress);

    const uploadPromises = files.map(async (file, index) => {
      try {
        // 1. 画像圧縮
        setUploadProgress(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, status: 'compressing', progress: 10 } : item
          )
        );

        let compressedFile = file;
        let thumbnailFile: File | null = null;
        let dimensions: { width: number; height: number } | null = null;

        if (file.type.startsWith('image/')) {
          compressedFile = await compressImage(file);
          thumbnailFile = await createThumbnail(file);
          dimensions = await getImageDimensions(file);
        }

        // 2. メインファイルのアップロード
        setUploadProgress(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, status: 'uploading', progress: 30 } : item
          )
        );

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        // 3. サムネイルのアップロード（画像の場合）
        let thumbnailPath: string | null = null;
        if (thumbnailFile) {
          setUploadProgress(prev => 
            prev.map((item, i) => 
              i === index ? { ...item, progress: 60 } : item
            )
          );

          const thumbnailFileName = `${user.id}/thumbnails/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { data: thumbnailData, error: thumbnailError } = await supabase.storage
            .from('photos')
            .upload(thumbnailFileName, thumbnailFile);

          if (!thumbnailError && thumbnailData) {
            thumbnailPath = thumbnailData.path;
          }
        }

        // 4. データベースに保存
        setUploadProgress(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, progress: 80 } : item
          )
        );

        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(uploadData.path);

        const thumbnailUrl = thumbnailPath 
          ? supabase.storage.from('photos').getPublicUrl(thumbnailPath).data.publicUrl
          : null;

        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            filename: uploadData.path,
            original_filename: file.name,
            url: urlData.publicUrl,
            thumbnail_url: thumbnailUrl,
            file_type: file.type.startsWith('image/') ? 'image' : 'video',
            file_size: compressedFile.size,
            width: dimensions?.width || null,
            height: dimensions?.height || null,
            album_id: targetAlbumId,
            uploaded_by: user.id,
            metadata: {
              original_size: file.size,
              compressed_size: compressedFile.size,
              compression_ratio: file.size > 0 ? compressedFile.size / file.size : 1,
            },
          });

        if (dbError) throw dbError;

        // 5. 完了
        setUploadProgress(prev => 
          prev.map((item, i) => 
            i === index ? { ...item, status: 'completed', progress: 100 } : item
          )
        );

      } catch (error) {
        console.error('アップロードエラー:', error);
        setUploadProgress(prev => 
          prev.map((item, i) => 
            i === index ? { 
              ...item, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'アップロードに失敗しました'
            } : item
          )
        );
      }
    });

    await Promise.all(uploadPromises);
    
    // アップロード完了後、写真一覧を再取得
    await fetchPhotos(targetAlbumId);
    
    // 進行状況をクリア
    setTimeout(() => {
      setUploadProgress([]);
    }, 2000);
  };

  const deletePhoto = async (id: string) => {
    try {
      if (isDemo) {
        // デモモードではローカルから削除
        setPhotos(prev => prev.filter(p => p.id !== id));
        return;
      }

      // データベースから写真情報を取得
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('filename, thumbnail_url')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // ストレージからファイルを削除
      const filesToDelete = [photo.filename];
      if (photo.thumbnail_url) {
        // サムネイルのパスを抽出（URLからパス部分のみを取得）
        const url = new URL(photo.thumbnail_url);
        const pathSegments = url.pathname.split('/');
        // '/storage/v1/object/public/photos/' を除いた部分を取得
        const thumbnailPath = pathSegments.slice(6).join('/');
        if (thumbnailPath) {
          filesToDelete.push(thumbnailPath);
        }
      }

      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove(filesToDelete);

      if (storageError) {
        console.error('ストレージ削除エラー:', storageError);
      }

      // データベースから削除
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // ローカル状態を更新
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('写真削除エラー:', err);
      throw new Error('写真の削除に失敗しました');
    }
  };

  useEffect(() => {
    if (albumId) {
      fetchPhotos();
    }
  }, [albumId]);

  return {
    photos,
    loading,
    error,
    uploadProgress,
    fetchPhotos,
    uploadPhotos,
    deletePhoto,
  };
};