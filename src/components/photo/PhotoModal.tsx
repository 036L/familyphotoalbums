// src/components/photo/PhotoModal.tsx - コメント自動表示修正版
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Calendar, User, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { CommentSection } from './CommentSection';
import { PhotoDeleteButton } from './PhotoDeleteButton';
import { useApp } from '../../context/AppContext';
import { useComments } from '../../hooks/useComments';
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
  const [error, setError] = useState<string | null>(null);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

  const { currentAlbum } = useApp();

  // デバッグログ（最初に宣言）
  const debugLog = useCallback((message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[PhotoModal] ${message}`, data);
    }
  }, []);

  // 現在の写真を取得（photoとcurrentIndexの両方に依存）
  const currentPhoto = useMemo(() => {
    if (!photo) return null;
    
    if (photos.length === 0) return photo;
    
    if (currentIndex >= 0 && currentIndex < photos.length) {
      return photos[currentIndex];
    }
    
    return photo;
  }, [photo, photos, currentIndex]);

  // 現在の写真のコメントを直接取得
  const { comments, loading: commentsLoading } = useComments(currentPhoto?.id);

  // photoの変更を監視してインデックスを更新
  useEffect(() => {
    if (!photo || photos.length === 0) {
      setCurrentIndex(0);
      return;
    }

    const index = photos.findIndex(p => p.id === photo.id);
    if (index !== -1) {
      setCurrentIndex(index);
      debugLog('写真インデックス更新:', { photoId: photo.id, index });
    } else {
      debugLog('写真がリストに見つからない:', photo.id);
    }
  }, [photo, photos, debugLog]);

  // コメント自動表示ロジック：コメントが存在する場合は自動でパネルを表示
  useEffect(() => {
    if (isOpen && currentPhoto && comments.length > 0 && !commentsLoading) {
      debugLog('コメントが存在するため自動表示', { 
        photoId: currentPhoto.id,
        commentCount: comments.length 
      });
      setShowCommentsPanel(true);
    }
  }, [isOpen, currentPhoto?.id, comments.length, commentsLoading, debugLog]);

  // エラーハンドリング
  const handleError = useCallback((errorMessage: string) => {
    debugLog('エラー発生:', errorMessage);
    setError(errorMessage);
    
    // 3秒後にエラーをクリア
    setTimeout(() => setError(null), 3000);
  }, [debugLog]);

  // ナビゲーション関数
  const goToPrevious = useCallback(() => {
    if (!showNavigation || photos.length <= 1) return;
    
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const newPhoto = photos[newIndex];
      setCurrentIndex(newIndex);
      onPhotoChange?.(newPhoto);
      debugLog('前の写真へ移動:', { newIndex, photoId: newPhoto.id });
    }
  }, [showNavigation, photos, currentIndex, onPhotoChange, debugLog]);

  const goToNext = useCallback(() => {
    if (!showNavigation || photos.length <= 1) return;
    
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      const newPhoto = photos[newIndex];
      setCurrentIndex(newIndex);
      onPhotoChange?.(newPhoto);
      debugLog('次の写真へ移動:', { newIndex, photoId: newPhoto.id });
    }
  }, [showNavigation, photos, currentIndex, onPhotoChange, debugLog]);

  // モーダルを閉じる処理
  const handleClose = useCallback(() => {
    debugLog('モーダルを閉じる');
    setShowCommentsPanel(false);
    setError(null);
    onClose();
  }, [onClose, debugLog]);

  // 写真削除後の処理
  const handlePhotoDeleted = useCallback((photoId: string) => {
    debugLog('写真削除後の処理:', photoId);
    onPhotoDeleted?.(photoId);
    
    // 写真リストが1枚のみの場合はモーダルを閉じる
    if (photos.length <= 1) {
      handleClose();
    } else {
      // 次の写真に移動（最後の写真の場合は前の写真）
      if (currentIndex >= photos.length - 1) {
        const newIndex = Math.max(0, photos.length - 2);
        const newPhoto = photos[newIndex];
        setCurrentIndex(newIndex);
        onPhotoChange?.(newPhoto);
      }
    }
  }, [photos, currentIndex, onPhotoDeleted, onPhotoChange, handleClose, debugLog]);

  // キーボードナビゲーション（入力中は無効化）
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 入力要素にフォーカスがある場合はキーボードショートカットを無効化
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      if (isInputFocused) {
        // 入力中はESCキーのみ有効
        if (event.key === 'Escape') {
          event.preventDefault();
          handleClose();
        }
        return;
      }

      debugLog('キー押下:', event.key);
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'Escape':
          event.preventDefault();
          handleClose();
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
  }, [isOpen, goToPrevious, goToNext, handleClose, showComments, debugLog]);

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

  // コメントボタンの表示（コメント数を正確に反映）
  const renderCommentButton = useCallback(() => {
    if (!showComments) return null;

    const commentText = comments.length > 0 
      ? `コメント（${comments.length > 99 ? '99+' : comments.length}）`
      : 'コメント';

    return (
      <Button 
        variant={showCommentsPanel ? 'primary' : 'outline'} 
        size="sm" 
        className="flex items-center space-x-2 focus-ring"
        onClick={() => setShowCommentsPanel(!showCommentsPanel)}
        aria-label={showCommentsPanel ? 'コメントを隠す' : 'コメントを表示'}
        disabled={commentsLoading}
      >
        <MessageCircle size={16} />
        <span>{commentsLoading ? '読み込み中...' : commentText}</span>
      </Button>
    );
  }, [showComments, showCommentsPanel, comments.length, commentsLoading]);

  // メインレンダリング
  if (!isOpen || !currentPhoto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* モーダルコンテンツ */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden ${className}`}
        role="dialog"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onClick={(e) => e.stopPropagation()} // バブリングを停止
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
          aria-label="モーダルを閉じる"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* エラー表示 */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-700 hover:text-red-900"
                aria-label="エラーを閉じる"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* 写真表示エリア */}
          <div className="relative flex-1 bg-black rounded-l-2xl min-h-[400px] lg:min-h-[600px]">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.original_filename || currentPhoto.filename}
              className="w-full h-full object-contain"
              onError={() => {
                handleError('写真の読み込みに失敗しました');
              }}
            />
            
            {/* ナビゲーションボタン */}
            {showNavigation && photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
                  aria-label="前の写真"
                >
                  <ChevronLeft size={24} className="text-gray-800" />
                </button>
                
                <button
                  onClick={goToNext}
                  disabled={currentIndex === photos.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
                  aria-label="次の写真"
                >
                  <ChevronRight size={24} className="text-gray-800" />
                </button>
              </>
            )}

            {/* 写真インデックス */}
            {showNavigation && photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {photos.length}
              </div>
            )}
          </div>

          {/* 情報・コメントエリア */}
          <div className="w-full lg:w-96 bg-white rounded-r-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {currentPhoto.original_filename || currentPhoto.filename}
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
                    className="flex items-center space-x-2 focus-ring"
                    aria-label="いいね"
                  >
                    <Heart size={16} />
                    <span>いいね</span>
                  </Button>
                  
                  {/* 修正版：改善されたコメントボタン */}
                  {renderCommentButton()}
                </div>
                
                {/* 削除ボタン */}
                {showDeleteButton && (
                  <PhotoDeleteButton
                    photo={currentPhoto}
                    variant="icon"
                    onDeleted={() => handlePhotoDeleted(currentPhoto.id)}
                  />
                )}
              </div>
            </div>

            {/* コメントセクション（自動表示または手動表示） */}
            {showComments && showCommentsPanel && (
              <div className="flex-1 overflow-hidden">
                <CommentSection 
                  photoId={currentPhoto.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};