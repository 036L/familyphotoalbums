// src/hooks/usePhotos.ts - デモモード削除版
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage, createThumbnail, getImageDimensions } from '../lib/imageCompression';
import type { Photo, UploadProgress } from '../types/core';

// デバッグログ関数
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[usePhotos] ${message}`, data);
  }
};

export const usePhotos = (albumId?: string) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const fetchPhotos = useCallback(async (targetAlbumId?: string) => {
    const currentAlbumId = targetAlbumId || albumId;
    
    if (!currentAlbumId) {
      debugLog('アルバムIDが指定されていません');
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      debugLog('写真取得開始', { albumId: currentAlbumId });
      setLoading(true);
      setError(null);

      debugLog('Supabaseから写真取得', currentAlbumId);
      
      let query = supabase
        .from('photos')
        .select(`
          *,
          profiles!photos_uploaded_by_fkey(name)
        `)
        .eq('album_id', currentAlbumId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        debugLog('Supabase写真取得エラー', error);
        throw error;
      }

      debugLog('Supabase写真取得成功', { 
        albumId: currentAlbumId, 
        photoCount: data?.length || 0 
      });

      const photosWithUploaderName = (data || []).map((photo: any) => ({
        ...photo,
        uploader_name: photo.profiles?.name || '不明',
        uploadedAt: photo.created_at,
      }));

      setPhotos(photosWithUploaderName);
    } catch (err) {
      debugLog('写真取得エラー', err);
      console.error('写真取得エラー:', err);
      setError('写真の取得に失敗しました');
      setPhotos([]); // エラー時は空配列を設定
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  const uploadPhotos = async (files: File[], targetAlbumId: string) => {
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

  // アルバムIDが変更されたときに写真を取得
  useEffect(() => {
    debugLog('useEffect実行', { albumId });
    
    if (albumId) {
      fetchPhotos();
    } else {
      // アルバムIDがない場合は空配列を設定
      setPhotos([]);
      setLoading(false);
    }
  }, [albumId, fetchPhotos]);

  // デバッグ用の状態ログ出力（開発時のみ）
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugLog('写真状態変更', { 
        albumId, 
        photoCount: photos.length, 
        loading, 
        error,
        photoIds: photos.map(p => p.id).slice(0, 3) // 最初の3つのIDのみ
      });
    }
  }, [albumId, photos, loading, error]);

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