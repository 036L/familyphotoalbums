// src/components/photo/PhotoModal.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Calendar, User, Trash2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';
import { CommentSection } from './CommentSection';
import { useApp } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import type { Photo } from '../../types/core';

// Props型の厳密な定義
interface PhotoModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  photos?: Photo[];
  className?: string;
  // オプショナルなコールバック
  onPhotoChange?: (photo: Photo) => void;
  onPhotoDeleted?: (photoId: string) => void;
  // 表示オプション
  showComments?: boolean;
  showNavigation?: boolean;
  showDeleteButton?: boolean;
  // アクセシビリティ
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// エラー境界用のエラー型
interface PhotoModalError {
  type: 'PHOTO_NOT_FOUND' | 'PERMISSION_DENIED' | 'DELETE_FAILED' | 'NAVIGATION_ERROR';
  message: string;
  photoId?: string;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  photo,
  isOpen,
  onClose,
  photos = [],
  className = '',
  onPhotoChange,
  onPhotoDeleted,
  showComments = true,
  showNavigation = true,
  showDeleteButton = true,
  ariaLabel = '写真詳細モーダル',
  ariaDescribedBy,
}) => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<PhotoModalError | null>(null);

  const { deletePhoto, currentAlbum } = useApp();
  const { canDeleteResource, canManageAlbum } = usePermissions();

  // エラーハンドリング用のユーティリティ関数
  const handleError = useCallback((error: PhotoModalError) => {
    console.error('[PhotoModal] エラー:', error);
    setError(error);
    
    // エラーの種類に応じた処理
    switch (error.type) {
      case 'PHOTO_NOT_FOUND':
        // 写真が見つからない場合はモーダルを閉じる
        setTimeout(onClose, 2000);
        break;
      case 'PERMISSION_DENIED':
        // 権限エラーの場合はアラート表示
        alert(error.message);
        break;
      case 'DELETE_FAILED':
        // 削除失敗の場合はモーダルは開いたまま
        break;
      case 'NAVIGATION_ERROR':
        // ナビゲーションエラーは自動回復を試行
        setCurrentIndex(0);
        break;
    }
  }, [onClose]);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // photoの変更を監視してインデックスを更新（エラーハンドリング付き）
  useEffect(() => {
    if (!photo) {
      setCurrentIndex(0);
      return;
    }

    if (photos.length === 0) {
      // 写真リストが空の場合はエラー
      if (isOpen) {
        handleError({
          type: 'PHOTO_NOT_FOUND',
          message: '表示する写真が見つかりません',
          photoId: photo.id
        });
      }
      return;
    }

    const index = photos.findIndex(p => p.id === photo.id);
    if (index === -1) {
      // 写真がリストに見つからない場合
      handleError({
        type: 'PHOTO_NOT_FOUND',
        message: '指定された写真がリストに見つかりません',
        photoId: photo.id
      });
      return;
    }

    setCurrentIndex(index);
    clearError();
  }, [photo, photos, isOpen, handleError, clearError]);

  // 現在の写真を取得（エラーハンドリング付き）
  const currentPhoto = useMemo(() => {
    if (!photo) return null;
    
    if (photos.length === 0) return photo;
    
    if (currentIndex >= 0 && currentIndex < photos.length) {
      return photos[currentIndex];
    }
    
    // インデックスが範囲外の場合
    handleError({
      type: 'NAVIGATION_ERROR',
      message: 'ナビゲーションエラーが発生しました',
    });
    return photo;
  }, [photo, photos, currentIndex, handleError]);

  // 削除権限チェック（エラーハンドリング付き）
  const canDelete = useMemo(() => {
    if (!currentPhoto || !showDeleteButton) return false;
    
    try {
      const hasDeletePermission = canDeleteResource('photo.delete', {
        uploadedBy: currentPhoto.uploaded_by
      });
      
      const canManageCurrentAlbum = currentAlbum ? canManageAlbum(currentAlbum) : false;
      
      return hasDeletePermission || canManageCurrentAlbum;
    } catch (error) {
      console.error('[PhotoModal] 削除権限チェックエラー:', error);
      return false;
    }
  }, [currentPhoto, showDeleteButton, canDeleteResource, currentAlbum, canManageAlbum]);

  // ナビゲーション関数（エラーハンドリング付き）
  const goToPrevious = useCallback(() => {
    if (!showNavigation || photos.length <= 1) return;
    
    try {
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);
        const newPhoto = photos[newIndex];
        onPhotoChange?.(newPhoto);
        clearError();
      }
    } catch (error) {
      handleError({
        type: 'NAVIGATION_ERROR',
        message: '前の写真への移動に失敗しました',
      });
    }
  }, [showNavigation, photos.length, currentIndex, photos, onPhotoChange, handleError, clearError]);

  const goToNext = useCallback(() => {
    if (!showNavigation || photos.length <= 1) return;
    
    try {
      if (currentIndex < photos.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        const newPhoto = photos[newIndex];
        onPhotoChange?.(newPhoto);
        clearError();
      }
    } catch (error) {
      handleError({
        type: 'NAVIGATION_ERROR',
        message: '次の写真への移動に失敗しました',
      });
    }
  }, [showNavigation, photos.length, currentIndex, photos, onPhotoChange, handleError, clearError]);

  // 削除処理（エラーハンドリング強化）
  const handleDelete = useCallback(async () => {
    if (!canDelete || !currentPhoto) {
      handleError({
        type: 'PERMISSION_DENIED',
        message: 'この写真を削除する権限がありません',
        photoId: currentPhoto?.id
      });
      return;
    }

    setIsDeleting(true);

    try {
      await deletePhoto(currentPhoto.id);
      
      setShowDeleteModal(false);
      onPhotoDeleted?.(currentPhoto.id);
      
      // 写真リストが1枚のみの場合はモーダルを閉じる
      if (photos.length <= 1) {
        onClose();
      } else {
        // 次の写真に移動（最後の写真の場合は前の写真）
        if (currentIndex >= photos.length - 1) {
          setCurrentIndex(Math.max(0, photos.length - 2));
        }
      }
      
      clearError();
    } catch (error) {
      handleError({
        type: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : '写真の削除に失敗しました。もう一度お試しください。',
        photoId: currentPhoto.id
      });
    } finally {
      setIsDeleting(false);
    }
  }, [canDelete, currentPhoto, deletePhoto, onPhotoDeleted, photos.length, currentIndex, onClose, handleError, clearError]);

  // キーボードナビゲーション
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'Delete':
          if (canDelete) {
            event.preventDefault();
            setShowDeleteModal(true);
          }
          break;
        case 'c':
        case 'C':
          if (showComments) {
            event.preventDefault();
            setShowCommentsPanel(prev => !prev);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, canDelete, showComments]);

  // ユーティリティ関数
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '不明';
      }
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '不明';
    }
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  const getItemInfo = useCallback((): string => {
    if (!currentPhoto) return '';
    const parts = [];
    parts.push(currentPhoto.original_filename || currentPhoto.filename);
    if (currentPhoto.file_size) {
      parts.push(`(${formatFileSize(currentPhoto.file_size)})`);
    }
    return parts.join(' ');
  }, [currentPhoto, formatFileSize]);

  // メインレンダリング
  if (!photo || !currentPhoto) {
    return null;
  }

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        className={`w-full max-w-6xl ${className}`}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* エラー表示 */}
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm">{error.message}</span>
                <button
                  onClick={clearError}
                  className="ml-4 text-red-700 hover:text-red-900"
                  aria-label="エラーを閉じる"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 写真表示エリア */}
          <div className="relative flex-1 bg-black rounded-l-2xl">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.filename}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                handleError({
                  type: 'PHOTO_NOT_FOUND',
                  message: '写真の読み込みに失敗しました',
                  photoId: currentPhoto.id
                });
              }}
            />
            
            {/* ナビゲーションボタン */}
            {showNavigation && photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
                  aria-label="前の写真"
                >
                  <ChevronLeft size={24} className="text-gray-800" />
                </button>
                
                <button
                  onClick={goToNext}
                  disabled={currentIndex === photos.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
                  aria-label="次の写真"
                >
                  <ChevronRight size={24} className="text-gray-800" />
                </button>
              </>
            )}

            {/* 写真インデックス */}
            {showNavigation && photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </div>

          {/* 情報・コメントエリア */}
          <div className="w-full lg:w-96 bg-white rounded-r-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {currentPhoto.filename}
                </h3>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>{formatDate(currentPhoto.uploadedAt || currentPhoto.created_at)}</span>
                </div>
                {currentPhoto.uploader_name && (
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>{currentPhoto.uploader_name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2"
                    aria-label="いいね"
                  >
                    <Heart size={16} />
                    <span>いいね</span>
                  </Button>
                  
                  {showComments && (
                    <Button 
                      variant={showCommentsPanel ? 'primary' : 'outline'} 
                      size="sm" 
                      className="flex items-center space-x-2"
                      onClick={() => setShowCommentsPanel(!showCommentsPanel)}
                      aria-label={showCommentsPanel ? 'コメントを隠す' : 'コメントを表示'}
                    >
                      <MessageCircle size={16} />
                      <span>コメント</span>
                    </Button>
                  )}
                </div>
                
                {/* 削除ボタン */}
                {canDelete && showDeleteButton && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                    title="写真を削除"
                    aria-label="写真を削除"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {showComments && showCommentsPanel && (
              <div className="flex-1 overflow-hidden">
                <CommentSection photoId={currentPhoto.id} />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 削除確認ダイアログ */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="写真を削除"
        message="この写真を削除してもよろしいですか？"
        itemName={getItemInfo()}
        isDeleting={isDeleting}
      />
    </>
  );
};