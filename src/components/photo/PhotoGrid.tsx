import React, { useState } from 'react';

// 簡易版のPhotoModal（実際のプロジェクトでは './PhotoModal' からインポート）
const PhotoModal = ({ photo, isOpen, onClose }) => {
  if (!isOpen || !photo) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-4xl w-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          ✕
        </button>
        <img 
          src={photo.url} 
          alt={photo.filename}
          className="w-full h-auto max-h-[70vh] object-contain"
        />
        <div className="mt-4">
          <h3 className="font-semibold">{photo.filename}</h3>
          <p className="text-sm text-gray-600">
            {photo.uploadedAt || photo.created_at}
          </p>
        </div>
      </div>
    </div>
  );
};

// Photo型の定義（実際のプロジェクトでは types/index.ts からインポート）
interface Photo {
  id: string;
  filename: string;
  original_filename: string;
  url: string;
  thumbnail_url: string | null;
  file_type: 'image' | 'video';
  file_size: number;
  width: number | null;
  height: number | null;
  album_id: string;
  uploaded_by: string;
  metadata: Record<string, any>;
  created_at: string;
  uploader_name?: string;
  uploadedAt?: string;
}

interface PhotoGridProps {
  photos?: Photo[];
  photosLoading?: boolean;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ 
  photos = [],
  photosLoading = false 
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 写真選択ハンドラー
  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  // モーダルクローズハンドラー
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // モーダルが完全に閉じた後にselectedPhotoをクリア
    setTimeout(() => {
      setSelectedPhoto(null);
    }, 300);
  };

  // ローディング表示
  if (photosLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={`skeleton-${i}`} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // 写真がない場合の表示
  if (!Array.isArray(photos) || photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">まだ写真がありません</h3>
        <p className="text-gray-600">最初の思い出を追加してみましょう</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square cursor-pointer group overflow-hidden rounded-xl bg-gray-100"
            onClick={() => handlePhotoClick(photo)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePhotoClick(photo);
              }
            }}
            aria-label={`写真を開く: ${photo.filename}`}
          >
            <img
              src={photo.thumbnail_url || photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                // 画像読み込みエラー時のフォールバック
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="200" y="200" font-family="Arial" font-size="20" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3E画像を読み込めません%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        ))}
      </div>

      {/* PhotoModal - selectedPhotoとisModalOpenの両方でレンダリング制御 */}
      <PhotoModal
        photo={selectedPhoto}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

// デモ用のコンポーネント
export default function PhotoGridDemo() {
  const [loading, setLoading] = useState(false);
  
  const demoPhotos: Photo[] = [
    {
      id: '1',
      filename: 'mountain.jpg',
      original_filename: 'mountain-landscape.jpg',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
      file_type: 'image',
      file_size: 2048000,
      width: 1920,
      height: 1080,
      album_id: 'album-1',
      uploaded_by: 'user-1',
      metadata: {},
      created_at: '2024-01-15T10:00:00Z',
      uploader_name: 'ユーザー1',
      uploadedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      filename: 'lake.jpg',
      original_filename: 'beautiful-lake.jpg',
      url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800',
      thumbnail_url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=300',
      file_type: 'image',
      file_size: 1536000,
      width: 1920,
      height: 1080,
      album_id: 'album-1',
      uploaded_by: 'user-1',
      metadata: {},
      created_at: '2024-01-16T14:30:00Z',
      uploader_name: 'ユーザー1',
      uploadedAt: '2024-01-16T14:30:00Z'
    },
    {
      id: '3',
      filename: 'forest.jpg',
      original_filename: 'green-forest.jpg',
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      thumbnail_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300',
      file_type: 'image',
      file_size: 1892000,
      width: 1920,
      height: 1080,
      album_id: 'album-1',
      uploaded_by: 'user-2',
      metadata: {},
      created_at: '2024-01-17T09:15:00Z',
      uploader_name: 'ユーザー2',
      uploadedAt: '2024-01-17T09:15:00Z'
    },
    {
      id: '4',
      filename: 'sunset.jpg',
      original_filename: 'beautiful-sunset.jpg',
      url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800',
      thumbnail_url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=300',
      file_type: 'image',
      file_size: 2156000,
      width: 1920,
      height: 1080,
      album_id: 'album-1',
      uploaded_by: 'user-1',
      metadata: {},
      created_at: '2024-01-18T18:45:00Z',
      uploader_name: 'ユーザー1',
      uploadedAt: '2024-01-18T18:45:00Z'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">PhotoGrid デモ</h1>
          <button
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            ローディングをテスト
          </button>
        </div>
        
        <PhotoGrid photos={demoPhotos} photosLoading={loading} />
      </div>
    </div>
  );
}