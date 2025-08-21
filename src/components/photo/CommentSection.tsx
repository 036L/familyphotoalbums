// src/components/photo/CommentSection.tsx - Phase 2: エラー解決・永続化改善版
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, Heart, MoreHorizontal, Edit, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useComments } from '../../hooks/useComments';
import { useApp } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import { errorHelpers } from '../../utils/errors';
import type { Comment } from '../../types/core';

interface CommentSectionProps {
  photoId: string;
  onCommentsChange?: (comments: Comment[]) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ photoId, onCommentsChange }) => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
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
  
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Phase 2: useCommentsから全ての機能を取得
  const { 
    comments, 
    loading, 
    error: commentsError,
    addComment, 
    updateComment, 
    deleteComment,
    toggleLike,
    likesState = {},
    isLikingComment
  } = useComments(photoId);
  
  const { user, profile } = useApp();
  const { canDeleteResource, canEditResource } = usePermissions();

  // デバッグログ（開発時のみ）
  const debugLog = useCallback((message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[CommentSection] ${message}`, data);
    }
  }, []);

  // Phase 2: エラー処理の改善
  const handleError = useCallback((error: any, action: string, context?: any) => {
    debugLog(`エラー処理: ${action}`, { error, context });
    
    if (error instanceof Error) {
      // 特定のエラータイプに応じた処理
      if (error.message.includes('権限')) {
        errorHelpers.permissionDenied(`${action}する権限がありません`);
      } else if (error.message.includes('ネットワーク') || error.message.includes('接続')) {
        errorHelpers.networkError(`${action}中にネットワークエラーが発生しました`);
        // ネットワークエラーの場合はリトライオプションを提供
        setRetryingAction(action);
      } else {
        errorHelpers.operationFailed('save', `${action}に失敗しました: ${error.message}`);
      }
    } else {
      errorHelpers.operationFailed('save', `${action}に失敗しました`);
    }
  }, [debugLog]);

  // Phase 2: 永続化の改善 - ローカルストレージへの安全な保存
  const persistCommentState = useCallback((photoId: string, updates: any) => {
    try {
      const storageKey = `commentState_${photoId}`;
      const currentState = localStorage.getItem(storageKey);
      const parsedState = currentState ? JSON.parse(currentState) : {};
      
      const newState = {
        ...parsedState,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(newState));
      debugLog('コメント状態を永続化', { photoId, updates: Object.keys(updates) });
    } catch (error) {
      debugLog('永続化エラー', error);
      // 永続化の失敗は致命的ではないのでログのみ
    }
  }, [debugLog]);

  // Phase 2: ローカル状態からの復元
  const restoreCommentState = useCallback((photoId: string) => {
    try {
      const storageKey = `commentState_${photoId}`;
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        debugLog('コメント状態を復元', parsedState);
        
        // いいね状態の復元
        if (parsedState.likes) {
          setOptimisticUpdates(prev => ({
            ...prev,
            likes: parsedState.likes
          }));
        }
        
        return parsedState;
      }
    } catch (error) {
      debugLog('状態復元エラー', error);
    }
    return null;
  }, [debugLog]);

  // コメント変更時に親コンポーネントに通知
  useEffect(() => {
    if (onCommentsChange) {
      debugLog('コメント変更を親に通知', { commentCount: comments.length });
      onCommentsChange(comments);
    }
  }, [comments, onCommentsChange, debugLog]);

  // Phase 2: 権限チェック（自分のコメントのみ編集・削除可能）
  const canManageComment = useCallback((comment: Comment): boolean => {
    const currentUserId = user?.id || profile?.id;
    const isOwner = comment.user_id === currentUserId;
    const isAdmin = profile?.role === 'admin';
    
    debugLog('コメント管理権限チェック', {
      commentId: comment.id,
      currentUserId,
      commentUserId: comment.user_id,
      isOwner,
      isAdmin,
      canManage: isOwner || isAdmin
    });
    
    return isOwner || isAdmin;
  }, [user?.id, profile?.id, profile?.role, debugLog]);

  // Phase 2: リトライ機能付きコメント投稿処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentContent = newComment.trim();
    const tempId = `temp-${Date.now()}`;
    
    try {
      debugLog('コメント投稿開始', { content: commentContent, photoId });
      
      // 楽観的更新：即座にUIに反映
      const optimisticComment: Comment = {
        id: tempId,
        content: commentContent,
        photo_id: photoId,
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

      setNewComment(''); // 即座に入力をクリア
      
      // 実際の投稿処理
      const realComment = await addComment(commentContent, photoId);
      
      // 成功時：楽観的更新を実際のデータで置き換え
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== tempId)
      }));
      
      // 永続化
      persistCommentState(photoId, {
        lastComment: realComment,
        commentCount: comments.length + 1
      });
      
      // 新しいコメント投稿後の自動スクロール
      setTimeout(() => {
        if (commentsSectionRef.current) {
          commentsSectionRef.current.scrollTop = commentsSectionRef.current.scrollHeight;
          debugLog('コメント投稿後の自動スクロール実行');
        }
      }, 100);
      
      debugLog('コメント投稿成功', realComment);
    } catch (error) {
      // エラー時：楽観的更新をロールバック
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== tempId)
      }));
      
      setNewComment(commentContent); // 入力内容を復元
      handleError(error, 'コメント投稿', { content: commentContent });
    }
  };

  // Phase 2: リトライ機能付き編集開始
  const startEditing = useCallback((comment: Comment) => {
    if (!canManageComment(comment)) {
      debugLog('編集権限なし', comment.id);
      errorHelpers.permissionDenied('このコメントを編集する権限がありません');
      return;
    }
    
    setEditingComment({
      id: comment.id,
      content: comment.content
    });
    debugLog('編集開始', comment.id);
    
    // 編集フィールドにフォーカス
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.setSelectionRange(editInputRef.current.value.length, editInputRef.current.value.length);
      }
    }, 50);
  }, [canManageComment, debugLog]);

  // Phase 2: エラーハンドリング付き編集保存
  const saveEdit = async () => {
    if (!editingComment || !editingComment.content.trim()) return;
    
    const originalComment = comments.find(c => c.id === editingComment.id);
    if (!originalComment) return;

    try {
      debugLog('編集保存開始', editingComment);
      
      // 楽観的更新
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: prev.comments.map(c => 
          c.id === editingComment.id 
            ? { ...c, content: editingComment.content, updated_at: new Date().toISOString() }
            : c
        )
      }));
      
      await updateComment(editingComment.id, editingComment.content);
      
      // 永続化
      persistCommentState(photoId, {
        lastEdit: { commentId: editingComment.id, content: editingComment.content }
      });
      
      setEditingComment(null);
      debugLog('編集保存完了');
    } catch (error) {
      // エラー時：楽観的更新をロールバック
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: prev.comments.map(c => 
          c.id === editingComment.id ? originalComment : c
        )
      }));
      
      handleError(error, 'コメント編集', { commentId: editingComment.id });
    }
  };

  // 編集キャンセル
  const cancelEdit = useCallback(() => {
    setEditingComment(null);
    debugLog('編集キャンセル');
  }, [debugLog]);

  // Phase 2: エラーハンドリング付きコメント削除
  const handleDeleteComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment || !canManageComment(comment)) {
      debugLog('削除権限なし', commentId);
      errorHelpers.permissionDenied('このコメントを削除する権限がありません');
      return;
    }

    if (!window.confirm('このコメントを削除しますか？')) {
      return;
    }

    try {
      debugLog('コメント削除開始', commentId);
      
      // 楽観的更新：即座にUIから削除
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
      }));
      
      await deleteComment(commentId);
      
      // 永続化
      persistCommentState(photoId, {
        lastDelete: { commentId, timestamp: new Date().toISOString() }
      });
      
      debugLog('コメント削除完了');
    } catch (error) {
      // エラー時：楽観的更新をロールバック
      setOptimisticUpdates(prev => ({
        ...prev,
        comments: [...prev.comments, comment].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }));
      
      handleError(error, 'コメント削除', { commentId });
    }
  };

  // Phase 2: 実際のいいね状態を取得（楽観的更新を優先）
  const getEffectiveLikeState = useCallback((commentId: string) => {
    // 楽観的更新を優先し、次にuseCommentsのlikesState、最後にデフォルト値
    return optimisticUpdates.likes[commentId] || 
           likesState[commentId] || 
           { count: 0, isLiked: false };
  }, [optimisticUpdates.likes, likesState]);

  // Phase 2: 改善されたいいね機能のメイン処理
  const handleLike = useCallback(async (commentId: string) => {
    try {
      debugLog('いいね処理開始', { commentId, isLiking: isLikingComment === commentId });
      
      if (isLikingComment === commentId) {
        debugLog('既にいいね処理中', commentId);
        return; // 重複実行を防止
      }
  
      if (!toggleLike) {
        debugLog('toggleLike関数が利用できません');
        errorHelpers.operationFailed('save', 'いいね機能は現在利用できません');
        return;
      }
  
      // 現在の状態を取得（楽観的更新を考慮）
      const currentState = getEffectiveLikeState(commentId);
      const newIsLiked = !currentState.isLiked;
      const newCount = newIsLiked ? currentState.count + 1 : Math.max(0, currentState.count - 1);
  
      // 楽観的更新
      setOptimisticUpdates(prev => ({
        ...prev,
        likes: {
          ...prev.likes,
          [commentId]: { count: newCount, isLiked: newIsLiked }
        }
      }));
  
      debugLog('いいね楽観的更新', { commentId, newCount, newIsLiked });
  
      // useCommentsのtoggleLike関数を呼び出し
      await toggleLike(commentId);
      
      // 永続化（デモモード用）
      persistCommentState(photoId, {
        likes: {
          ...optimisticUpdates.likes,
          [commentId]: { count: newCount, isLiked: newIsLiked }
        }
      });
      
      debugLog('いいね処理完了', commentId);
    } catch (error) {
      // エラー時：楽観的更新をロールバック
      const originalState = getEffectiveLikeState(commentId);
      setOptimisticUpdates(prev => ({
        ...prev,
        likes: {
          ...prev.likes,
          [commentId]: originalState
        }
      }));
      
      handleError(error, 'いいね', { commentId });
    }
  }, [isLikingComment, toggleLike, getEffectiveLikeState, optimisticUpdates.likes, photoId, persistCommentState, debugLog, handleError]);

  // Phase 2: リトライ機能
  const retryAction = useCallback(async () => {
    if (!retryingAction) return;
    
    try {
      switch (retryingAction) {
        case 'コメント投稿':
          if (newComment.trim()) {
            await handleSubmit(new Event('submit') as any);
          }
          break;
        case 'コメント編集':
          if (editingComment) {
            await saveEdit();
          }
          break;
        default:
          debugLog('不明なリトライアクション', retryingAction);
      }
      setRetryingAction(null);
    } catch (error) {
      handleError(error, `${retryingAction}のリトライ`);
    }
  }, [retryingAction, newComment, editingComment, handleSubmit, saveEdit, debugLog]);

  // ESCキーでキャンセル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingComment) {
          cancelEdit();
        } else if (retryingAction) {
          setRetryingAction(null);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingComment, retryingAction, cancelEdit]);

  // 状態復元（初回のみ）
  useEffect(() => {
    if (photoId) {
      const restoredState = restoreCommentState(photoId);
      if (restoredState?.likes) {
        debugLog('いいね状態を復元', restoredState.likes);
      }
    }
  }, [photoId, restoreCommentState, debugLog]);

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
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
    } catch (error) {
      console.error('日付フォーマットエラー:', error);
      return '不明';
    }
  };

  // Phase 2: いいね数の表示フォーマット
  const formatLikeCount = (count: number): string => {
    if (count === 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${Math.floor(count / 100) / 10}k`;
    return `${Math.floor(count / 100000) / 10}M`;
  };


  // Phase 2: 実際のコメント一覧を取得（楽観的更新を優先）
  const getEffectiveComments = () => {
    const baseComments = comments || [];
    const optimisticComments = optimisticUpdates.comments || [];
    
    // 楽観的更新のコメントを追加
    return [...baseComments, ...optimisticComments];
  };

  const effectiveComments = getEffectiveComments();

  return (
    <div className="flex flex-col h-full">
      {/* エラー表示 */}
      {commentsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl mx-4 mt-4">
          <div className="flex items-start space-x-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{commentsError}</p>
              {retryingAction && (
                <button
                  onClick={retryAction}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  再試行
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* リトライ表示 */}
      {retryingAction && !commentsError && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl mx-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-yellow-500" />
              <span className="text-sm text-yellow-700">
                {retryingAction}に失敗しました
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={retryAction}
                className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
              >
                再試行
              </button>
              <button
                onClick={() => setRetryingAction(null)}
                className="text-xs text-yellow-600 hover:text-yellow-800"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* コメント一覧 */}
      <div 
        ref={commentsSectionRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-label="コメント一覧"
        aria-live="polite"
      >
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-2xl px-4 py-2">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : effectiveComments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <MoreHorizontal size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">まだコメントがありません</p>
            <p className="text-sm text-gray-400 mt-1">最初のコメントを投稿してみましょう</p>
          </div>
        ) : (
          effectiveComments.map((comment) => {
            // Phase 2: 楽観的更新を考慮したいいね状態の取得
            const likeState = getEffectiveLikeState(comment.id);
            const isTemporary = comment.id.startsWith('temp-');
            
            return (
              <div key={comment.id} className={`flex space-x-3 ${isTemporary ? 'opacity-70' : ''}`}>
                <img
                  src={comment.user_avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'}
                  alt={comment.user_name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-2xl px-4 py-3 relative group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {comment.user_name || '不明'}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatDate(comment.created_at)}
                        </span>
                        {isTemporary && (
                          <span className="text-xs text-orange-500 flex-shrink-0">
                            送信中...
                          </span>
                        )}
                      </div>
                      
                      {/* 編集・削除ボタン（権限チェック付き） */}
                      {!isTemporary && canManageComment(comment) && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(comment)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            title="編集"
                            aria-label="コメントを編集"
                          >
                            <Edit size={12} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors"
                            title="削除"
                            aria-label="コメントを削除"
                          >
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* 編集モード */}
                    {editingComment && editingComment.id === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          ref={editInputRef}
                          value={editingComment.content}
                          onChange={(e) => setEditingComment({
                            ...editingComment,
                            content: e.target.value
                          })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                          rows={2}
                          placeholder="コメントを編集..."
                          maxLength={500}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={saveEdit}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                              disabled={!editingComment.content.trim()}
                            >
                              <Check size={12} />
                              <span>保存</span>
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors"
                            >
                              <X size={12} />
                              <span>キャンセル</span>
                            </button>
                          </div>
                          <span className={`text-xs ${editingComment.content.length > 450 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                            {editingComment.content.length}/500
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-800 text-sm leading-relaxed break-words">
                        {comment.content}
                      </p>
                    )}
                  </div>
                  
                  {/* Phase 2: 改善されたいいねボタン */}
                  {!isTemporary && (
                  <div className="flex items-center space-x-4 mt-2 ml-4">
                    <button
                        onClick={() => handleLike(comment.id)}
                        className={`flex items-center space-x-1 text-xs transition-all duration-200 ${
                        getEffectiveLikeState(comment.id).isLiked 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-gray-500 hover:text-red-500'
                        }`}
                      disabled={isLikingComment === comment.id}
                      aria-label={getEffectiveLikeState(comment.id).isLiked ? 'いいねを取り消す' : 'いいね'}
                      title={getEffectiveLikeState(comment.id).isLiked ? 'いいねを取り消す' : 'いいね'}
                    >
                    <Heart 
                        size={14} 
                        fill={getEffectiveLikeState(comment.id).isLiked ? 'currentColor' : 'none'}
                        className={`transition-transform duration-200 ${
                          isLikingComment === comment.id 
                          ? 'scale-110 animate-pulse' 
                          : 'hover:scale-110'
                          }`}
                    />
                    <span className="font-medium">
                      {formatLikeCount(getEffectiveLikeState(comment.id).count)}
                    </span>
                  {/* ローディング中の視覚的フィードバック */}
                  {isLikingComment === comment.id && (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
                      )}
                    </button>
                    </div>
                    )}
                    </div>
                </div>
            );
          })
        )}
      </div>

      {/* コメント入力エリア */}
      <div className="border-t border-gray-100 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="コメントを入力..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  // 日本語入力中（IME使用中）は無視
                  if (e.nativeEvent.isComposing || e.keyCode === 229) {
                    return;
                  }
                  
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                maxLength={500}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 transition-colors"
                title="音声入力（準備中）"
                disabled
              >
                <Mic size={16} />
              </button>
            </div>
            <Button
              type="submit"
              size="sm"
              className="px-4 py-3 rounded-xl self-end"
              disabled={!newComment.trim() || loading}
              aria-label="コメントを投稿"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
          
          {/* ヒント */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Enterで投稿、Shift+Enterで改行</span>
            <span className={newComment.length > 450 ? 'text-orange-500 font-medium' : ''}>
              {newComment.length}/500
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};