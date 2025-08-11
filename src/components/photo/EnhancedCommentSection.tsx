import React, { useState } from 'react';
import { 
  Send, 
  Mic, 
  Heart, 
  Reply, 
  MoreHorizontal, 
  Smile,
  ThumbsUp,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useComments } from '../../hooks/useComments';

interface Comment {
  id: string;
  content: string;
  photo_id: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  likes_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
}

interface EnhancedCommentSectionProps {
  photoId: string;
}

export const EnhancedCommentSection: React.FC<EnhancedCommentSectionProps> = ({ photoId }) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { comments, loading, addComment, updateComment, deleteComment } = useComments(photoId);

  // デモ用のコメントデータ（実際のアプリケーションではAPIから取得）
  const demoComments: Comment[] = [
    {
      id: '1',
      content: 'とても綺麗な写真ですね！✨ 家族みんなで楽しそう😊',
      photo_id: photoId,
      user_id: 'user-1',
      parent_id: null,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      user_name: '田中花子',
      user_avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      likes_count: 5,
      is_liked: false,
      replies: [
        {
          id: '2',
          content: 'ありがとうございます！本当に楽しい旅行でした🏖️',
          photo_id: photoId,
          user_id: 'user-2',
          parent_id: '1',
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z',
          user_name: 'デモユーザー',
          user_avatar: null,
          likes_count: 2,
          is_liked: true,
        }
      ]
    },
    {
      id: '3',
      content: 'この場所はどこですか？今度行ってみたいです！',
      photo_id: photoId,
      user_id: 'user-3',
      parent_id: null,
      created_at: '2024-01-15T12:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
      user_name: '田中おじいちゃん',
      user_avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      likes_count: 3,
      is_liked: false,
    }
  ];

  const displayComments = comments.length > 0 ? comments : demoComments;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      if (replyTo) {
        // 返信コメントの追加
        await addComment(newComment, photoId, replyTo);
        setReplyTo(null);
      } else {
        // 新規コメントの追加
        await addComment(newComment, photoId);
      }
      setNewComment('');
    } catch (error) {
      console.error('コメント投稿エラー:', error);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('コメント編集エラー:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('このコメントを削除しますか？')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        console.error('コメント削除エラー:', error);
      }
    }
  };

  const handleLike = async (commentId: string) => {
    // いいね機能の実装（デモでは何もしない）
    console.log('Like comment:', commentId);
  };

  const formatDate = (dateString: string) => {
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
  };

  const insertEmoji = (emoji: string) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = ['😊', '❤️', '👍', '🎉', '😍', '👏', '🔥', '💯', '😂', '🥰', '✨', '🙌'];

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex space-x-3">
        <img
          src={comment.user_avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'}
          alt={comment.user_name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user_name}
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </span>
                <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <MoreHorizontal size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
            
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                  rows={2}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleEdit(comment.id)}
                    size="sm"
                    className="px-3 py-1 text-xs"
                  >
                    保存
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                    variant="outline"
                    size="sm"
                    className="px-3 py-1 text-xs"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-sm leading-relaxed">
                {comment.content}
              </p>
            )}
          </div>
          
          {/* アクションボタン */}
          <div className="flex items-center space-x-4 mt-2 ml-4">
            <button
              onClick={() => handleLike(comment.id)}
              className={`flex items-center space-x-1 text-xs transition-colors ${
                comment.is_liked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart size={14} fill={comment.is_liked ? 'currentColor' : 'none'} />
              <span>{comment.likes_count || 0}</span>
            </button>
            
            {!isReply && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-orange-500 transition-colors"
              >
                <Reply size={14} />
                <span>返信</span>
              </button>
            )}
            
            <button
              onClick={() => {
                setEditingComment(comment.id);
                setEditContent(comment.content);
              }}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Edit size={14} />
              <span>編集</span>
            </button>
            
            <button
              onClick={() => handleDelete(comment.id)}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
              <span>削除</span>
            </button>
          </div>
          
          {/* 返信表示 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
          
          {/* 返信入力フォーム */}
          {replyTo === comment.id && (
            <div className="mt-3">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`${comment.user_name}に返信...`}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    <Smile size={16} />
                  </button>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="px-3 py-2 rounded-full"
                  disabled={!newComment.trim()}
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* コメント一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : displayComments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">まだコメントがありません</p>
            <p className="text-sm text-gray-400 mt-1">最初のコメントを投稿してみましょう</p>
          </div>
        ) : (
          displayComments.map(comment => renderComment(comment))
        )}
      </div>

      {/* 絵文字ピッカー */}
      {showEmojiPicker && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          <div className="grid grid-cols-6 gap-2">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* コメント入力エリア */}
      <div className="border-t border-gray-100 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? "返信を入力..." : "コメントを入力..."}
              className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                title="絵文字を追加"
              >
                <Smile size={16} />
              </button>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                title="音声入力"
              >
                <Mic size={16} />
              </button>
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            className="px-3 py-2 rounded-full"
            disabled={!newComment.trim()}
          >
            <Send size={16} />
          </Button>
        </form>
        
        {replyTo && (
          <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
            <span>返信中...</span>
            <button
              onClick={() => setReplyTo(null)}
              className="text-orange-500 hover:text-orange-600"
            >
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  );
};