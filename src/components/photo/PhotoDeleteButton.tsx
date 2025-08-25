// src/components/photo/PhotoDeleteButton.tsx
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';
import { useApp } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Photo } from '../../types/core';

interface PhotoDeleteButtonProps {
  photo: Photo;
  onDeleted?: () => void;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PhotoDeleteButton: React.FC<PhotoDeleteButtonProps> = ({
  photo,
  onDeleted,
  variant = 'icon',
  size = 'md',
  className = ''
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deletePhoto, currentAlbum } = useApp();
  const { canDeleteResource, canManageAlbum } = usePermissions();

  // 削除権限チェック
  const canDelete = canDeleteResource('photo.delete', {
    uploadedBy: photo.uploaded_by
  }) || (currentAlbum && canManageAlbum(currentAlbum));

  const handleDelete = async () => {
    if (!canDelete) {
      alert('この写真を削除する権限がありません');
      return;
    }

    setIsDeleting(true);

    try {
      await deletePhoto(photo.id);
      setShowDeleteModal(false);
      onDeleted?.();
    } catch (error) {
      console.error('写真削除エラー:', error);
      alert('写真の削除に失敗しました。もう一度お試しください。');
    } finally {
      setIsDeleting(false);
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
    const parts = [];
    parts.push(photo.original_filename || photo.filename);
    if (photo.file_size) {
      parts.push(`(${formatFileSize(photo.file_size)})`);
    }
    return parts.join(' ');
  };

  // 権限がない場合は何も表示しない
  if (!canDelete) {
    return null;
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setShowDeleteModal(true)}
          className={`p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors ${className}`}
          title="写真を削除"
          aria-label="写真を削除"
        >
          <Trash2 size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
        </button>
      ) : (
        <Button
          onClick={() => setShowDeleteModal(true)}
          variant="outline"
          size={size}
          className={`text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 ${className}`}
        >
          <Trash2 size={16} className="mr-2" />
          削除
        </Button>
      )}

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