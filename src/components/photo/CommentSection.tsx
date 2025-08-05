import React, { useState } from 'react';
import { Send, Mic } from 'lucide-react';
import { Button } from '../ui/Button';
import { useComments } from '../../hooks/useComments';

interface CommentSectionProps {
  photoId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ photoId }) => {
  const [newComment, setNewComment] = useState('');
  const { comments, loading, addComment } = useComments(photoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment(newComment, photoId);
      setNewComment('');
    } catch (error) {
      console.error('コメント投稿エラー:', error);
    }
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

  return (
    <div className="flex flex-col h-full">
      {/* コメント一覧 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">まだコメントがありません</p>
            <p className="text-sm text-gray-400 mt-1">最初のコメントを投稿してみましょう</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <img
                src={comment.user_avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'}
                alt={comment.user_name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <div className="bg-gray-50 rounded-2xl px-4 py-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* コメント入力エリア */}
      <div className="border-t border-gray-100 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 transition-colors"
              title="音声入力"
            >
              <Mic size={16} />
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
    </div>
  );
};