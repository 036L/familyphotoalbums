// src/components/photo/CommentSection.tsx - プレゼンテーション専用版
import React, { useRef, useEffect } from 'react';
import { Send, Mic, Heart, MoreHorizontal, Edit, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Comment } from '../../types/core';

interface CommentSectionProps {
  // 表示データ
  comments: Comment[];
  loading: boolean;
  error: string | null;
  
  // 編集状態
  editingComment: { id: string; content: string } | null;
  newComment: string;
  
  // ハンドラー
  onSubmit: (e: React.FormEvent) => void;
  onCommentChange: (value: string) => void;
  onStartEdit: (comment: Comment) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteComment: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onEditingCommentChange: (content: string) => void;
  
  // その他の状態
  isLikingComment?: string | null;
  retryingAction?: string | null;
  onRetry?: () => void;
  onClearRetry?: () => void;
  
  // 権限チェック・フォーマット関数
  canManageComment: (comment: Comment) => boolean;
  formatDate: (dateString: string) => string;
  formatLikeCount: (count: number) => string;
  getEffectiveLikeState: (commentId: string) => { count: number; isLiked: boolean };
  
  // レイアウト制御
  showInput?: boolean;
  className?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  loading,
  error,
  editingComment,
  newComment,
  onSubmit,
  onCommentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteComment,
  onLike,
  onEditingCommentChange,
  isLikingComment,
  retryingAction,
  onRetry,
  onClearRetry,
  canManageComment,
  formatDate,
  formatLikeCount,
  getEffectiveLikeState,
  showInput = true,
  className = ''
}) => {
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const inputFormRef = useRef<HTMLFormElement>(null);

  // 編集開始時のフォーカス処理
  useEffect(() => {
    if (editingComment && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(
        editInputRef.current.value.length, 
        editInputRef.current.value.length
      );
    }
  }, [editingComment]);

  return (
    <div className={`bg-white ${className}`}>
      {/* エラー・リトライ表示 */}
      {error && (
        <div className="p-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-red-700">{error}</p>
                {retryingAction && onRetry && (
                  <button 
                    onClick={onRetry} 
                    className="mt-1 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    再試行
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {retryingAction && !error && (
        <div className="p-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle size={14} className="text-yellow-500" />
                <span className="text-xs text-yellow-700">{retryingAction}に失敗しました</span>
              </div>
              <div className="flex items-center space-x-2">
                {onRetry && (
                  <button 
                    onClick={onRetry} 
                    className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                  >
                    再試行
                  </button>
                )}
                {onClearRetry && (
                  <button 
                    onClick={onClearRetry} 
                    className="text-xs text-yellow-600 hover:text-yellow-800"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* コメント一覧 */}
      <div className="p-3">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-2xl px-3 py-2">
                      <div className="h-3 bg-gray-300 rounded mb-1"></div>
                      <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <MoreHorizontal size={20} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium text-sm">まだコメントがありません</p>
            <p className="text-xs text-gray-400 mt-1">最初のコメントを投稿してみましょう</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {comments.map((comment) => {
              const likeState = getEffectiveLikeState(comment.id);
              const isTemporary = comment.id.startsWith('temp-');
              
              return (
                <div key={comment.id} className={`flex space-x-2 ${isTemporary ? 'opacity-70' : ''}`}>
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
                            <span className="text-xs text-orange-500 flex-shrink-0">送信中...</span>
                          )}
                        </div>
                        
                        {!isTemporary && canManageComment(comment) && (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onStartEdit(comment)}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                              title="編集"
                            >
                              <Edit size={12} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => onDeleteComment(comment.id)}
                              className="p-1 hover:bg-red-100 rounded-full transition-colors"
                              title="削除"
                            >
                              <Trash2 size={12} className="text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {editingComment && editingComment.id === comment.id ? (
                        <div className="space-y-3">
                          <textarea
                            ref={editInputRef}
                            value={editingComment.content}
                            onChange={(e) => onEditingCommentChange(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                            rows={Math.min(Math.max(2, Math.ceil(editingComment.content.length / 50)), 6)}
                            maxLength={500}
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={onSaveEdit}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600"
                              disabled={!editingComment.content.trim()}
                            >
                              <Check size={12} />
                              <span>保存</span>
                            </button>
                            <button
                              onClick={onCancelEdit}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600"
                            >
                              <X size={12} />
                              <span>キャンセル</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-800 text-sm leading-relaxed break-words">
                          {comment.content}
                        </p>
                      )}
                    </div>
                    
                    {!isTemporary && (
                      <div className="flex items-center mt-2 ml-4">
                        <button
                          onClick={() => onLike(comment.id)}
                          className={`flex items-center space-x-1 text-xs transition-all duration-200 ${
                            likeState.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          }`}
                          disabled={isLikingComment === comment.id}
                          style={{ minHeight: '28px', padding: '4px 8px' }}
                        >
                          <Heart 
                            size={14} 
                            fill={likeState.isLiked ? 'currentColor' : 'none'}
                            className={`transition-transform duration-200 ${
                              isLikingComment === comment.id ? 'scale-110 animate-pulse' : 'hover:scale-110'
                            }`}
                          />
                          <span className="font-medium">{formatLikeCount(likeState.count)}</span>
                          {isLikingComment === comment.id && (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* コメント入力エリア */}
      {showInput && (
        <div className="border-t border-gray-200 p-3 bg-white">
          <form ref={inputFormRef} onSubmit={onSubmit} className="space-y-2">
            <div className="flex space-x-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={newComment}
                  onChange={(e) => onCommentChange(e.target.value)}
                  placeholder="コメントを入力..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none text-sm"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '80px' }}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit(e);
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
                disabled={!newComment.trim() || loading}
              >
                {loading ? (
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
  );
};