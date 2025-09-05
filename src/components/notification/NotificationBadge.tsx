// src/components/notification/NotificationBadge.tsx - 写真既読イベント処理追加版
import React, { useState, useCallback, useEffect } from 'react';
import { Bell, X, Image as ImageIcon, MessageCircle, UserPlus, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../hooks/ui/useNotifications';
import type { Notification } from '../../types/core';

interface NotificationBadgeProps {
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const { albums, setCurrentAlbum } = useApp();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearNotification
  } = useNotifications();

  // ★ 写真既読イベント処理を追加
  useEffect(() => {
    const handleMarkPhotoNotificationsAsRead = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { photoId } = customEvent.detail;
      
      console.log('[NotificationBadge] 写真既読イベント受信:', { photoId });
      
      try {
        // 該当写真に関連する未読通知を検索
        const relatedNotifications = notifications.filter(n => 
          n.target_type === 'photo' && 
          n.target_id === photoId && 
          !n.read
        );
        
        console.log('[NotificationBadge] 対象通知:', relatedNotifications);
        
        // 関連する未読通知を既読にする
        for (const notification of relatedNotifications) {
          await markAsRead(notification.id);
        }
        
        if (relatedNotifications.length > 0) {
          console.log('[NotificationBadge] 写真関連通知を既読処理完了:', relatedNotifications.length);
        }
        
      } catch (error) {
        console.error('[NotificationBadge] 写真既読処理エラー:', error);
      }
    };

    // アルバム既読イベント処理も追加
    const handleMarkAlbumNotificationsAsRead = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { albumId } = customEvent.detail;
      
      console.log('[NotificationBadge] アルバム既読イベント受信:', { albumId });
      
      try {
        // 該当アルバムに関連する未読通知を検索
        const relatedNotifications = notifications.filter(n => 
          n.target_type === 'album' && 
          n.target_id === albumId && 
          !n.read
        );
        
        // 関連する未読通知を既読にする
        for (const notification of relatedNotifications) {
          await markAsRead(notification.id);
        }
        
        if (relatedNotifications.length > 0) {
          console.log('[NotificationBadge] アルバム関連通知を既読処理完了:', relatedNotifications.length);
        }
        
      } catch (error) {
        console.error('[NotificationBadge] アルバム既読処理エラー:', error);
      }
    };

    // イベントリスナーを登録
    window.addEventListener('markPhotoNotificationsAsRead', handleMarkPhotoNotificationsAsRead);
    window.addEventListener('markAlbumNotificationsAsRead', handleMarkAlbumNotificationsAsRead);
    
    return () => {
      // クリーンアップ
      window.removeEventListener('markPhotoNotificationsAsRead', handleMarkPhotoNotificationsAsRead);
      window.removeEventListener('markAlbumNotificationsAsRead', handleMarkAlbumNotificationsAsRead);
    };
  }, [notifications, markAsRead]);

  // ★ アルバムからの通知遷移イベント処理を追加
  useEffect(() => {
    const handleOpenAlbumFromNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { albumId } = customEvent.detail;
      
      console.log('[NotificationBadge] アルバム遷移イベント受信:', { albumId });
      
      const targetAlbum = albums.find(album => album.id === albumId);
      if (targetAlbum) {
        setCurrentAlbum(targetAlbum);
        setIsOpen(false);
        console.log('[NotificationBadge] アルバムに遷移:', targetAlbum.title);
      }
    };

    window.addEventListener('openAlbumFromNotification', handleOpenAlbumFromNotification);
    
    return () => {
      window.removeEventListener('openAlbumFromNotification', handleOpenAlbumFromNotification);
    };
  }, [albums, setCurrentAlbum]);

  const handleNotificationClick = async (notification: any) => {
    try {
      console.log('[NotificationBadge] 通知クリック:', notification);
      
      // 通知を既読にする
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      
      // 通知の種類に応じて適切な遷移処理
      if (notification.target_type === 'photo') {
        // 写真への遷移：まずアルバムを開く
        const albumId = notification.metadata?.albumId;
        if (albumId) {
          window.dispatchEvent(new CustomEvent('openAlbumFromNotification', { 
            detail: { albumId } 
          }));
        }
      } else if (notification.target_type === 'album') {
        // アルバムへの直接遷移
        window.dispatchEvent(new CustomEvent('openAlbumFromNotification', { 
          detail: { albumId: notification.target_id } 
        }));
      }
      
      setIsOpen(false);
      
    } catch (error) {
      console.error('[NotificationBadge] 通知からの遷移エラー:', error);
    }
  };

  const getNotificationIcon = useCallback((type: Notification['type']): React.ReactElement => {
    const iconProps = { size: 16, className: "text-white" };
    
    switch (type) {
      case 'new_comment':
        return <MessageCircle {...iconProps} />;
      case 'new_photo':
        return <ImageIcon {...iconProps} />;
      case 'new_member':
        return <UserPlus {...iconProps} />;
      case 'album_created':
        return <Calendar {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  }, []);
  
  const getNotificationColor = useCallback((type: Notification['type']): string => {
    switch (type) {
      case 'new_comment':
        return 'bg-green-500';
      case 'new_photo':
        return 'bg-blue-500';
      case 'new_member':
        return 'bg-purple-500';
      case 'album_created':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  }, []);

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (hours < 1) {
        return 'たった今';
      } else if (hours < 24) {
        return `${hours}時間前`;
      } else {
        const days = Math.floor(hours / 24);
        return `${days}日前`;
      }
    } catch {
      return timestamp;
    }
  };

  // デバッグログ
  useEffect(() => {
    console.log('[NotificationBadge] レンダリング状態:', {
      notificationsLength: notifications.length,
      unreadCount,
      loading,
      error,
      firstNotification: notifications[0] || null
    });
  }, [notifications, unreadCount, loading, error]);

  return (
    <div className={`relative ${className}`}>
      {/* 通知ベル */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
        aria-label="通知を表示"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {/* 通知ドロップダウン */}
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div 
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 通知パネル */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 max-h-96 overflow-hidden">
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">通知</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    すべて既読
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="通知パネルを閉じる"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* 通知リスト */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">通知はありません</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* 通知アイコン */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 ${getNotificationColor(notification.type)} rounded-full flex items-center justify-center`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        {/* 通知内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className={`text-sm mt-1 leading-relaxed ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>
                            
                            {/* アクション */}
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" title="未読" />
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                title="削除"
                              >
                                <X size={12} className="text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* フッター */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};