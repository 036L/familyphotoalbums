// src/hooks/useComments.ts - Phase 1 改善版
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useEnvironment } from './useEnvironment';
import { useApp } from '../context/AppContext';
import type { Comment } from '../types/core';

// デバッグログ関数
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[useComments] ${message}`, data);
  }
};

export const useComments = (photoId?: string) => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 環境情報をHookで取得
  const { isDemo } = useEnvironment();
  const { user, profile } = useApp();

  // Phase 1: デモコメントデータの改善
  const getDemoComments = useCallback((targetPhotoId: string): Comment[] => {
    const demoComments: Comment[] = [
      {
        id: 'demo-comment-1',
        content: 'とても綺麗な写真ですね！✨ 家族みんなで楽しそう😊',
        photo_id: targetPhotoId,
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
        photo_id: targetPhotoId,
        user_id: 'demo-user-3',
        parent_id: null,
        created_at: '2024-01-15T19:00:00Z',
        updated_at: '2024-01-15T19:00:00Z',
        user_name: '田中おじいちゃん',
        user_avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
        likes_count: 3,
        is_liked: false,
      },
      {
        id: 'demo-comment-3',
        content: 'みんなで泳いで楽しかった〜！🏊‍♀️',
        photo_id: targetPhotoId,
        user_id: 'demo-user-1',
        parent_id: null,
        created_at: '2024-01-15T21:00:00Z',
        updated_at: '2024-01-15T21:00:00Z',
        user_name: 'デモユーザー',
        user_avatar: null,
        likes_count: 2,
        is_liked: true,
      }
    ];

    // ローカルストレージから追加されたコメントも読み込み
    try {
      const savedCommentsKey = `demoComments_${targetPhotoId}`;
      const savedComments = localStorage.getItem(savedCommentsKey);
      if (savedComments) {
        const parsedComments = JSON.parse(savedComments);
        if (Array.isArray(parsedComments)) {
          return [...demoComments, ...parsedComments];
        }
      }
    } catch (error) {
      debugLog('保存されたコメントの読み込みに失敗', error);
    }

    return demoComments;
  }, []);

  const fetchComments = useCallback(async (targetPhotoId?: string) => {
    const currentPhotoId = targetPhotoId || photoId;
    
    if (!currentPhotoId) {
      debugLog('写真IDが指定されていません');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      debugLog('コメント取得開始', { photoId: currentPhotoId, isDemo });

      if (isDemo) {
        // デモモードでのコメント取得
        const demoComments = getDemoComments(currentPhotoId);
        
        setTimeout(() => {
          setComments(demoComments);
          setLoading(false);
          debugLog('デモコメント取得完了', { 
            photoId: currentPhotoId, 
            commentCount: demoComments.length 
          });
        }, 100); // 遅延を短縮して即座に表示
        return;
      }

      // 実際のSupabaseからの取得
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(name, avatar_url)
        `)
        .eq('photo_id', currentPhotoId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithUserInfo = data.map((comment: any) => ({
        ...comment,
        user_name: comment.profiles?.name || '不明',
        user_avatar: comment.profiles?.avatar_url || null,
      }));

      setComments(commentsWithUserInfo);
      debugLog('Supabaseコメント取得完了', { 
        photoId: currentPhotoId, 
        commentCount: commentsWithUserInfo.length 
      });
    } catch (err) {
      debugLog('コメント取得エラー', err);
      console.error('コメント取得エラー:', err);
      setError('コメントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [photoId, isDemo, getDemoComments]);

  // Phase 1: コメント追加処理の改善
  const addComment = useCallback(async (content: string, targetPhotoId?: string, parentId?: string) => {
    const currentPhotoId = targetPhotoId || photoId;
    
    if (!currentPhotoId) {
      throw new Error('写真IDが指定されていません');
    }

    try {
      debugLog('コメント追加開始', { content, photoId: currentPhotoId, parentId });

      if (isDemo) {
        // デモモードでのコメント追加
        const newComment: Comment = {
          id: `demo-comment-${Date.now()}`,
          content,
          photo_id: currentPhotoId,
          user_id: profile?.id || user?.id || 'demo-user-1',
          parent_id: parentId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_name: profile?.name || 'デモユーザー',
          user_avatar: profile?.avatar_url || null,
          likes_count: 0,
          is_liked: false,
        };

        // Phase 1: 楽観的更新
        setComments(prev => [...prev, newComment]);
        
        // ローカルストレージに保存
        try {
          const savedCommentsKey = `demoComments_${currentPhotoId}`;
          const existingComments = localStorage.getItem(savedCommentsKey);
          const commentsList = existingComments ? JSON.parse(existingComments) : [];
          commentsList.push(newComment);
          localStorage.setItem(savedCommentsKey, JSON.stringify(commentsList));
          debugLog('デモコメントをローカルストレージに保存');
        } catch (error) {
          debugLog('ローカルストレージ保存エラー', error);
        }

        debugLog('デモコメント追加完了', newComment);
        return newComment;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('ログインが必要です');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content,
          photo_id: currentPhotoId,
          user_id: currentUser.id,
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

      // Phase 1: 楽観的更新
      setComments(prev => [...prev, newComment]);
      debugLog('Supabaseコメント追加完了', newComment);
      return newComment;
    } catch (err) {
      debugLog('コメント投稿エラー', err);
      console.error('コメント投稿エラー:', err);
      throw new Error('コメントの投稿に失敗しました');
    }
  }, [photoId, isDemo, profile, user]);

  // Phase 1: コメント更新処理の改善
  const updateComment = useCallback(async (id: string, content: string) => {
    try {
      debugLog('コメント更新開始', { id, content });

      if (isDemo) {
        // Phase 1: 楽観的更新（デモモード）
        const updatedComments = comments.map(comment =>
          comment.id === id
            ? { ...comment, content, updated_at: new Date().toISOString() }
            : comment
        );
        setComments(updatedComments);
        
        // ローカルストレージも更新
        try {
          const currentPhotoId = photoId;
          if (currentPhotoId) {
            const savedCommentsKey = `demoComments_${currentPhotoId}`;
            const existingComments = localStorage.getItem(savedCommentsKey);
            if (existingComments) {
              const commentsList = JSON.parse(existingComments);
              const updatedList = commentsList.map((comment: Comment) =>
                comment.id === id ? { ...comment, content, updated_at: new Date().toISOString() } : comment
              );
              localStorage.setItem(savedCommentsKey, JSON.stringify(updatedList));
            }
          }
        } catch (error) {
          debugLog('ローカルストレージ更新エラー', error);
        }
        
        debugLog('デモコメント更新完了', { id, content });
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

      // Phase 1: 楽観的更新
      setComments(prev => 
        prev.map(comment => 
          comment.id === id ? updatedComment : comment
        )
      );

      debugLog('Supabaseコメント更新完了', updatedComment);
      return updatedComment;
    } catch (err) {
      debugLog('コメント更新エラー', err);
      console.error('コメント更新エラー:', err);
      throw new Error('コメントの更新に失敗しました');
    }
  }, [isDemo, comments, photoId]);

  // Phase 1: コメント削除処理の改善
  const deleteComment = useCallback(async (id: string) => {
    try {
      debugLog('コメント削除開始', id);

      if (isDemo) {
        // Phase 1: 楽観的更新（デモモード）
        const filteredComments = comments.filter(comment => comment.id !== id);
        setComments(filteredComments);
        
        // ローカルストレージからも削除
        try {
          const currentPhotoId = photoId;
          if (currentPhotoId) {
            const savedCommentsKey = `demoComments_${currentPhotoId}`;
            const existingComments = localStorage.getItem(savedCommentsKey);
            if (existingComments) {
              const commentsList = JSON.parse(existingComments);
              const filteredList = commentsList.filter((comment: Comment) => comment.id !== id);
              localStorage.setItem(savedCommentsKey, JSON.stringify(filteredList));
            }
          }
        } catch (error) {
          debugLog('ローカルストレージ削除エラー', error);
        }
        
        debugLog('デモコメント削除完了', id);
        return;
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Phase 1: 楽観的更新
      setComments(prev => prev.filter(comment => comment.id !== id));
      debugLog('Supabaseコメント削除完了', id);
    } catch (err) {
      debugLog('コメント削除エラー', err);
      console.error('コメント削除エラー:', err);
      throw new Error('コメントの削除に失敗しました');
    }
  }, [isDemo, comments, photoId]);

  // 写真IDが変更されたときにコメントを取得
  useEffect(() => {
    if (photoId) {
      debugLog('写真ID変更によるコメント取得', photoId);
      fetchComments();
    } else {
      // 写真IDがない場合はコメントをクリア
      setComments([]);
      setError(null);
    }
  }, [photoId, fetchComments]);

  // デバッグ用の状態ログ出力（開発時のみ）
  useEffect(() => {
    if (import.meta.env.DEV) {
      debugLog('コメント状態変更', { 
        photoId, 
        commentCount: comments.length, 
        loading, 
        error,
        isDemo,
        commentIds: comments.map(c => c.id).slice(0, 3) // 最初の3つのIDのみ
      });
    }
  }, [photoId, comments, loading, error, isDemo]);

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