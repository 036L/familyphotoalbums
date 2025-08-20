// src/components/photo/CommentSection.tsx - Phase 2: 完全版
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, Heart, MoreHorizontal, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useComments } from '../../hooks/useComments';
import { useApp } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
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
  
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Phase 2: 拡張されたuseCommentsを使用（いいね機能付き）
  const { 
    comments, 
    loading, 
    addComment, 
    updateComment, 
    deleteComment,
    toggleLike = () => Promise.resolve(), // デフォルト値を提供
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
    return comment.user_id === currentUserId || profile?.role === 'admin';
  }, [user?.id, profile?.id, profile?.role]);

  // コメント投稿処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      debugLog('コメント投稿開始', { content: newComment, photoId });
      await addComment(newComment, photoId);
      setNewComment('');
      
      // 新しいコメント投稿後の自動スクロール
      setTimeout(() => {
        if (commentsSectionRef.current) {
          commentsSectionRef.current.scrollTop = commentsSectionRef.current.scrollHeight;
          debugLog('コメント投稿後の自動スクロール実行');
        }
      }, 100);
    } catch (error) {
      debugLog('コメント投稿エラー', error);
      console.error('コメント投稿エラー:', error);
      alert('コメントの投稿に失敗しました。もう一度お試しください。');
    }
  };

  // 編集開始
  const startEditing = useCallback((comment: Comment) => {
    if (!canManageComment(comment)) {
      debugLog('編集権限なし', comment.id);
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

  // 編集保存
  const saveEdit = async () => {
    if (!editingComment || !editingComment.content.trim()) return;
    
    try {
      debugLog('編集保存開始', editingComment);
      await updateComment(editingComment.id, editingComment.content);
      setEditingComment(null);
      debugLog('編集保存完了');
    } catch (error) {
      debugLog('編集保存エラー', error);
      console.error('編集に失敗:', error);
      alert('コメントの編集に失敗しました。もう一度お試しください。');
    }
  };

  // 編集キャンセル
  const cancelEdit = useCallback(() => {
    setEditingComment(null);
    debugLog('編集キャンセル');
  }, [debugLog]);

  // コメント削除
  const handleDeleteComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment || !canManageComment(comment)) {
      debugLog('削除権限なし', commentId);
      return;
    }

    if (window.confirm('このコメントを削除しますか？')) {
      try {
        debugLog('コメント削除開始', commentId);
        await deleteComment(commentId);
        debugLog('コメント削除完了');
      } catch (error) {
        debugLog('コメント削除エラー', error);
        console.error('コメント削除エラー:', error);
        alert('コメントの削除に失敗しました。もう一度お試しください。');
      }
    }
  };

  // Phase 2: いいね機能のメイン処理
  const handleLike = async (commentId: string) => {
    try {
      debugLog('いいね処理開始', { commentId, isLiking: isLikingComment === commentId });
      
      if (isLikingComment === commentId) {
        debugLog('既にいいね処理中', commentId);
        return; // 重複実行を防止
      }

      // toggleLike関数が存在するかチェック
      if (typeof toggleLike === 'function') {
        await toggleLike(commentId);
        debugLog('いいね処理完了', commentId);
      } else {
        debugLog('toggleLike関数が利用できません');
        console.warn('いいね機能は現在利用できません');
      }
    } catch (error) {
      debugLog('いいね処理エラー', error);
      console.error('いいね処理エラー:', error);
      // エラーの詳細をログに出力
      if (error instanceof Error) {
        console.error('エラー詳細:', error.message, error.stack);
      }
    }
  };

  // ESCキーでキャンセル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingComment) {
        cancelEdit();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingComment, cancelEdit]);

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

  // Phase 2: いいねボタンのアニメーション用クラス
  const getLikeButtonClass = (commentId: string, isLiked: boolean): string => {
    const baseClass = "flex items-center space-x-1 text-xs transition-all duration-200";
    const loadingClass = isLikingComment === commentId ? "animate-pulse" : "";
    const colorClass = isLiked 
      ? "text-red-500 hover:text-red-600" 
      : "text-gray-500 hover:text-red-500";
    
    return `${baseClass} ${loadingClass} ${colorClass}`;
  };

  return (
    <div className="flex flex-col h-full">
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
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <MoreHorizontal size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">まだコメントがありません</p>
            <p className="text-sm text-gray-400 mt-1">最初のコメントを投稿してみましょう</p>
          </div>
        ) : (
          comments.map((comment) => {
            // Phase 2: いいね状態の取得（フォールバック付き）
            const likeState = likesState[comment.id] || { 
              count: comment.likes_count || 0, 
              isLiked: comment.is_liked || false 
            };
            
            return (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.user_avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'}
                  alt={comment.user_name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    // 画像読み込みエラー時のフォールバック
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
                      </div>
                      
                      {/* 編集・削除ボタン（権限チェック付き） */}
                      {canManageComment(comment) && (
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
                  <div className="flex items-center space-x-4 mt-2 ml-4">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className={getLikeButtonClass(comment.id, likeState.isLiked)}
                      disabled={isLikingComment === comment.id || !toggleLike}
                      aria-label={likeState.isLiked ? 'いいねを取り消す' : 'いいね'}
                      title={likeState.isLiked ? 'いいねを取り消す' : 'いいね'}
                    >
                      <Heart 
                        size={14} 
                        fill={likeState.isLiked ? 'currentColor' : 'none'}
                        className={`transition-transform duration-200 ${
                          isLikingComment === comment.id 
                            ? 'scale-110' 
                            : 'hover:scale-110'
                        }`}
                      />
                      <span className="font-medium">
                        {formatLikeCount(likeState.count)}
                      </span>
                      {/* Phase 2: ローディング中の視覚的フィードバック */}
                      {isLikingComment === comment.id && (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
                      )}
                    </button>
                  </div>
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