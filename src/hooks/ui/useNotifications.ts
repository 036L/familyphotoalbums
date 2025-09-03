// src/hooks/ui/useNotifications.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import type { Notification, NotificationMetadata } from '../../types/core';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  getNotificationsByType: (type: Notification['type']) => Notification[];
}

export const useNotifications = (): UseNotificationsReturn => {
  // すべてのHooksをトップレベルで宣言
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, profile } = useApp();
  const userId = user?.id || profile?.id;

  // 未読通知数の計算（メモ化）
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // 通知の取得
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: notificationsData, error: fetchError } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          target_type,
          target_id,
          source_user_id,
          message,
          metadata,
          is_read,
          created_at,
          profiles!source_user_id(name, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      // 通知データを変換
      const transformedNotifications: Notification[] = (notificationsData || []).map(item => ({
        id: item.id,
        type: item.type,
        title: generateNotificationTitle(item.type, item.metadata),
        message: item.message || generateNotificationMessage(item.type, item.metadata),
        timestamp: item.created_at,
        read: item.is_read,
        user_id: userId,
        source_user_id: item.source_user_id,
        source_user_name: (item.profiles as any)?.[0]?.name || 'ユーザー',
        target_type: item.target_type,
        target_id: item.target_id,
        metadata: item.metadata || {}
      }));

      setNotifications(transformedNotifications);

    } catch (err) {
      console.error('通知取得エラー:', err);
      setError(err instanceof Error ? err.message : '通知の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 通知のタイトル生成
  const generateNotificationTitle = (type: string, metadata: any): string => {
    switch (type) {
      case 'new_comment':
        return '新しいコメント';
      case 'new_photo':
        return '新しい写真';
      case 'new_member':
        return '新しいメンバー';
      case 'album_created':
        return '新しいアルバム';
      default:
        return '通知';
    }
  };

  // 通知のメッセージ生成
  const generateNotificationMessage = (type: string, metadata: any): string => {
    switch (type) {
      case 'new_comment':
        return `${metadata?.albumTitle || 'アルバム'}の写真にコメントが追加されました`;
      case 'new_photo':
        return `${metadata?.albumTitle || 'アルバム'}に新しい写真が追加されました`;
      case 'new_member':
        return `新しいメンバーが参加しました`;
      case 'album_created':
        return `新しいアルバム「${metadata?.albumTitle || ''}」が作成されました`;
      default:
        return '新しい通知があります';
    }
  };

  // 単一通知を既読にする
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      // 楽観的更新
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

    } catch (err) {
      console.error('通知既読エラー:', err);
      setError(err instanceof Error ? err.message : '既読処理に失敗しました');
    }
  }, [userId]);

  // 全通知を既読にする
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      // 楽観的更新
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );

    } catch (err) {
      console.error('全通知既読エラー:', err);
      setError(err instanceof Error ? err.message : '全既読処理に失敗しました');
    }
  }, [userId]);

  // 通知を削除する
  const clearNotification = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      // 楽観的更新
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );

    } catch (err) {
      console.error('通知削除エラー:', err);
      setError(err instanceof Error ? err.message : '通知削除に失敗しました');
    }
  }, [userId]);

  // タイプ別通知の取得
  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // 手動リフレッシュ
  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // 初期データ取得とリアルタイム更新
  useEffect(() => {
    if (userId) {
      fetchNotifications();

      // リアルタイム更新の設定
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // 新しい通知があったら少し遅延してリフレッシュ
            setTimeout(() => {
              fetchNotifications();
            }, 500);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // userIdが無い場合は状態をクリア
    setNotifications([]);
    setLoading(false);
    setError(null);

    return () => {
      // クリーンアップ（何もしない場合でも関数を返す）
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearNotification,
    refresh,
    getNotificationsByType,
  };
};

export type { UseNotificationsReturn };