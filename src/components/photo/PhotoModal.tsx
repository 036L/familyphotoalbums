import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Calendar, User, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { CommentSection } from './CommentSection'; // EnhancedCommentSectionではなくCommentSectionを使用
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';
import { usePermissions } from '../../hooks/usePermissions';

// Photo型の定義
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
  const { photos, deletePhoto, currentAlbum } = useApp();
  const { canDeleteResource, canManageAlbum, userRole, userId } = usePermissions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (photo) {
      const index = photos.findIndex(p => p.id === photo.id);
      setCurrentIndex(index);
    }
  }, [photo, photos]);

  const currentPhoto = photos[currentIndex] || photo;

  if (!photo) return null;

  // 削除権限チェック（より厳密に）
  const canDelete = useMemo(() => {
    const hasDeletePermission = canDeleteResource('photo.delete', {
      uploadedBy: currentPhoto.uploaded_by
    });
    
    const canManageCurrentAlbum = currentAlbum && canManageAlbum(currentAlbum);
    
    const result = hasDeletePermission || canManageCurrentAlbum;
    
    // デバッグログ
    console.log('[PhotoModal] 削除権限チェック:', {
      photoId: currentPhoto.id,
      uploadedBy: currentPhoto.uploaded_by,
      userId,
      userRole,
      hasDeletePermission,
      canManageCurrentAlbum,
      finalResult: result
    });
    
    return result;
  }, [currentPhoto.uploaded_by, currentPhoto.id, canDeleteResource, currentAlbum, canManageAlbum, userId, userRole]);

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

  const handleDelete = async () => {
    if (!canDelete) {
      alert('この写真を削除する権限がありません');
      return;
    }

    setIsDeleting(true);

    try {
      await deletePhoto(currentPhoto.id);
      setShowDeleteModal(false);
      
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
    } catch (error) {
      console.error('写真削除エラー:', error);
      alert('写真の削除に失敗しました。もう一度お試しください。');
    } finally {
      setIsDeleting(false);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getItemInfo = (): string => {
    const parts = [];
    parts.push(currentPhoto.original_filename || currentPhoto.filename);
    if (currentPhoto.file_size) {
      parts.push(`(${formatFileSize(currentPhoto.file_size)})`);
    }
    return parts.join(' ');
  };

  return (
    <>
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
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>{formatDate(currentPhoto.uploadedAt || currentPhoto.created_at)}</span>
                </div>
                {currentPhoto.uploader_name && (
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>{currentPhoto.uploader_name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4">
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
                
                {/* 削除ボタンを右下に配置 */}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="写真を削除"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
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

      {/* 削除確認ダイアログ */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="写真を削除"
        message="この写真を削除してもよろしいですか？"
        itemName={getItemInfo()}
        isDeleting={isDeleting}
      />
    </>
  );
};