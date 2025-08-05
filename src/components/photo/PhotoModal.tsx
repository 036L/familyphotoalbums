import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Calendar, User } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Photo } from '../../types';
import { useApp } from '../../context/AppContext';
import { CommentSection } from './CommentSection';

interface PhotoModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  photo,
  isOpen,
  onClose
}) => {
  const { photos } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);

  React.useEffect(() => {
    if (photo) {
      const index = photos.findIndex(p => p.id === photo.id);
      setCurrentIndex(index);
    }
  }, [photo, photos]);

  if (!photo) return null;

  const currentPhoto = photos[currentIndex] || photo;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-6xl">
      <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
        {/* 写真表示エリア */}
        <div className="relative flex-1 bg-black rounded-l-2xl lg:rounded-r-none rounded-r-2xl">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.filename}
            className="w-full h-full object-contain"
          />
          
          {/* ナビゲーションボタン */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={24} className="text-gray-800" />
              </button>
              
              <button
                onClick={goToNext}
                disabled={currentIndex === photos.length - 1}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={24} className="text-gray-800" />
              </button>
            </>
          )}

          {/* 写真インデックス */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>

        {/* 情報・コメントエリア */}
        <div className="w-full lg:w-96 bg-white rounded-r-2xl lg:rounded-l-none rounded-l-2xl flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {currentPhoto.filename}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar size={16} />
                <span>{formatDate(currentPhoto.uploadedAt)}</span>
              </div>
              {currentPhoto.uploader_name && (
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>{currentPhoto.uploader_name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 mt-4">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Heart size={16} />
                <span>いいね</span>
              </Button>
              <Button 
                variant={showComments ? 'primary' : 'outline'} 
                size="sm" 
                className="flex items-center space-x-2"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle size={16} />
                <span>コメント</span>
              </Button>
            </div>
          </div>

          {showComments && (
            <div className="flex-1 overflow-hidden">
              <CommentSection photoId={currentPhoto.id} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};