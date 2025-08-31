// src/components/photo/PhotoGrid.tsx - バッジ統合版
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Photo } from '../../types/core';
import { PhotoModal } from './PhotoModal';
import { NewCommentBadge } from '../ui/NewCommentBadge';
import { useNewCommentBadge } from '../../hooks/ui/useNewCommentBadge';

export const PhotoGrid: React.FC = () => {
  const { photos, photosLoading, currentAlbum } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // デバッグログ（開発時のみ）
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[PhotoGrid] 状態変更:', {
        albumId: currentAlbum?.id,
        photoCount: photos.length,
        loading: photosLoading,
        hasPhotos: photos.length > 0
      });
    }
  }, [photos, photosLoading, currentAlbum]);

  // ローディング中の表示
  if (photosLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">写真を読み込んでいます...</p>
        </div>
        
        {/* スケルトンローダー */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 写真がない場合の表示
  if (!photosLoading && photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">まだ写真がありません</h3>
        <p className="text-gray-600">最初の思い出を追加してみましょう</p>
      </div>
    );
  }

  // 個別の写真バッジコンポーネント（パフォーマンス最適化）
  const PhotoWithBadge: React.FC<{ photo: Photo; onClick: () => void }> = ({ photo, onClick }) => {
    const { newCommentCount } = useNewCommentBadge({
      targetId: photo.id,
      targetType: 'photo',
      enabled: true
    });

    return (
      <div className="relative">
      <div
        className="aspect-square cursor-pointer group overflow-hidden rounded-xl bg-gray-100 relative"
        onClick={onClick}
      >
        <img
          src={photo.thumbnail_url || photo.url}
          alt={photo.original_filename || photo.filename}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // エラー時は非表示にして、フォールバックアイコンを表示
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.fallback-icon')) {
              const fallback = document.createElement('div');
              fallback.className = 'fallback-icon absolute inset-0 flex items-center justify-center bg-gray-200';
              fallback.innerHTML = `
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              `;
              parent.appendChild(fallback);
            }
          }}
        />
        
        {/* ホバー時のオーバーレイ */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>
      {/* 新着コメントバッジ */}
      <NewCommentBadge
          count={newCommentCount}
          variant="photo"
          size="sm"
        />
      </div>
    );
  };

  // 写真グリッドの表示
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <PhotoWithBadge
            key={photo.id}
            photo={photo}
            onClick={() => setSelectedPhoto(photo)}
          />
        ))}
      </div>

      {/* 写真モーダル */}
      <PhotoModal
        photo={selectedPhoto}
        photos={photos}
        isOpen={!!selectedPhoto}
        onClose={() => {
          console.log('[PhotoGrid] モーダルを閉じる');
          setSelectedPhoto(null);
        }}
        showNavigation={true}
        showComments={true}
        onPhotoChange={(newPhoto) => {
          console.log('[PhotoGrid] 写真変更:', newPhoto?.filename);
          setSelectedPhoto(newPhoto);
        }}
      />
    </>
  );
};