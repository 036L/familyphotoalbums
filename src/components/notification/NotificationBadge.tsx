// src/components/notification/NotificationBadge.tsx - 実装版
import React, { useState, useCallback } from 'react';
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

  const handleNotificationClick = async (notification: any) => {
    try {
      // アルバムの最初の写真で新着コメントがある写真を探す
      console.log('通知から写真遷移開始:', notification.albumId);
      
      // まずアルバムを開く
      const targetAlbum = albums.find(album => album.id === notification.albumId);
      if (targetAlbum) {
        // アルバムビューに移動（AppContextのsetCurrentAlbumを使用）
        // これは直接呼び出せないので、カスタムイベントで処理
        window.dispatchEvent(new CustomEvent('openAlbumFromNotification', { 
          detail: { albumId: notification.albumId } 
        }));
        
        setIsOpen(false);
      }
    } catch (error) {
      console.error('通知からの遷移エラー:', error);
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
    return timestamp;
  };

  React.useEffect(() => {
    console.log('[NotificationBadge] 状態更新:', {
      notificationsCount: notifications.length,
      unreadCount,
      loading,
      error,
      notifications: notifications.slice(0, 3) // 最初の3件のみログ出力
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
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">通知はありません</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
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
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>
                            
                            {/* アクション */}
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                  title="既読にする"
                                >
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                </button>
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