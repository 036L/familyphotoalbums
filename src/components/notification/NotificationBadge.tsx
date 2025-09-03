import React, { useState, useEffect } from 'react';
import { Bell, X, Image as ImageIcon, UserPlus, MessageCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNewCommentBadge } from '../../hooks/ui/useNewCommentBadge';

interface Notification {
  id: string;
  type: 'new_photo' | 'new_comment' | 'new_member' | 'album_created';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
}

interface NotificationBadgeProps {
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  // ★ useAppからopenPhotoModalを取得
  const { albums } = useApp();

  // ★ 一時的に固定値で動作確認
  const notifications: any[] = [];
  const unreadCount = 0;

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

  const markAsRead = (notificationId: string) => {
    // 実際の実装では、ここで既読状態をSupabaseに保存
    console.log('既読マーク:', notificationId);
  };

  const markAllAsRead = () => {
    // すべてを既読にする処理
    console.log('全て既読');
  };

  const clearNotification = (notificationId: string) => {
    // 通知を削除する処理
    console.log('通知削除:', notificationId);
  };

  const getNotificationIcon = (type: 'new_comment'): React.ReactElement => {
    const iconProps = { size: 16, className: "text-white" };
    return <MessageCircle {...iconProps} />;
  };

  const getNotificationColor = (type: 'new_comment'): string => {
    return 'bg-green-500';
  };

  const formatTimestamp = (timestamp: string): string => {
    return timestamp;
  };

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