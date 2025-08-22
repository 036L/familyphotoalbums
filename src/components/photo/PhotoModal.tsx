// src/components/photo/PhotoModal.tsx - 修正版（写真いいね永続化対応）
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Calendar, User, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { CommentSection } from './CommentSection';
import { PhotoDeleteButton } from './PhotoDeleteButton';
import { useApp } from '../../context/AppContext';
import { useComments } from '../../hooks/useComments';
import { useEnvironment } from '../../hooks/useEnvironment';
import type { Photo, Comment } from '../../types/core';

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

// 写真いいね状態の型定義
interface PhotoLikeState {
  count: number;
  isLiked: boolean;
  timestamp?: string; // 永続化のタイムスタンプ
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
  
  // 写真いいね機能の状態
  const [photoLikes, setPhotoLikes] = useState<Record<string, PhotoLikeState>>({});
  const [isLikingPhoto, setIsLikingPhoto] = useState<string | null>(null);

  const { currentAlbum } = useApp();
  const { isDemo } = useEnvironment();

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

  // 現在の写真のコメントを直接取得（自動表示判定のため）
  const { comments, loading: commentsLoading } = useComments(currentPhoto?.id);

  const initializePhotoLikes = useCallback((photo: Photo) => {
    if (!photo || photoLikes[photo.id]) {
      return; // 既に初期化済みならスキップ
    }
  
    debugLog('写真いいね状態初期化', { photoId: photo.id });
  
    if (isDemo) {
      try {
        const savedLikes = localStorage.getItem(`photoLikes_${photo.id}`);
        if (savedLikes) {
          const likeState = JSON.parse(savedLikes);
          setPhotoLikes(prev => ({
            ...prev,
            [photo.id]: {
              count: likeState.count || 0,
              isLiked: likeState.isLiked || false
            }
          }));
          return;
        }
      } catch (error) {
        debugLog('いいね状態読み込みエラー', error);
      }
  
      // デフォルト値
      const defaultState = { 
        count: Math.floor(Math.random() * 20), 
        isLiked: false 
      };
      
      setPhotoLikes(prev => ({
        ...prev,
        [photo.id]: defaultState
      }));
  
      // localStorage に保存
      try {
        localStorage.setItem(`photoLikes_${photo.id}`, JSON.stringify(defaultState));
      } catch (error) {
        debugLog('デフォルト状態保存エラー', error);
      }
    } else {
      setPhotoLikes(prev => ({
        ...prev,
        [photo.id]: { count: 0, isLiked: false }
      }));
    }
  }, [isDemo, photoLikes, debugLog]);

  // 写真いいね機能（永続化確実実行版）
  const togglePhotoLike = useCallback(async (photoId: string) => {
    if (isLikingPhoto === photoId) return;
  
    debugLog('いいね処理開始', { photoId });
    setIsLikingPhoto(photoId);
  
    try {
      const currentState = photoLikes[photoId] || { count: 0, isLiked: false };
      const newIsLiked = !currentState.isLiked;
      const newCount = newIsLiked ? currentState.count + 1 : Math.max(0, currentState.count - 1);
  
      const newState = { count: newCount, isLiked: newIsLiked };
  
      // 状態更新
      setPhotoLikes(prev => ({
        ...prev,
        [photoId]: newState
      }));
  
      // localStorage保存（デモモード）
      if (isDemo) {
        localStorage.setItem(`photoLikes_${photoId}`, JSON.stringify(newState));
      }
  
      debugLog('いいね処理完了', { photoId, newState });
    } catch (error) {
      debugLog('いいね処理エラー', error);
      setError('いいねの処理に失敗しました');
    } finally {
      setIsLikingPhoto(null);
    }
  }, [photoLikes, isLikingPhoto, isDemo, debugLog]);

  useEffect(() => {
    if (isOpen && currentPhoto) {
      initializePhotoLikes(currentPhoto);
    }
  }, [isOpen, currentPhoto?.id, initializePhotoLikes]);

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
    // いいね状態は保持（改善点）
    // コメントパネルの状態はリセットしない（改善点）
    setError(null);
    onClose();
  }, [onClose, debugLog]);

  // 写真削除後の処理
  const handlePhotoDeleted = useCallback((photoId: string) => {
    debugLog('写真削除後の処理:', photoId);
    
    // 削除された写真のいいね状態をクリーンアップ
    setPhotoLikes(prev => {
      const newState = { ...prev };
      delete newState[photoId];
      return newState;
    });
    
    // デモモードの場合はlocalStorageからも削除
    if (isDemo) {
      try {
        localStorage.removeItem(`photoLikes_${photoId}`);
        debugLog('削除された写真のいいね状態をクリーンアップ', photoId);
      } catch (error) {
        debugLog('いいね状態クリーンアップエラー', error);
      }
    }
    
    onPhotoDeleted?.(photoId);
    
    // 既存の削除後処理...
  }, [photos, currentIndex, onPhotoDeleted, onPhotoChange, handleClose, isDemo, debugLog]);

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

  // 写真いいねボタンのレンダリング（永続化対応改善版）
  const renderPhotoLikeButton = useCallback(() => {
    if (!currentPhoto) return null;
  
    const likeState = photoLikes[currentPhoto.id] || { count: 0, isLiked: false };
    const isLoading = isLikingPhoto === currentPhoto.id;
  
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={`flex items-center space-x-2 transition-all duration-200 ${
          likeState.isLiked 
            ? 'text-red-500 border-red-300 bg-red-50 hover:bg-red-100' 
            : 'text-gray-500 hover:text-red-500 hover:border-red-300'
        }`}
        onClick={() => togglePhotoLike(currentPhoto.id)}
        disabled={isLoading}
        aria-label={likeState.isLiked ? 'いいねを取り消す' : 'いいね'}
      >
        <Heart 
          size={16} 
          fill={likeState.isLiked ? 'currentColor' : 'none'}
          className={`transition-transform duration-200 ${
            isLoading ? 'scale-110 animate-pulse' : 'hover:scale-110'
          }`}
        />
        <span className="font-medium">
          {likeState.count > 999 ? '999+' : likeState.count}
        </span>
        {isLoading && (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        )}
      </Button>
    );
  }, [currentPhoto, photoLikes, isLikingPhoto, togglePhotoLike]);

  // 改善されたコメントボタン - コメント数を正確に反映し、バッジ表示
  const renderCommentButton = useCallback(() => {
    if (!showComments) return null;
  
    return (
      <Button 
        variant={showCommentsPanel ? 'primary' : 'outline'} 
        size="sm" 
        className="flex items-center space-x-2 relative focus-ring"
        onClick={() => setShowCommentsPanel(!showCommentsPanel)}
        aria-label={showCommentsPanel ? 'コメントを隠す' : 'コメントを表示'}
        disabled={commentsLoading}
      >
        <MessageCircle size={16} />
        <span>
          {commentsLoading ? '読み込み中...' : 'コメント'}
        </span>
        {/* コメント数バッジ - 0より大きい場合のみ表示 */}
        {!commentsLoading && comments.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1">
            {comments.length > 99 ? '99+' : comments.length}
          </span>
        )}
      </Button>
    );
  }, [showComments, showCommentsPanel, comments.length, commentsLoading]);

  // コメント変更通知のハンドラー（CommentSectionから呼び出される）
  const handleCommentsChange = useCallback((updatedComments: Comment[]) => {
    debugLog('コメント数変更通知:', { 
      photoId: currentPhoto?.id,
      commentCount: updatedComments.length 
    });
    
    // コメントがある場合で、パネルが閉じている場合は自動で開く
    if (updatedComments.length > 0 && !showCommentsPanel) {
      debugLog('新しいコメントによりパネルを自動表示');
      setShowCommentsPanel(true);
    }
  }, [currentPhoto?.id, showCommentsPanel, debugLog]);

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
                  {/* 改善された写真いいねボタン */}
                  {renderPhotoLikeButton()}
                  
                  {/* 改善されたコメントボタン */}
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
                  onCommentsChange={handleCommentsChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};