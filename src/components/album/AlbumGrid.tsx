import React from 'react';
import { Calendar, ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';

export const AlbumGrid: React.FC = () => {
  const { albums, albumsLoading, albumsInitialized, setCurrentAlbum } = useApp();

  // 初期化中または読み込み中の表示
  if (!albumsInitialized || albumsLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded mb-3" />
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return '不明';
    }

    try {
      const date = new Date(dateString);
      
      // 無効な日付かチェック
      if (isNaN(date.getTime())) {
        console.warn('無効な日付文字列:', dateString);
        return '不明';
      }

      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('日付フォーマットエラー:', error, dateString);
      return '不明';
    }
  };

  const formatRelativeTime = (dateString: string | undefined | null) => {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return '今日';
      } else if (diffDays === 1) {
        return '昨日';
      } else if (diffDays < 7) {
        return `${diffDays}日前`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks}週間前`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months}ヶ月前`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years}年前`;
      }
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {albums.map((album) => {
        // 複数の日付フィールドから有効なものを選択
        const albumDate = album.createdAt || album.created_at;
        const relativeTime = formatRelativeTime(albumDate);
        
        return (
          <Card
            key={album.id}
            onClick={() => setCurrentAlbum(album)}
            className="overflow-hidden group hover:shadow-xl transition-all duration-300"
          >
            <div className="aspect-square relative">
              {album.cover_image_url ? (
                <img
                  src={album.cover_image_url}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // 画像の読み込みに失敗した場合のフォールバック
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              {/* フォールバック表示（画像がない場合、または読み込みに失敗した場合） */}
              <div className={`w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center ${
                album.cover_image_url ? 'hidden' : ''
              }`}>
                <ImageIcon size={48} className="text-orange-300" />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* 相対時間表示 */}
              {relativeTime && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {relativeTime}
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                {album.title}
              </h3>
              {album.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {album.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span title={formatDate(albumDate)}>
                    {formatDate(albumDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <ImageIcon size={14} />
                  <span>{album.photo_count || 0}枚</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      
      {/* アルバムが空の場合の表示 */}
      {albumsInitialized && albums.length === 0 && (
        <div className="col-span-full text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <ImageIcon size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">まだアルバムがありません</h3>
          <p className="text-gray-600">最初のアルバムを作成して、思い出を整理しましょう</p>
        </div>
      )}
    </div>
  );
};