import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Calendar, User, MoreHorizontal } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Photo } from '../../types';
import { useApp } from '../../context/AppContext';
import { EnhancedCommentSection } from './EnhancedCommentSection';
import { PhotoDeleteButton } from './PhotoDeleteButton';

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
  const [showMenu, setShowMenu] = useState(false);

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

  const handlePhotoDeleted = () => {
    // 削除後の処理
    if (photos.length <= 1) {
      // 最後の写真が削除された場合はモーダルを閉じる
      onClose();
    } else {
      // 他の写真がある場合は次の写真に移動
      if (currentIndex >= photos.length - 1) {
        setCurrentIndex(Math.max(0, photos.length - 2));
      }
    }
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-900">
                {currentPhoto.filename}
              </h3>
              
              {/* メニューボタン */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreHorizontal size={20} className="text-gray-500" />
                </button>

                {/* ドロップダウンメニュー */}
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-30"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-40">
                      <div className="p-2">
                        <PhotoDeleteButton 
                          photo={currentPhoto}
                          variant="button"
                          size="sm"
                          className="w-full justify-start"
                          onDeleted={() => {
                            setShowMenu(false);
                            handlePhotoDeleted();
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
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
              <EnhancedCommentSection photoId={currentPhoto.id} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};