// src/hooks/useComments.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Comment } from '../types/core';

const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[useComments] ${message}`, data);
  }
};

interface LikeState {
  count: number;
  isLiked: boolean;
}

export const useComments = (photoId?: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likesState, setLikesState] = useState<Record<string, LikeState>>({});
  const [isLikingComment, setIsLikingComment] = useState<string | null>(null);

  // コメント取得（いいね情報含む）
  const fetchComments = useCallback(async (targetPhotoId?: string) => {
    const currentPhotoId = targetPhotoId || photoId;
    
    if (!currentPhotoId) {
      debugLog('写真IDが指定されていません');
      setComments([]);
      setLikesState({});
      setLoading(false);
      return [];
    }
  
    try {
      setLoading(true);
      setError(null);
      debugLog('コメント取得開始', { photoId: currentPhotoId });

      // シンプルなコメント取得（JOINなし）
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('photo_id', currentPhotoId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLikesState({});
        debugLog('コメントが見つかりません', { photoId: currentPhotoId });
        return [];
      }

      debugLog('コメント取得成功', { 
        photoId: currentPhotoId, 
        commentCount: commentsData.length 
      });

      // プロフィール情報を別途取得
      const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      // コメントデータを構築
      const commentsWithProfiles = commentsData.map((comment: any) => {
        const profile = profilesData?.find(p => p.id === comment.user_id);
        return {
          ...comment,
          user_name: profile?.name || 'ユーザー',
          user_avatar: profile?.avatar_url || null,
          likes_count: 0,
          is_liked: false,
        };
      });

      setComments(commentsWithProfiles);
      
      // いいね状態を初期化
      const newLikesState: Record<string, LikeState> = {};
      commentsWithProfiles.forEach((comment: Comment) => {
        newLikesState[comment.id] = {
          count: 0,
          isLiked: false
        };
      });
      setLikesState(newLikesState);
      
      debugLog('コメント処理完了', { 
        photoId: currentPhotoId, 
        commentCount: commentsWithProfiles.length 
      });
      
      return commentsWithProfiles;
    } catch (err) {
      debugLog('コメント取得エラー', err);
      console.error('コメント取得エラー:', err);
      setError('コメントの取得に失敗しました');
      setComments([]);
      setLikesState({});
      return [];
    } finally {
      setLoading(false);
    }
  }, [photoId]);

  // コメント追加 - シンプル版
  const addComment = useCallback(async (content: string, targetPhotoId?: string, parentId?: string) => {
    const currentPhotoId = targetPhotoId || photoId;
    
    if (!currentPhotoId) {
      throw new Error('写真IDが指定されていません');
    }

    try {
      debugLog('コメント追加開始', { content, photoId: currentPhotoId });

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('ログインが必要です');

      // シンプルな挿入のみ
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: content,
          photo_id: currentPhotoId,
          user_id: currentUser.id,
          parent_id: parentId || null,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Supabase挿入エラー:', error);
        throw error;
      }

      // プロフィール情報を簡単に設定
      const newComment = {
        ...data,
        user_name: currentUser.user_metadata?.name || currentUser.email || 'ユーザー',
        user_avatar: null,
        likes_count: 0,
        is_liked: false,
      };

      setComments(prev => [...prev, newComment]);
      setLikesState(prev => ({
        ...prev,
        [newComment.id]: { count: 0, isLiked: false }
      }));
      
      debugLog('コメント追加完了', newComment);
      return newComment;
    } catch (err) {
      debugLog('コメント投稿エラー', err);
      console.error('コメント投稿エラー:', err);
      throw new Error('コメントの投稿に失敗しました');
    }
  }, [photoId]);

  // コメント更新
  const updateComment = useCallback(async (id: string, content: string) => {
    try {
      debugLog('コメント更新開始', { id, content });

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

      // コメントリストを更新
      setComments(prev => 
        prev.map(comment => 
          comment.id === id ? updatedComment : comment
        )
      );

      debugLog('コメント更新完了', updatedComment);
      return updatedComment;
    } catch (err) {
      debugLog('コメント更新エラー', err);
      console.error('コメント更新エラー:', err);
      throw new Error('コメントの更新に失敗しました');
    }
  }, []);

  // コメント削除
  const deleteComment = useCallback(async (id: string) => {
    try {
      debugLog('コメント削除開始', id);

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // コメントリストから削除
      setComments(prev => prev.filter(comment => comment.id !== id));
      
      // いいね状態も削除
      setLikesState(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      debugLog('コメント削除完了', id);
    } catch (err) {
      debugLog('コメント削除エラー', err);
      console.error('コメント削除エラー:', err);
      throw new Error('コメントの削除に失敗しました');
    }
  }, []);

  // いいね機能
  const toggleLike = useCallback(async (commentId: string) => {
    try {
      debugLog('いいね処理開始', { commentId });
      
      // 重複実行を防止
      if (isLikingComment === commentId) {
        debugLog('既に処理中', commentId);
        return;
      }
      
      setIsLikingComment(commentId);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }

      // 現在のいいね状態を確認
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select()
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingLike) {
        // いいね削除
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id);

        if (deleteError) throw deleteError;
        
        debugLog('いいね削除完了', commentId);
      } else {
        // いいね追加
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: currentUser.id });

        if (insertError) throw insertError;
        
        debugLog('いいね追加完了', commentId);
      }

      // コメントリストを再取得して最新状態に更新
      await fetchComments();
      
    } catch (error) {
      debugLog('いいね処理エラー', error);
      console.error('いいね処理エラー:', error);
      throw error;
    } finally {
      setIsLikingComment(null);
    }
  }, [isLikingComment, fetchComments]);

  // 写真IDが変更されたときにコメントを取得
  useEffect(() => {
    if (photoId) {
      debugLog('写真ID変更によるコメント取得', photoId);
      fetchComments();
    } else {
      setComments([]);
      setLikesState({});
      setError(null);
    }
  }, [photoId, fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    // いいね機能
    toggleLike,
    likesState,
    isLikingComment,
  };
};