// src/hooks/useComments.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEnvironment } from './useEnvironment';
import type { Comment } from '../types/core';

export const useComments = (photoId?: string) => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 環境情報をHookで取得
  const { isDemo } = useEnvironment();

  const fetchComments = async (targetPhotoId?: string) => {
    if (!targetPhotoId && !photoId) return;

    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // デモモードでのコメント（固定データ）
        const demoComments: Comment[] = [
          {
            id: 'demo-comment-1',
            content: 'とても綺麗な写真ですね！✨ 家族みんなで楽しそう😊',
            photo_id: targetPhotoId || photoId!,
            user_id: 'demo-user-2',
            parent_id: null,
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            user_name: '田中花子',
            user_avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            likes_count: 5,
            is_liked: false,
          },
          {
            id: 'demo-comment-2',
            content: 'この夕日、本当に美しいですね。写真で見ても感動します。',
            photo_id: targetPhotoId || photoId!,
            user_id: 'demo-user-3',
            parent_id: null,
            created_at: '2024-01-15T19:00:00Z',
            updated_at: '2024-01-15T19:00:00Z',
            user_name: '田中おじいちゃん',
            user_avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
            likes_count: 3,
            is_liked: false,
          }
        ];

        setTimeout(() => {
          setComments(demoComments);
          setLoading(false);
        }, 300);
        return;
      }

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(name, avatar_url)
        `)
        .eq('photo_id', targetPhotoId || photoId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithUserInfo = data.map((comment: any) => ({
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
      if (isDemo) {
        // デモモードでのコメント追加
        const newComment: Comment = {
          id: `demo-comment-${Date.now()}`,
          content,
          photo_id: targetPhotoId || photoId!,
          user_id: 'demo-user-1',
          parent_id: parentId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: 'デモユーザー',
          user_avatar: null,
          likes_count: 0,
          is_liked: false,
        };

        setComments(prev => [...prev, newComment]);
        return newComment;
      }

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
      if (isDemo) {
        // デモモードでのコメント更新
        setComments(prev =>
          prev.map(comment =>
            comment.id === id
              ? { ...comment, content, updated_at: new Date().toISOString() }
              : comment
          )
        );
        return comments.find(c => c.id === id);
      }

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
      if (isDemo) {
        // デモモードでのコメント削除
        setComments(prev => prev.filter(comment => comment.id !== id));
        return;
      }

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
  }, [photoId, isDemo]); // isDemo も依存配列に追加

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