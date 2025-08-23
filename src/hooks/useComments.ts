// useComments.ts - Supabase いいね機能完全版
// 既存のuseComments.tsを以下で置き換えてください

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useEnvironment } from './useEnvironment';
import { useApp } from '../context/AppContext';
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
  
  const { isDemo } = useEnvironment();
  const { user, profile } = useApp();

  // デモコメントデータ（いいね機能は無効）
  const getDemoComments = useCallback((targetPhotoId: string): Comment[] => {
    return [
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
  }, []);

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
      debugLog('コメント取得開始', { photoId: currentPhotoId, isDemo });
  
      if (isDemo) {
        // デモモードではローカルコメント（いいね機能無効）
        const demoComments = getDemoComments(currentPhotoId);
        setComments(demoComments);
        
        // デモ用のいいね状態（静的）
        const demoLikes: Record<string, LikeState> = {};
        demoComments.forEach(comment => {
          demoLikes[comment.id] = {
            count: comment.likes_count || 0,
            isLiked: comment.is_liked || false
          };
        });
        setLikesState(demoLikes);
        
        setLoading(false);
        debugLog('デモコメント取得完了', { commentCount: demoComments.length });
        return demoComments;
      }
  
      // 現在のユーザーを取得
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // 1. コメントを取得
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(name, avatar_url)
        `)
        .eq('photo_id', currentPhotoId)
        .order('created_at', { ascending: true });
  
      if (commentsError) throw commentsError;
  
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLikesState({});
        debugLog('コメントが見つかりません', { photoId: currentPhotoId });
        return [];
      }
  
      debugLog('コメント基本データ取得完了', { 
        photoId: currentPhotoId, 
        commentCount: commentsData.length,
        commentIds: commentsData.map((c: any) => c.id)
      });
  
      // 2. すべてのいいね情報を一度に取得
      const commentIds = commentsData.map((c: any) => c.id);
      const { data: allLikes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);
  
      if (likesError) throw likesError;
  
      debugLog('いいね情報取得完了', { 
        totalLikes: allLikes?.length || 0,
        currentUserId: currentUser?.id
      });
  
      // 3. いいね数をカウントし、現在ユーザーのいいね状態をチェック
      const likeCounts: Record<string, number> = {};
      const userLikes: Record<string, boolean> = {};
      
      // 初期化
      commentIds.forEach((id: string) => {
        likeCounts[id] = 0;
        userLikes[id] = false;
      });
  
      // いいね情報を集計
      (allLikes || []).forEach((like: any) => {
        const commentId = like.comment_id;
        likeCounts[commentId] = (likeCounts[commentId] || 0) + 1;
        
        if (currentUser && like.user_id === currentUser.id) {
          userLikes[commentId] = true;
        }
      });
  
      debugLog('いいね集計完了', { 
        likeCounts, 
        userLikes: currentUser ? userLikes : {} 
      });
  
      // 4. コメントデータを構築
      const commentsWithLikes = commentsData.map((comment: any) => ({
        ...comment,
        user_name: comment.profiles?.name || '不明',
        user_avatar: comment.profiles?.avatar_url || null,
        likes_count: likeCounts[comment.id] || 0,
        is_liked: currentUser ? (userLikes[comment.id] || false) : false,
      }));
  
      setComments(commentsWithLikes);
      
      // 5. いいね状態を設定
      const newLikesState: Record<string, LikeState> = {};
      commentsWithLikes.forEach((comment: Comment) => {
        newLikesState[comment.id] = {
          count: comment.likes_count || 0,
          isLiked: comment.is_liked || false
        };
      });
      setLikesState(newLikesState);
      
      debugLog('コメント処理完了', { 
        photoId: currentPhotoId, 
        commentCount: commentsWithLikes.length,
        likesState: newLikesState
      });
      
      return commentsWithLikes;
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
  }, [photoId, isDemo, getDemoComments]);

  // コメント追加
  const addComment = useCallback(async (content: string, targetPhotoId?: string, parentId?: string) => {
    const currentPhotoId = targetPhotoId || photoId;
    
    if (!currentPhotoId) {
      throw new Error('写真IDが指定されていません');
    }

    try {
      debugLog('コメント追加開始', { content, photoId: currentPhotoId, parentId });

      if (isDemo) {
        // デモモードでは追加機能を無効化
        throw new Error('デモモードではコメント追加はできません');
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
        likes_count: 0,
        is_liked: false,
      };

      // コメントリストを更新
      setComments(prev => [...prev, newComment]);
      
      // いいね状態を初期化
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
  }, [photoId, isDemo]);

  // コメント更新
  const updateComment = useCallback(async (id: string, content: string) => {
    try {
      debugLog('コメント更新開始', { id, content });

      if (isDemo) {
        throw new Error('デモモードではコメント編集はできません');
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
  }, [isDemo]);

  // コメント削除
  const deleteComment = useCallback(async (id: string) => {
    try {
      debugLog('コメント削除開始', id);

      if (isDemo) {
        throw new Error('デモモードではコメント削除はできません');
      }

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
  }, [isDemo]);

  // いいね機能（Supabase版）
  const toggleLike = useCallback(async (commentId: string) => {
    try {
      debugLog('いいね処理開始', { commentId, isDemo });
      
      if (isDemo) {
        debugLog('デモモードではいいね機能は無効');
        return;
      }

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
  }, [isDemo, isLikingComment, fetchComments]);

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