import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Photo } from '../../types';
import { PhotoModal } from './PhotoModal';

export const PhotoGrid: React.FC = () => {
  const { photos, photosLoading } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photosLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }
  if (photos.length === 0) {
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
            className="aspect-square cursor-pointer group overflow-hidden rounded-xl"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.thumbnail_url || photo.url}
              alt={photo.filename}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      <PhotoModal
        photo={selectedPhoto}
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </>
  );
};