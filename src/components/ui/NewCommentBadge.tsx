// src/components/ui/NewCommentBadge.tsx - 開発ガイドライン準拠版
import React from 'react';
import type { NewCommentBadgeProps } from '../../types/core';

/**
 * 新着コメント通知バッジコンポーネント
 * 写真レベル: 新着コメント数を数字で表示
 * アルバムレベル: 新着の有無をドットで表示
 */
export const NewCommentBadge: React.FC<NewCommentBadgeProps> = ({
  count = 0,
  hasNew = false,
  variant,
  size = 'md',
  className = '',
  ariaLabel,
  onClick,
}) => {
  // 表示条件チェック
  const shouldShow = variant === 'photo' ? count > 0 : hasNew;
  
  if (!shouldShow) {
    return null;
  }

  // サイズ別スタイル
  const sizeStyles = {
    sm: {
      photo: 'min-w-4 h-4 text-[10px] px-1.5',
      album: 'w-2 h-2'
    },
    md: {
      photo: 'min-w-5 h-5 text-xs px-2',
      album: 'w-2.5 h-2.5'
    },
    lg: {
      photo: 'min-w-6 h-6 text-sm px-2.5',
      album: 'w-3 h-3'
    }
  };

  // 基本スタイル
  const baseStyles = 'absolute -top-1 -right-1 bg-red-500 text-white font-medium rounded-full flex items-center justify-center shadow-lg transition-all duration-200';
  
  // バリエーション別スタイル
  const variantStyles = variant === 'photo' 
    ? `${sizeStyles[size].photo} animate-pulse` // 写真: 数字表示 + パルス
    : `${sizeStyles[size].album} animate-ping`; // アルバム: ドット表示 + ピング

  // ホバー効果
  const hoverStyles = onClick 
    ? 'cursor-pointer hover:bg-red-600 hover:scale-110' 
    : '';

  // アクセシビリティ
  const accessibilityProps = {
    role: 'status',
    'aria-live': 'polite' as const,
    'aria-label': ariaLabel || (
      variant === 'photo' 
        ? `新着コメント${count}件` 
        : '新着コメントあり'
    ),
  };

  // 表示コンテンツ
  const displayContent = variant === 'photo' 
    ? (count > 99 ? '99+' : count.toString())
    : null;

  return (
    <div
      className={`${baseStyles} ${variantStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...accessibilityProps}
    >
      {displayContent}
      
      {/* ピング効果用の追加要素（アルバムレベルのみ） */}
      {variant === 'album' && (
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
      )}
    </div>
  );
};