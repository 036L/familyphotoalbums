// src/components/ui/Modal.tsx - 修正版
import React, { ReactNode, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  // アクセシビリティ
  'aria-label'?: string;
  'aria-describedby'?: string;
  // モーダルの動作オプション
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef<string>('');

  // デバッグログ（開発時のみ）
  const debugLog = useCallback((message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[Modal] ${message}`, data);
    }
  }, []);

  // モーダルを閉じる処理
  const handleClose = useCallback(() => {
    debugLog('モーダルを閉じる');
    onClose();
  }, [onClose, debugLog]);

  // body のスクロールを制御
  useEffect(() => {
    if (isOpen) {
      // アクティブな要素を記憶
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // 現在のoverflowスタイルを保存
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      debugLog('モーダルオープン - スクロール無効化');
      
      // モーダルにフォーカスを移動
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else {
      // 以前のoverflowスタイルを復元
      document.body.style.overflow = previousOverflow.current;
      
      // フォーカスを元の要素に戻す
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      
      debugLog('モーダルクローズ - スクロール復元');
    }

    // クリーンアップ関数でoverflowを復元
    return () => {
      if (previousOverflow.current !== undefined) {
        document.body.style.overflow = previousOverflow.current;
      }
    };
  }, [isOpen, debugLog]);

  // Escキーでモーダルを閉じる
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        debugLog('Escキーでモーダルを閉じる');
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, handleClose, debugLog]);

  // フォーカストラップ
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const focusableArray = Array.from(focusableElements) as HTMLElement[];
      
      if (focusableArray.length === 0) return;

      const firstElement = focusableArray[0];
      const lastElement = focusableArray[focusableArray.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // 背景クリックでモーダルを閉じる
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdropClick) return;
    
    if (e.target === e.currentTarget) {
      debugLog('背景クリックでモーダルを閉じる');
      handleClose();
    }
  }, [closeOnBackdropClick, handleClose, debugLog]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {/* 背景オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />
      
      {/* モーダルコンテンツ */}
      <div 
        ref={modalRef}
        className={`relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto transform transition-all duration-300 scale-100 opacity-100 ${className}`}
        onClick={(e) => e.stopPropagation()} // バブリングを防ぐ
        tabIndex={-1}
        role="document"
      >
        {/* 閉じるボタン */}
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300"
            aria-label="モーダルを閉じる"
            type="button"
          >
            <X size={20} className="text-gray-600" />
          </button>
        )}
        
        {children}
      </div>
    </div>
  );
};