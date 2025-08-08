import React from 'react';
import { Calendar, ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';

export const AlbumGrid: React.FC = () => {
  const { albums, albumsLoading, setCurrentAlbum } = useApp();

  if (albumsLoading) {
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '日付不明';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {albums.map((album) => (
        <Card
          key={album.id}
          onClick={() => setCurrentAlbum(album)}
          className="overflow-hidden group"
        >
          <div className="aspect-square relative">
            {album.cover_image_url ? (
              <img
                src={album.cover_image_url}
                alt={album.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  console.error('Image load error:', e);
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                <ImageIcon size={48} className="text-orange-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                <span>{formatDate(album.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ImageIcon size={14} />
                <span>{album.photo_count || 0}枚</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};