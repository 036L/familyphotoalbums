// src/components/photo/PhotoModal.tsx - Hooksルール違反修正版
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Calendar, User, X, Send, Mic } from 'lucide-react';
import { Button } from '../ui/Button';
import { CommentSection } from './CommentSection';
import { PhotoDeleteButton } from './PhotoDeleteButton';
import { useApp } from '../../context/AppContext';
import { useComments } from '../../hooks/useComments';
import { usePermissions } from '../../hooks/usePermissions';
import { useNewCommentBadge } from '../../hooks/ui/useNewCommentBadge';
import { errorHelpers } from '../../utils/errors';
import type { Photo, Comment } from '../../types/core';
import { supabase } from '../../lib/supabase';

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
  timestamp?: string;
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
  // 基本状態
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // 写真いいね機能の状態
  const [photoLikes, setPhotoLikes] = useState<Record<string, PhotoLikeState>>({});
  const [isLikingPhoto, setIsLikingPhoto] = useState<string | null>(null);

  // コメント関連の状態管理（統合）
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [retryingAction, setRetryingAction] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<{
    likes: Record<string, { count: number; isLiked: boolean }>;
    comments: Comment[];
  }>({ likes: {}, comments: [] });

  const { currentAlbum } = useApp();
  const { user, profile } = useApp();
  const { canDeleteResource, canEditResource } = usePermissions();

  // 現在の写真を取得
  const currentPhoto = useMemo(() => {
    if (!photo) return null;
    if (photos.length === 0) return photo;
    if (currentIndex >= 0 && currentIndex < photos.length) {
      return photos[currentIndex];
    }
    return photo;
  }, [photo, photos, currentIndex]);

  // ★ 新着コメントバッジフック - コンポーネントのトップレベルで宣言
  const { markAsSeen } = useNewCommentBadge({
    targetId: currentPhoto?.id || '', // 必ず文字列を渡す
    targetType: 'photo',
    enabled: !!(isOpen && currentPhoto) // 条件はenabledパラメータで制御
  });

  // useCommentsから全ての機能を取得
  const { 
    comments, 
    loading: commentsLoading, 
    error: commentsError,
    addComment, 
    updateComment, 
    deleteComment,
    toggleLike,
    likesState = {},
    isLikingComment
  } = useComments(currentPhoto?.id);

  // デバッグログ
  const debugLog = useCallback((message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[PhotoModal] ${message}`, data);
    }
  }, []);

  // ===== 写真いいね関連の処理 =====
  const initializePhotoLikes = useCallback((photo: Photo) => {
    if (!photo) return;
    debugLog('写真いいね状態初期化', { photoId: photo.id });
  
    setPhotoLikes(prev => ({
      ...prev,
      [photo.id]: { count: 0, isLiked: false }
    }));
  }, [debugLog]);

  const fetchPhotoLikes = useCallback(async (photoId: string) => {
    if (!photoId) return;

    try {
      debugLog('写真いいね数取得開始', { photoId });

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data: likeCounts, error: countError } = await supabase
        .from('photo_likes')
        .select('user_id')
        .eq('photo_id', photoId);

      if (countError) throw countError;

      const isLiked = currentUser ? likeCounts?.some((like: any) => like.user_id === currentUser.id) || false : false;
      const count = likeCounts?.length || 0;

      const likeState = { count, isLiked };
      
      setPhotoLikes(prev => ({
        ...prev,
        [photoId]: likeState
      }));

      debugLog('写真いいね数取得完了', { photoId, likeState });
    } catch (error) {
      debugLog('写真いいね数取得エラー', error);
      console.error('写真いいね数取得エラー:', error);
    }
  }, [debugLog]);

  const togglePhotoLike = useCallback(async (photoId: string) => {
    try {
      debugLog('写真いいね処理開始', { photoId });
      
      if (isLikingPhoto === photoId) return;
      setIsLikingPhoto(photoId);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }

      const { data: existingLike, error: checkError } = await supabase
        .from('photo_likes')
        .select()
        .eq('photo_id', photoId)
        .eq('user_id', currentUser.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        const { error: deleteError } = await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', currentUser.id);

        if (deleteError) throw deleteError;
        debugLog('写真いいね削除完了', photoId);
      } else {
        const { error: insertError } = await supabase
          .from('photo_likes')
          .insert({ photo_id: photoId, user_id: currentUser.id });

        if (insertError) throw insertError;
        debugLog('写真いいね追加完了', photoId);
      }

      await fetchPhotoLikes(photoId);

    } catch (error) {
      debugLog('写真いいね処理エラー', error);
      console.error('写真いいね処理エラー:', error);
      setError('いいねの処理に失敗しました');
    } finally {
      setIsLikingPhoto(null);
    }
  }, [photoLikes, isLikingPhoto, fetchPhotoLikes, debugLog]);

  // ===== コメント関連の処理 =====
  const persistCommentState = useCallback((photoId: string, updates: any) => {
    return;
  }, []);

  const canManageComment = useCallback((comment: Comment): boolean => {
    const currentUserId = user?.id || profile?.id;
    const isOwner = comment.user_id === currentUserId;
    const isAdmin = profile?.role === 'admin';
    return isOwner || isAdmin;
  }, [user?.id, profile?.id, profile?.role]);

  const getEffectiveLikeState = useCallback((commentId: string) => {
    if (optimisticUpdates.likes[commentId]) {
      return optimisticUpdates.likes[commentId];
    }
    if (likesState && likesState[commentId]) {
      return likesState[commentId];
    }
    const comment = comments.find(c => c.id === commentId);
    return {
      count: comment?.likes_count || 0,
      isLiked: comment?.is_liked || false
    };
  }, [optimisticUpdates.likes, likesState, comments]);

  const getEffectiveComments = useCallback(() => {
    const baseComments = comments || [];
    const optimisticComments = optimisticUpdates.comments || [];
    const allComments = [...baseComments, ...optimisticComments];
    return allComments.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [comments, optimisticUpdates.comments]);

  const formatLikeCount = (count: number): string => {
    if (count === 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${Math.floor(count / 100) / 10}k`;
    return `${Math.floor(count / 100000) / 10}M`;
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentPhoto) return;

    const commentContent = newComment.trim();
    const tempId = `temp-${Date.now()}`;
    
    try {
      const optimisticComment: Comment = {
        id: tempId,
        content: commentContent,
        photo_id: currentPhoto.id,
        user_id: user?.id || profile?.id || 'unknown',
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_name: profile?.name || user?.user_metadata?.name || 'ユーザー',
        user_avatar: profile?.avatar_url || null,
        likes_count: 0,
        is_liked: false,
      };

      setOptimisticUpdates(prev => ({
        ...prev,
        comments: [...prev.comments, optimisticComment]
      }));

      setNewComment('');
      
      const realComment = await addComment(commentContent, currentPhoto.id);
      
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== tempId)
      }));
      
      persistCommentState(currentPhoto.id, {
        lastComment: realComment,
        commentCount: comments.length + 1
      });
      
    } catch (error) {
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== tempId)
      }));
      setNewComment(commentContent);
      handleError('コメント投稿に失敗しました');
    }
  };

  const startEditing = useCallback((comment: Comment) => {
    if (!canManageComment(comment)) {
      handleError('このコメントを編集する権限がありません');
      return;
    }
    setEditingComment({
      id: comment.id,
      content: comment.content
    });
  }, [canManageComment]);

  const saveEdit = async () => {
    if (!editingComment || !editingComment.content.trim()) return;
    
    const originalComment = comments.find(c => c.id === editingComment.id);
    if (!originalComment) return;

    if (editingComment.content.trim() === originalComment.content.trim()) {
      setEditingComment(null);
      return;
    }

    try {
      const updatedContent = editingComment.content.trim();
      setEditingComment(null);
      await updateComment(editingComment.id, updatedContent);
    } catch (error) {
      setEditingComment({
        id: editingComment.id,
        content: editingComment.content
      });
      handleError('コメント編集に失敗しました');
    }
  };

  const cancelEdit = useCallback(() => {
    setEditingComment(null);
  }, []);

  const handleDeleteComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment || !canManageComment(comment)) {
      handleError('このコメントを削除する権限がありません');
      return;
    }

    const confirmMessage = `以下のコメントを削除してもよろしいですか？\n\n「${comment.content.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content}」\n\nこの操作は取り消せません。`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
      }));
      
      await deleteComment(commentId);
      
    } catch (error) {
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: [...prev.comments, comment].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }));
      handleError('コメント削除に失敗しました');
    }
  };

  const handleCommentLike = useCallback(async (commentId: string) => {
    if (isLikingComment === commentId || !toggleLike) return;

    try {
      const currentState = getEffectiveLikeState(commentId);
      const newIsLiked = !currentState.isLiked;
      const newCount = newIsLiked ? currentState.count + 1 : Math.max(0, currentState.count - 1);

      setOptimisticUpdates(prev => ({
        ...prev,
        likes: {
          ...prev.likes,
          [commentId]: { count: newCount, isLiked: newIsLiked }
        }
      }));

      await toggleLike(commentId);
      
    } catch (error) {
      const originalState = getEffectiveLikeState(commentId);
      setOptimisticUpdates(prev => ({
        ...prev,
        likes: {
          ...prev.likes,
          [commentId]: originalState
        }
      }));
      handleError('いいね処理に失敗しました');
    }
  }, [isLikingComment, toggleLike, getEffectiveLikeState]);

  const retryAction = useCallback(() => {
    setRetryingAction(null);
  }, []);

  const clearRetry = useCallback(() => {
    setRetryingAction(null);
  }, []);

  // ===== その他の処理 =====
  const handleError = useCallback((errorMessage: string) => {
    debugLog('エラー発生:', errorMessage);
    setError(errorMessage);
    setTimeout(() => setError(null), 3000);
  }, [debugLog]);

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

  const handleClose = useCallback(() => {
    debugLog('モーダルを閉じる');
    setError(null);
    onClose();
  }, [onClose, debugLog]);

  const handlePhotoDeleted = useCallback((photoId: string) => {
    debugLog('写真削除後の処理:', photoId);
    
    setPhotoLikes(prev => {
      const newState = { ...prev };
      delete newState[photoId];
      return newState;
    });
    
    onPhotoDeleted?.(photoId);
  }, [onPhotoDeleted, debugLog]);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '不明';
      }
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours < 1) {
        return 'たった今';
      } else if (hours < 24) {
        return `${hours}時間前`;
      } else {
        return date.toLocaleDateString('ja-JP', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return '不明';
    }
  }, []);

  // ===== Effects =====
  useEffect(() => {
    if (currentPhoto && isOpen) {
      debugLog('現在の写真変更による初期化', { photoId: currentPhoto.id });
      fetchPhotoLikes(currentPhoto.id);
    }
  }, [currentPhoto?.id, isOpen, fetchPhotoLikes, debugLog]);

  // ★ モーダル開閉時の既読マーク - 修正版（Hooksルール準拠）
  useEffect(() => {
    if (!isOpen || !currentPhoto || !markAsSeen) {
      return; // 早期リターン（クリーンアップ不要）
    }
    
    // モーダルを開いた時に既読マークを実行
    const timer = setTimeout(() => {
      debugLog('既読マーク実行', { photoId: currentPhoto.id });
      markAsSeen();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isOpen, currentPhoto?.id, markAsSeen, debugLog]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      if (isInputFocused) {
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, handleClose, debugLog]);

  // ===== レンダリング用ヘルパー =====
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

  const effectiveComments = getEffectiveComments();

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
      
      {/* モーダルコンテンツ - SNSスタイル */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden ${className}`}
        role="dialog"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onClick={(e) => e.stopPropagation()}
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

        {/* メインコンテンツ: 写真+コメント統一スクロールエリア */}
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* 統一スクロールエリア（写真 + コメント一覧） */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {/* 写真エリア */}
            <div className="relative bg-black aspect-square">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.original_filename || currentPhoto.filename}
                className="w-full h-full object-contain"
                onError={() => {
                  handleError('写真の読み込みに失敗しました');
                }}
              />
              
              {/* ナビゲーションボタン（写真エリア内） */}
              {showNavigation && photos.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
                    aria-label="前の写真"
                  >
                    <ChevronLeft size={20} className="text-gray-800" />
                  </button>
                  
                  <button
                    onClick={goToNext}
                    disabled={currentIndex === photos.length - 1}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
                    aria-label="次の写真"
                  >
                    <ChevronRight size={20} className="text-gray-800" />
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

            {/* 写真情報エリア */}
            <div className="bg-white p-4 border-b border-gray-100">
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

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-3">
                  {renderPhotoLikeButton()}
                  <div className="flex items-center space-x-1 text-gray-500">
                    <MessageCircle size={16} />
                    <span className="text-sm">
                      {commentsLoading 
                        ? '読み込み中...' 
                        : `コメント（${effectiveComments.length}）`
                      }
                    </span>
                  </div>
                </div>
                
                {showDeleteButton && (
                  <PhotoDeleteButton
                    photo={currentPhoto}
                    variant="icon"
                    onDeleted={() => handlePhotoDeleted(currentPhoto.id)}
                  />
                )}
              </div>
            </div>

            {/* コメント一覧エリア（スクロール内） */}
            {showComments && (
              <CommentSection 
                comments={effectiveComments}
                loading={commentsLoading}
                error={commentsError}
                editingComment={editingComment}
                newComment={newComment}
                onSubmit={handleCommentSubmit}
                onCommentChange={setNewComment}
                onStartEdit={startEditing}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onDeleteComment={handleDeleteComment}
                onLike={handleCommentLike}
                onEditingCommentChange={(content) => setEditingComment(prev => prev ? {...prev, content} : null)}
                isLikingComment={isLikingComment}
                retryingAction={retryingAction}
                onRetry={retryAction}
                onClearRetry={clearRetry}
                canManageComment={canManageComment}
                formatDate={formatDate}
                formatLikeCount={formatLikeCount}
                getEffectiveLikeState={getEffectiveLikeState}
                showInput={false}
              />
            )}
          </div>

          {/* コメント入力エリア - 完全固定（下部） */}
          {showComments && (
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3">
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <div className="flex space-x-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="コメントを入力..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none text-sm"
                      rows={1}
                      style={{ minHeight: '40px', maxHeight: '80px' }}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(e);
                        }
                      }}
                      maxLength={500}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400"
                      disabled
                    >
                      <Mic size={14} />
                    </button>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-xl flex-shrink-0"
                    style={{ minHeight: '40px', minWidth: '40px', padding: '0 12px' }}
                    disabled={!newComment.trim() || commentsLoading}
                  >
                    {commentsLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Enterで投稿</span>
                  <span className={newComment.length > 450 ? 'text-orange-500 font-medium' : ''}>
                    {newComment.length}/500
                  </span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};