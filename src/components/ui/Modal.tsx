// src/components/ui/Modal.tsx
import React, { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousOverflow = useRef<string>('');

  useEffect(() => {
    if (isOpen) {
      // 現在のoverflowスタイルを保存
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      // 以前のoverflowスタイルを復元
      document.body.style.overflow = previousOverflow.current;
    }

    // クリーンアップ関数でoverflowを復元
    return () => {
      if (previousOverflow.current !== undefined) {
        document.body.style.overflow = previousOverflow.current;
      }
    };
  }, [isOpen]);

  // Escキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      <div 
        ref={modalRef}
        className={`relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto ${className}`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="モーダルを閉じる"
        >
          <X size={20} className="text-gray-600" />
        </button>
        {children}
      </div>
    </div>
  );
};