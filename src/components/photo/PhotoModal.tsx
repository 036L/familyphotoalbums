import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Calendar, User, Trash2 } from 'lucide-react';

// 簡易版のUIコンポーネント（実際のプロジェクトではimportを使用）
const Modal = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl ${className}`}>
        {children}
      </div>
    </div>
  );
};

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200';
  const variantClasses = variant === 'outline' 
    ? 'border-2 border-orange-300 text-orange-600 hover:bg-orange-50'
    : 'bg-orange-400 text-white hover:bg-orange-500';
  const sizeClasses = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';
  
  return (
    <button className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

const CommentSection = ({ photoId }) => (
  <div className="p-4">
    <p className="text-gray-600">コメント機能（Photo ID: {photoId}）</p>
  </div>
);

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message, itemName, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="mb-2">{message}</p>
        <p className="text-sm text-gray-600 mb-4">対象: {itemName}</p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? '削除中...' : '削除'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

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
  photos?: Photo[];
  deletePhoto?: (id: string) => Promise<void>;
  currentAlbum?: any;
  canDeleteResource?: (permission: string, resource: any) => boolean;
  canManageAlbum?: (album: any) => boolean;
  userRole?: string;
  userId?: string;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  photo,
  isOpen,
  onClose,
  photos = [],
  deletePhoto = async () => {},
  currentAlbum = null,
  canDeleteResource = () => false,
  canManageAlbum = () => false,
  userRole = 'viewer',
  userId = ''
}) => {
  // すべてのHooksを最初に宣言
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // photoの変更を監視してインデックスを更新
  React.useEffect(() => {
    if (photo && photos.length > 0) {
      const index = photos.findIndex(p => p.id === photo.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [photo, photos]);

  // 現在の写真を取得
  const currentPhoto = useMemo(() => {
    if (!photo) return null;
    if (photos.length === 0) return photo;
    if (currentIndex >= 0 && currentIndex < photos.length) {
      return photos[currentIndex];
    }
    return photo;
  }, [photo, photos, currentIndex]);

  // 削除権限チェック
  const canDelete = useMemo(() => {
    if (!currentPhoto) return false;
    
    try {
      const hasDeletePermission = canDeleteResource('photo.delete', {
        uploadedBy: currentPhoto.uploaded_by
      });
      
      const canManageCurrentAlbum = currentAlbum ? canManageAlbum(currentAlbum) : false;
      
      return hasDeletePermission || canManageCurrentAlbum;
    } catch (error) {
      console.error('[PhotoModal] 削除権限チェックエラー:', error);
      return false;
    }
  }, [currentPhoto, canDeleteResource, currentAlbum, canManageAlbum]);

  // ナビゲーション関数
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

  // 削除処理
  const handleDelete = async () => {
    if (!canDelete || !currentPhoto) {
      alert('この写真を削除する権限がありません');
      return;
    }

    setIsDeleting(true);

    try {
      await deletePhoto(currentPhoto.id);
      setShowDeleteModal(false);
      
      if (photos.length <= 1) {
        onClose();
      } else {
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

  // ユーティリティ関数
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '不明';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getItemInfo = (): string => {
    if (!currentPhoto) return '';
    const parts = [];
    parts.push(currentPhoto.original_filename || currentPhoto.filename);
    if (currentPhoto.file_size) {
      parts.push(`(${formatFileSize(currentPhoto.file_size)})`);
    }
    return parts.join(' ');
  };

  // photoがnullの場合は何も表示しない
  if (!photo || !currentPhoto) {
    return null;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* 写真表示エリア */}
          <div className="relative flex-1 bg-black rounded-l-2xl">
            <img
              src={currentPhoto.url || 'https://via.placeholder.com/800x600'}
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
          <div className="w-full lg:w-96 bg-white rounded-r-2xl flex flex-col">
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
                
                {/* 削除ボタン */}
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

// デモ用のコンポーネント
export default function PhotoModalDemo() {
  const [isOpen, setIsOpen] = useState(true);
  
  const demoPhoto: Photo = {
    id: 'demo-1',
    filename: 'sample.jpg',
    original_filename: 'vacation-photo.jpg',
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
    uploader_name: 'デモユーザー',
    uploadedAt: '2024-01-15T10:00:00Z'
  };

  const demoPhotos: Photo[] = [
    demoPhoto,
    { ...demoPhoto, id: 'demo-2', url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800' },
    { ...demoPhoto, id: 'demo-3', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">PhotoModal デモ</h1>
        <Button onClick={() => setIsOpen(true)}>モーダルを開く</Button>
        
        <PhotoModal
          photo={demoPhoto}
          photos={demoPhotos}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          deletePhoto={async (id) => console.log('Delete photo:', id)}
          canDeleteResource={() => true}
          canManageAlbum={() => false}
          userRole="editor"
          userId="user-1"
        />
      </div>
    </div>
  );
}