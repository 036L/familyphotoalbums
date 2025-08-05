import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Comment {
  id: string;
  content: string;
  photo_id: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export const useComments = (photoId?: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async (targetPhotoId?: string) => {
    if (!targetPhotoId && !photoId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(name, avatar_url)
        `)
        .eq('photo_id', targetPhotoId || photoId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithUserInfo = data.map(comment => ({
        ...comment,
        user_name: comment.profiles?.name || '不明',
        user_avatar: comment.profiles?.avatar_url || null,
      }));

      setComments(commentsWithUserInfo);
    } catch (err) {
      console.error('コメント取得エラー:', err);
      setError('コメントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string, targetPhotoId?: string, parentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content,
          photo_id: targetPhotoId || photoId!,
          user_id: user.id,
          parent_id: parentId || null,
        })
        .select(`
          *,
          profiles!comments_user_id_fkey(name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const newComment = {
        ...data,
        user_name: data.profiles?.name || '不明',
        user_avatar: data.profiles?.avatar_url || null,
      };

      setComments(prev => [...prev, newComment]);
      return newComment;
    } catch (err) {
      console.error('コメント投稿エラー:', err);
      throw new Error('コメントの投稿に失敗しました');
    }
  };

  const updateComment = async (id: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ 
          content, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select(`
          *,
          profiles!comments_user_id_fkey(name, avatar_url)
        `)
        .single();

      if (error) throw error;

      const updatedComment = {
        ...data,
        user_name: data.profiles?.name || '不明',
        user_avatar: data.profiles?.avatar_url || null,
      };

      setComments(prev => 
        prev.map(comment => 
          comment.id === id ? updatedComment : comment
        )
      );

      return updatedComment;
    } catch (err) {
      console.error('コメント更新エラー:', err);
      throw new Error('コメントの更新に失敗しました');
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setComments(prev => prev.filter(comment => comment.id !== id));
    } catch (err) {
      console.error('コメント削除エラー:', err);
      throw new Error('コメントの削除に失敗しました');
    }
  };

  useEffect(() => {
    if (photoId) {
      fetchComments();
    }
  }, [photoId]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
  };
};