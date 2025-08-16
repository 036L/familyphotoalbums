// src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes, forwardRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

// より厳密なProps型定義
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  // アクセシビリティ対応
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
}

// スタイル設定をより詳細に
const buttonVariants = {
  primary: {
    base: 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-lg hover:from-orange-500 hover:to-amber-500 hover:shadow-xl focus:ring-orange-300',
    disabled: 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed',
    loading: 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-lg cursor-not-allowed',
  },
  secondary: {
    base: 'bg-orange-100 text-orange-800 hover:bg-orange-200 focus:ring-orange-300',
    disabled: 'bg-gray-100 text-gray-400 cursor-not-allowed',
    loading: 'bg-orange-100 text-orange-800 cursor-not-allowed',
  },
  outline: {
    base: 'border-2 border-orange-300 text-orange-600 bg-white hover:bg-orange-50 hover:border-orange-400 focus:ring-orange-300',
    disabled: 'border-2 border-gray-200 text-gray-400 bg-white cursor-not-allowed',
    loading: 'border-2 border-orange-300 text-orange-600 bg-white cursor-not-allowed',
  },
  ghost: {
    base: 'text-orange-600 bg-transparent hover:bg-orange-50 focus:ring-orange-300',
    disabled: 'text-gray-400 bg-transparent cursor-not-allowed',
    loading: 'text-orange-600 bg-transparent cursor-not-allowed',
  },
  danger: {
    base: 'bg-red-500 text-white shadow-lg hover:bg-red-600 hover:shadow-xl focus:ring-red-300',
    disabled: 'bg-gray-300 text-gray-500 shadow-none cursor-not-allowed',
    loading: 'bg-red-500 text-white shadow-lg cursor-not-allowed',
  },
} as const;

const buttonSizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
} as const;

const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:transition-none select-none';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  type = 'button',
  onClick,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-expanded': ariaExpanded,
  'aria-pressed': ariaPressed,
  ...props
}, ref) => {
  // ボタンの状態を判定
  const buttonState = useMemo(() => {
    if (loading) return 'loading';
    if (disabled) return 'disabled';
    return 'normal';
  }, [loading, disabled]);

  // クラス名を計算（メモ化）
  const computedClassName = useMemo(() => {
    const variantStyles = buttonVariants[variant];
    const sizeStyles = buttonSizes[size];
    
    let variantClasses: string;
    switch (buttonState) {
      case 'loading':
        variantClasses = variantStyles.loading;
        break;
      case 'disabled':
        variantClasses = variantStyles.disabled;
        break;
      default:
        variantClasses = variantStyles.base;
    }

    const widthClasses = fullWidth ? 'w-full' : '';
    
    return [
      baseClasses,
      variantClasses,
      sizeStyles,
      widthClasses,
      className,
    ].filter(Boolean).join(' ');
  }, [variant, size, buttonState, fullWidth, className]);

  // クリックハンドラー（ローディング中やディセーブル中は無効化）
  const handleClick = useMemo(() => {
    if (loading || disabled) {
      return undefined;
    }
    return onClick;
  }, [loading, disabled, onClick]);

  // アクセシビリティ属性
  const accessibilityProps = useMemo(() => ({
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-pressed': ariaPressed,
    'aria-disabled': loading || disabled,
  }), [ariaLabel, ariaDescribedBy, ariaExpanded, ariaPressed, loading, disabled]);

  // ローディングアイコンのサイズを決定
  const loadingIconSize = useMemo(() => {
    const sizeMap = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
    };
    return sizeMap[size];
  }, [size]);

  // ボタンの内容を構築
  const buttonContent = useMemo(() => {
    if (loading) {
      return (
        <>
          <Loader2 
            size={loadingIconSize} 
            className="animate-spin mr-2" 
            aria-hidden="true"
          />
          {loadingText || children}
        </>
      );
    }

    return (
      <>
        {leftIcon && (
          <span className="mr-2 flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-2 flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    );
  }, [loading, loadingIconSize, loadingText, children, leftIcon, rightIcon]);

  return (
    <button
      ref={ref}
      type={type}
      className={computedClassName}
      disabled={disabled || loading}
      onClick={handleClick}
      {...accessibilityProps}
      {...props}
    >
      {buttonContent}
    </button>
  );
});

Button.displayName = 'Button';

// ボタングループコンポーネント
interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  className = '',
}) => {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  };

  const orientationClasses = orientation === 'horizontal' ? 'flex' : 'flex flex-col';

  return (
    <div className={`${orientationClasses} ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

// アイコンボタン専用コンポーネント
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string; // アイコンボタンではaria-labelを必須にする
  tooltip?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  tooltip,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}, ref) => {
  // アイコンボタンは正方形にする
  const squareClasses = useMemo(() => {
    const sizeMap = {
      xs: 'w-6 h-6 p-1',
      sm: 'w-8 h-8 p-1.5',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-3',
      xl: 'w-14 h-14 p-3.5',
    };
    return sizeMap[size];
  }, [size]);

  return (
    <Button
      ref={ref}
      variant={variant}
      className={`${squareClasses} ${className}`}
      title={tooltip}
      {...props}
    >
      {icon}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

// フローティングアクションボタン
interface FloatingActionButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'md' | 'lg' | 'xl';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  position = 'bottom-right',
  size = 'lg',
  className = '',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  const fabSizes = {
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  return (
    <Button
      variant="primary"
      className={`${positionClasses[position]} ${fabSizes[size]} rounded-full shadow-2xl hover:shadow-3xl z-50 ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
};

// ボタンのバリアント表示用のプレビューコンポーネント（開発時用）
export const ButtonShowcase: React.FC = () => {
  if (import.meta.env.PROD) return null;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold">Button Component Showcase</h1>
      
      {/* バリアント */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Variants</h2>
        <ButtonGroup spacing="md">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </ButtonGroup>
      </div>

      {/* サイズ */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Sizes</h2>
        <ButtonGroup spacing="md">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </ButtonGroup>
      </div>

      {/* 状態 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">States</h2>
        <ButtonGroup spacing="md">
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button loading loadingText="Uploading...">Custom Loading</Button>
          <Button disabled>Disabled</Button>
        </ButtonGroup>
      </div>

      {/* アイコン付き */}
      <div>
        <h2 className="text-lg font-semibold mb-4">With Icons</h2>
        <ButtonGroup spacing="md">
          <Button leftIcon={<span>←</span>}>Back</Button>
          <Button rightIcon={<span>→</span>}>Next</Button>
          <IconButton icon={<span>⚙</span>} aria-label="Settings" />
        </ButtonGroup>
      </div>

      {/* フル幅 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Full Width</h2>
        <Button fullWidth>Full Width Button</Button>
      </div>

      {/* フローティングアクションボタン */}
      <FloatingActionButton 
        icon={<span>+</span>} 
        aria-label="Add new item"
        position="bottom-right"
      />
    </div>
  );
};