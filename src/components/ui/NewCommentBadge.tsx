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
      photo: 'min-w-5 h-5 text-xs px-2', // 少し大きく（タッチ対応）
      album: 'w-2 h-2'
    },
    md: {
      photo: 'min-w-6 h-6 text-sm px-2.5',
      album: 'w-2.5 h-2.5'
    },
    lg: {
      photo: 'min-w-7 h-7 text-base px-3',
      album: 'w-3 h-3'
    }
  };
// 配置スタイル（バリエーション別）
const positionStyles = {
  photo: 'absolute -top-2 -right-2', // 外側にはみ出し
  album: 'absolute top-2 right-2'    // 内側配置
};

// 基本スタイル（配置スタイルを分離）
const baseStyles = 'bg-red-500 text-white font-medium rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10';

// 最終的な className
const variantStyles = `${positionStyles[variant]} ${sizeStyles[size][variant]}`;

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
      
      {/* ピング効果用の追加要素（アルバムレベルのみ） */}
      {variant === 'album' && (
        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
      )}

      {displayContent}
    </div>
  );
};