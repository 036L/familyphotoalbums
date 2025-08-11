import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  darkMode: boolean;
  reducedMotion: boolean;
  announcements: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  getFontSizeClass: () => string;
  getContrastClass: () => string;
  getMotionClass: () => string;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  darkMode: false,
  reducedMotion: false,
  announcements: true,
  keyboardNavigation: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [announcer, setAnnouncer] = useState<HTMLDivElement | null>(null);

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('アクセシビリティ設定の読み込みエラー:', error);
      }
    }

    // システムの設定を確認
    checkSystemPreferences();
    
    // スクリーンリーダー用のアナウンス要素を作成
    createAnnouncer();
  }, []);

  // 設定が変更されたときにローカルストレージに保存とCSS適用
  useEffect(() => {
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    applySettings();
  }, [settings]);

  const checkSystemPreferences = () => {
    // ダークモードの検出
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings(prev => ({ ...prev, darkMode: true }));
    }

    // モーション軽減の検出
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }

    // 高コントラストの検出
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }
  };

  const createAnnouncer = () => {
    // スクリーンリーダー用の非視覚的なアナウンス要素を作成
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.style.position = 'absolute';
    announcerElement.style.left = '-10000px';
    announcerElement.style.width = '1px';
    announcerElement.style.height = '1px';
    announcerElement.style.overflow = 'hidden';
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);
  };

  const applySettings = () => {
    const root = document.documentElement;
    
    // フォントサイズの適用
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
    root.classList.add(`text-${settings.fontSize}`);
    
    // 高コントラストの適用
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // ダークモードの適用
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // モーション軽減の適用
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // キーボードナビゲーションの適用
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  };

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // 重要な変更をアナウンス
    if (newSettings.fontSize) {
      announceMessage(`文字サイズを${getFontSizeLabel(newSettings.fontSize)}に変更しました`);
    }
    if (newSettings.highContrast !== undefined) {
      announceMessage(`ハイコントラストモードを${newSettings.highContrast ? '有効' : '無効'}にしました`);
    }
    if (newSettings.darkMode !== undefined) {
      announceMessage(`ダークモードを${newSettings.darkMode ? '有効' : '無効'}にしました`);
    }
  };

  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements || !announcer) return;
    
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';
    
    // わずかな遅延でメッセージを設定（スクリーンリーダーが確実に読み上げるため）
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // メッセージをクリア
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  };

  const getFontSizeClass = (): string => {
    const sizeMap = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      'extra-large': 'text-xl'
    };
    return sizeMap[settings.fontSize];
  };

  const getContrastClass = (): string => {
    return settings.highContrast ? 'high-contrast' : '';
  };

  const getMotionClass = (): string => {
    return settings.reducedMotion ? 'motion-reduced' : '';
  };

  const getFontSizeLabel = (size: string): string => {
    const labelMap = {
      small: '小',
      medium: '中',
      large: '大',
      'extra-large': '特大'
    };
    return labelMap[size as keyof typeof labelMap] || '中';
  };

  // キーボードナビゲーションの監視
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!settings.keyboardNavigation) return;

      // Tabキーが押されたときにキーボードナビゲーションを有効化
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    };

    const handleMouseDown = () => {
      if (!settings.keyboardNavigation) return;
      // マウスが使われたときにキーボードナビゲーションを一時的に無効化
      document.body.classList.remove('keyboard-user');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [settings.keyboardNavigation]);

  // ページ変更時のアナウンス
  useEffect(() => {
    const handleLocationChange = () => {
      if (settings.announcements) {
        const title = document.title || 'ページが変更されました';
        announceMessage(`${title}に移動しました`);
      }
    };

    // History API の監視
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [settings.announcements]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        announceMessage,
        getFontSizeClass,
        getContrastClass,
        getMotionClass,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};