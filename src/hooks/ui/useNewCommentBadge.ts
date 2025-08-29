// src/hooks/ui/useNewCommentBadge.ts - 開発ガイドライン準拠版
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import type { 
  UseNewCommentBadgeParams,
  UseNewCommentBadgeReturn,
  NewCommentBadgeInfo,
  NewCommentQueryResult
} from '../../types/core';

// デバッグログ関数（開発時のみ）
const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[useNewCommentBadge] ${message}`, data);
  }
};

/**
 * 新着コメント通知バッジ用Hook
 * 写真またはアルバムの新着コメント数を管理
 */
export const useNewCommentBadge = ({
  targetId,
  targetType,
  enabled = true
}: UseNewCommentBadgeParams): UseNewCommentBadgeReturn => {
  // すべてのHooksをトップレベルで宣言（Hooksルール厳格遵守）
  const [newCommentCount, setNewCommentCount] = useState(0);
  const [hasNewComments, setHasNewComments] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // キャッシュ管理（5分間）
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const [cachedData, setCachedData] = useState<{
    count: number;
    hasNew: boolean;
    lastSeen: string | null;
  } | null>(null);

  // 既存useApp()を活用
  const { user, profile } = useApp();
  const userId = user?.id || profile?.id;

  // バッジ情報の計算（メモ化で最適化）
  const badgeInfo = useMemo((): NewCommentBadgeInfo => ({
    targetId,
    targetType,
    newCommentCount,
    hasNewComments,
    lastSeenAt
  }), [targetId, targetType, newCommentCount, hasNewComments, lastSeenAt]);

  // キャッシュの有効性チェック
  const isCacheValid = useCallback(() => {
    const now = Date.now();
    const cacheAge = now - cacheTimestamp;
    const CACHE_DURATION = 5 * 60 * 1000; // 5分
    return cacheAge < CACHE_DURATION && cachedData !== null;
  }, [cacheTimestamp, cachedData]);

  // 写真レベルの新着コメント数取得
  const fetchPhotoNewComments = useCallback(async (photoId: string, currentUserId: string) => {
    try {
      debugLog('写真新着コメント取得開始', { photoId, userId: currentUserId });

      // 1. ユーザーの最終確認日時を取得
      const { data: lastSeenData, error: lastSeenError } = await supabase
        .from('user_last_seen')
        .select('last_seen_at')
        .eq('user_id', currentUserId)
        .eq('target_type', 'photo')
        .eq('target_id', photoId)
        .single();

      if (lastSeenError && lastSeenError.code !== 'PGRST116') {
        throw lastSeenError;
      }

      const userLastSeenAt = lastSeenData?.last_seen_at || null;
      
      debugLog('最終確認日時取得', { 
        photoId, 
        lastSeenAt: userLastSeenAt 
      });

      // 2. 新着コメント数を計算
      let query = supabase
        .from('comments')
        .select('id, created_at', { count: 'exact' })
        .eq('photo_id', photoId);

      // 最終確認日時以降のコメントをフィルタ
      if (userLastSeenAt) {
        query = query.gt('created_at', userLastSeenAt);
      }

      const { count, error: commentError } = await query;

      if (commentError) throw commentError;

      const newCount = count || 0;
      
      debugLog('写真新着コメント数取得完了', { 
        photoId, 
        newCount,
        lastSeenAt: userLastSeenAt
      });

      return {
        count: newCount,
        hasNew: newCount > 0,
        lastSeen: userLastSeenAt
      };

    } catch (err) {
      debugLog('写真新着コメント取得エラー', err);
      throw err;
    }
  }, []);

  // アルバムレベルの新着コメント確認
  const fetchAlbumNewComments = useCallback(async (albumId: string, currentUserId: string) => {
    try {
      debugLog('アルバム新着コメント確認開始', { albumId, userId: currentUserId });

      // バッチクエリで効率的に取得
      const { data, error } = await supabase.rpc('check_album_new_comments', {
        p_album_id: albumId,
        p_user_id: currentUserId
      });

      if (error) {
        debugLog('アルバム新着コメント確認でRPC関数エラー、フォールバックを使用', error);
        return await fetchAlbumNewCommentsFallback(albumId, currentUserId);
      }

      const hasNew = data && data.length > 0 && data.some((item: any) => item.has_new_comments);

      debugLog('アルバム新着コメント確認完了', { 
        albumId, 
        hasNew,
        photosWithNewComments: data ? data.filter((item: any) => item.has_new_comments).length : 0
      });

      return {
        count: 0, // アルバムレベルでは数字は表示しない
        hasNew,
        lastSeen: null // アルバムレベルでは個別の最終確認日時は管理しない
      };

    } catch (err) {
      debugLog('アルバム新着コメント確認エラー', err);
      // フォールバック処理
      return await fetchAlbumNewCommentsFallback(albumId, currentUserId);
    }
  }, []);

  // アルバム新着コメント確認のフォールバック処理
  const fetchAlbumNewCommentsFallback = useCallback(async (albumId: string, currentUserId: string) => {
    try {
      debugLog('アルバム新着コメント確認フォールバック実行', { albumId });

      // 1. アルバム内の写真IDを取得
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('id')
        .eq('album_id', albumId);

      if (photosError) throw photosError;

      if (!photos || photos.length === 0) {
        return { count: 0, hasNew: false, lastSeen: null };
      }

      const photoIds = photos.map(p => p.id);

      // 2. 各写真の新着コメント状況を確認
      const promises = photoIds.map(async (photoId) => {
        const result = await fetchPhotoNewComments(photoId, currentUserId);
        return result.hasNew;
      });

      const results = await Promise.all(promises);
      const hasAnyNew = results.some(hasNew => hasNew);

      debugLog('アルバム新着コメント確認フォールバック完了', { 
        albumId, 
        totalPhotos: photoIds.length,
        hasAnyNew
      });

      return {
        count: 0,
        hasNew: hasAnyNew,
        lastSeen: null
      };

    } catch (err) {
      debugLog('アルバム新着コメント確認フォールバックエラー', err);
      throw err;
    }
  }, [fetchPhotoNewComments]);

  // 新着コメント情報の取得（メイン処理）
  const fetchNewCommentInfo = useCallback(async () => {
    if (!enabled || !userId || !targetId) {
      debugLog('実行条件未満のためスキップ', { 
        enabled, 
        hasUserId: !!userId, 
        hasTargetId: !!targetId 
      });
      return;
    }

    // キャッシュチェック
    if (isCacheValid()) {
      debugLog('キャッシュを使用', { targetId, targetType });
      setNewCommentCount(cachedData!.count);
      setHasNewComments(cachedData!.hasNew);
      setLastSeenAt(cachedData!.lastSeen);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      debugLog('新着コメント情報取得開始', { targetId, targetType });

      let result;
      
      if (targetType === 'photo') {
        result = await fetchPhotoNewComments(targetId, userId);
      } else if (targetType === 'album') {
        result = await fetchAlbumNewComments(targetId, userId);
      } else {
        throw new Error(`未対応のターゲットタイプ: ${targetType}`);
      }

      // 状態更新
      setNewCommentCount(result.count);
      setHasNewComments(result.hasNew);
      setLastSeenAt(result.lastSeen);

      // キャッシュ更新
      setCachedData(result);
      setCacheTimestamp(Date.now());

      debugLog('新着コメント情報取得完了', { 
        targetId, 
        targetType, 
        result 
      });

    } catch (err) {
      debugLog('新着コメント情報取得エラー', err);
      console.error('新着コメント情報の取得に失敗:', err);
      setError(err instanceof Error ? err.message : '新着コメント情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [
    enabled, 
    userId, 
    targetId, 
    targetType, 
    isCacheValid, 
    cachedData, 
    fetchPhotoNewComments, 
    fetchAlbumNewComments
  ]);

  // 最終確認日時更新（写真を確認済みとしてマーク）
  const markAsSeen = useCallback(async () => {
    if (!userId || !targetId || targetType !== 'photo') {
      debugLog('markAsSeen: 条件未満', { 
        hasUserId: !!userId, 
        hasTargetId: !!targetId, 
        targetType 
      });
      return;
    }

    try {
      debugLog('最終確認日時更新開始', { targetId, targetType });

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('user_last_seen')
        .upsert({
          user_id: userId,
          target_type: 'photo', // 写真のみ対応
          target_id: targetId,
          last_seen_at: now,
          updated_at: now
        });

      if (error) throw error;

      // 状態をリセット
      setNewCommentCount(0);
      setHasNewComments(false);
      setLastSeenAt(now);

      // キャッシュをクリア
      setCachedData(null);
      setCacheTimestamp(0);

      debugLog('最終確認日時更新完了', { targetId, timestamp: now });

    } catch (err) {
      debugLog('最終確認日時更新エラー', err);
      console.error('最終確認日時の更新に失敗:', err);
      setError(err instanceof Error ? err.message : '最終確認日時の更新に失敗しました');
    }
  }, [userId, targetId, targetType]);

  // 手動リフレッシュ（キャッシュを無視して再取得）
  const refresh = useCallback(async () => {
    debugLog('手動リフレッシュ実行', { targetId, targetType });
    
    // キャッシュをクリア
    setCachedData(null);
    setCacheTimestamp(0);
    
    await fetchNewCommentInfo();
  }, [targetId, targetType, fetchNewCommentInfo]);

  // 初期データ取得とリアルタイム更新の設定
  useEffect(() => {
    if (enabled && userId && targetId) {
      debugLog('初期データ取得開始', { targetId, targetType });
      fetchNewCommentInfo();
      
      // リアルタイム更新の設定（コメントテーブルの変更を監視）
      const channel = supabase
        .channel(`new-comment-badge:${targetId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: targetType === 'photo' ? `photo_id=eq.${targetId}` : undefined,
          },
          (payload) => {
            debugLog('リアルタイム更新検知', { targetId, payload });
            
            // 少し遅延させてからリフレッシュ（データベースの反映を待つ）
            setTimeout(() => {
              refresh();
            }, 1000);
          }
        )
        .subscribe();

      return () => {
        debugLog('リアルタイム監視停止', { targetId });
        supabase.removeChannel(channel);
      };
    }
    
    // 条件に満たない場合は状態をリセット
    debugLog('条件未満のため状態リセット', { enabled, hasUserId: !!userId, hasTargetId: !!targetId });
    setNewCommentCount(0);
    setHasNewComments(false);
    setLastSeenAt(null);
    setLoading(false);
    setError(null);
    setCachedData(null);
    setCacheTimestamp(0);
    
    // クリーンアップ関数を返す（何もしない場合でも）
    return () => {
      // 条件に満たない場合は何もクリーンアップしない
    };
  }, [enabled, userId, targetId, targetType, fetchNewCommentInfo, refresh]);

  return {
    newCommentCount,
    hasNewComments,
    lastSeenAt,
    loading,
    error,
    markAsSeen,
    refresh,
    badgeInfo, // デバッグ用
  };
};