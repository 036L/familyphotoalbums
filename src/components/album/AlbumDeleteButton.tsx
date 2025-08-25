// src/components/album/AlbumDeleteButton.tsx
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';
import { useApp } from '../../context/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import type { Album } from '../../types/core';

interface AlbumDeleteButtonProps {
  album: Album;
  onDeleted?: () => void;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AlbumDeleteButton: React.FC<AlbumDeleteButtonProps> = ({
  album,
  onDeleted,
  variant = 'button',
  size = 'md',
  className = ''
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteAlbum, setCurrentAlbum, currentAlbum } = useApp();
  const { canDeleteResource } = usePermissions();

  // 削除権限チェック
  const canDelete = canDeleteResource('album.delete', {
    createdBy: album.created_by
  });

  const handleDelete = async () => {
    if (!canDelete) {
      alert('このアルバムを削除する権限がありません');
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAlbum(album.id);
      
      // 現在表示中のアルバムが削除された場合は、一覧に戻る
      if (currentAlbum?.id === album.id) {
        setCurrentAlbum(null);
      }

      setShowDeleteModal(false);
      onDeleted?.();
    } catch (error) {
      console.error('アルバム削除エラー:', error);
      alert('アルバムの削除に失敗しました。もう一度お試しください。');
    } finally {
      setIsDeleting(false);
    }
  };

  const getWarningMessage = (): string | undefined => {
    const photoCount = album.photo_count || 0;
    if (photoCount > 0) {
      return `このアルバムには${photoCount}枚の写真が含まれています。アルバムを削除すると、すべての写真も削除されます。`;
    }
    return undefined;
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
          title="アルバムを削除"
          aria-label="アルバムを削除"
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
        title="アルバムを削除"
        message="このアルバムを削除してもよろしいですか？"
        itemName={album.title}
        warningMessage={getWarningMessage()}
        isDeleting={isDeleting}
      />
    </>
  );
};