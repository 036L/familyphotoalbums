// src/context/AccessibilityContext.tsx - 改善版
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { AccessibilitySettings } from '../types/core';

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

  // ローカルストレージから設定を読み込む処理をメモ化
  const loadSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem('accessibilitySettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('アクセシビリティ設定の読み込みエラー:', error);
    }
    return defaultSettings;
  }, []);

  // システム設定をチェックする処理をメモ化
  const checkSystemPreferences = useCallback(() => {
    const preferences: Partial<AccessibilitySettings> = {};

    // ダークモードの検出
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      preferences.darkMode = true;
    }

    // モーション軽減の検出
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      preferences.reducedMotion = true;
    }

    // 高コントラストの検出
    if (window.matchMedia?.('(prefers-contrast: high)').matches) {
      preferences.highContrast = true;
    }

    return preferences;
  }, []);

  // スクリーンリーダー用のアナウンス要素を作成
  const createAnnouncer = useCallback(() => {
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.style.position = 'absolute';
    announcerElement.style.left = '-10000px';
    announcerElement.style.width = '1px';
    announcerElement.style.height = '1px';
    announcerElement.style.overflow = 'hidden';
    document.body.appendChild(announcerElement);
    return announcerElement;
  }, []);

  // CSSスタイルの動的適用（Tailwindクラスを上書き）
  const applySettings = useCallback((settingsToApply: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // 既存のスタイル要素を削除
    const existingStyle = document.getElementById('accessibility-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 新しいスタイル要素を作成
    const style = document.createElement('style');
    style.id = 'accessibility-styles';
    
    let css = '';

    // フォントサイズの動的CSS生成
    const fontSizeMap = {
      small: { base: '14px', sm: '12px', lg: '16px', xl: '18px', '2xl': '20px', '3xl': '24px' },
      medium: { base: '16px', sm: '14px', lg: '18px', xl: '20px', '2xl': '24px', '3xl': '30px' },
      large: { base: '18px', sm: '16px', lg: '20px', xl: '24px', '2xl': '28px', '3xl': '36px' },
      'extra-large': { base: '20px', sm: '18px', lg: '24px', xl: '28px', '2xl': '32px', '3xl': '42px' }
    };

    const fontSizes = fontSizeMap[settingsToApply.fontSize];
    css += `
      .text-xs { font-size: ${fontSizes.sm} !important; }
      .text-sm { font-size: ${fontSizes.sm} !important; }
      .text-base { font-size: ${fontSizes.base} !important; }
      .text-lg { font-size: ${fontSizes.lg} !important; }
      .text-xl { font-size: ${fontSizes.xl} !important; }
      .text-2xl { font-size: ${fontSizes['2xl']} !important; }
      .text-3xl { font-size: ${fontSizes['3xl']} !important; }
      body { font-size: ${fontSizes.base} !important; }
    `;

    // ハイコントラストモード
if (settingsToApply.highContrast) {
  css += `
    body { 
      background: #ffffff !important; 
      color: #000000 !important; 
      min-height: 100vh !important;
    }
    .bg-gradient-to-br { 
      background: #ffffff !important; 
    }
    .from-orange-50, .to-amber-50 { background: transparent !important; }
    .bg-white { background-color: #ffffff !important; }
    .bg-gray-50, .bg-gray-100 { background-color: #ffffff !important; }
    .text-gray-900, .text-gray-800, .text-gray-700, .text-gray-600 { 
      color: #000000 !important; 
    }
    .text-gray-500, .text-gray-400 { color: #333333 !important; }
    .border-gray-200, .border-gray-300, .border-gray-100 { 
      border-color: #000000 !important; 
    }
    .bg-orange-50, .bg-orange-100 { 
      background-color: #ffffff !important; 
      border: 2px solid #000000 !important; 
    }
    .text-orange-600, .text-orange-700, .text-orange-500 { 
      color: #000000 !important; 
    }
    .shadow-lg, .shadow-md, .shadow-xl, .shadow-2xl { 
      box-shadow: 0 0 0 2px #000000 !important; 
    }
    .bg-blue-50, .bg-blue-100 { 
      background-color: #ffffff !important; 
      border: 2px solid #000000 !important; 
    }
    .text-blue-600, .text-blue-700 { 
      color: #000000 !important; 
    }
    /* ホバー時の可読性確保 */
    .hover\\:bg-gray-50:hover, .hover\\:bg-gray-100:hover { 
      background-color: #f0f0f0 !important; 
      color: #000000 !important; 
    }
    .hover\\:text-gray-900:hover { 
      color: #000000 !important; 
    }
    .hover\\:bg-blue-50:hover { 
      background-color: #e6e6e6 !important; 
      color: #000000 !important; 
    }
    .hover\\:border-blue-300:hover { 
      border-color: #000000 !important; 
    }
    /* 選択状態のボタン */
    .border-blue-500 { 
      border-color: #000000 !important; 
    }
    .bg-blue-50 { 
      background-color: #e6e6e6 !important; 
      color: #000000 !important; 
    }
    .text-blue-700 { 
      color: #000000 !important; 
    }
  `;
}

    // ダークモード
if (settingsToApply.darkMode && !settingsToApply.highContrast) {
  css += `
    body { 
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important; 
      color: #ffffff !important; 
      min-height: 100vh !important;
    }
    .bg-gradient-to-br { 
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important; 
    }
    .from-orange-50 { background: transparent !important; }
    .to-amber-50 { background: transparent !important; }
    .bg-white { background-color: #1e1e1e !important; }
    .bg-gray-50 { background-color: #2d2d2d !important; }
    .bg-gray-100 { background-color: #2d2d2d !important; }
    .text-gray-900 { color: #ffffff !important; }
    .text-gray-600, .text-gray-700, .text-gray-800 { color: #b3b3b3 !important; }
    .text-gray-500, .text-gray-400 { color: #8c8c8c !important; }
    .border-gray-200, .border-gray-300, .border-gray-100 { 
      border-color: #404040 !important; 
    }
    .bg-orange-50 { background-color: rgba(255, 107, 53, 0.1) !important; }
    .bg-orange-100 { background-color: rgba(255, 107, 53, 0.2) !important; }
    .shadow-lg, .shadow-md, .shadow-xl, .shadow-2xl { 
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important; 
    }
    .bg-blue-50 { background-color: rgba(59, 130, 246, 0.1) !important; }
    .bg-blue-100 { background-color: rgba(59, 130, 246, 0.2) !important; }
    .hover\\:bg-gray-50:hover, .hover\\:bg-gray-100:hover { 
      background-color: #404040 !important; 
      color: #ffffff !important; 
    }
    .hover\\:text-gray-900:hover { 
      color: #ffffff !important; 
    }
    .hover\\:bg-white:hover { 
      background-color: #2d2d2d !important; 
      color: #ffffff !important; 
    }
    /* 文字サイズボタンのホバー修正 */
    .hover\\:bg-blue-50:hover { 
      background-color: #1e3a8a !important; 
      color: #ffffff !important; 
    }
    .hover\\:border-blue-300:hover { 
      border-color: #60a5fa !important; 
    }
    /* 選択状態のボタンもダークモード対応 */
    .bg-blue-50 { 
      background-color: #1e40af !important; 
      color: #ffffff !important; 
    }
    .border-blue-500 { 
      border-color: #3b82f6 !important; 
    }
    .text-blue-700 { 
      color: #ffffff !important; 
    }
  `;
}

    // モーション軽減
    if (settingsToApply.reducedMotion) {
      css += `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        .animate-pulse, .animate-spin { animation: none !important; }
        .hover\\:scale-105:hover, .hover\\:scale-\\[1\\.02\\]:hover { 
          transform: none !important; 
        }
      `;
    }

    // キーボードナビゲーション
    if (settingsToApply.keyboardNavigation) {
      css += `
        .keyboard-user *:focus {
          outline: 3px solid #2563eb !important;
          outline-offset: 2px !important;
        }
      `;
    }

    style.textContent = css;
    document.head.appendChild(style);

    // bodyクラスの設定と追加のスタイル適用
    root.classList.toggle('high-contrast', settingsToApply.highContrast);
    root.classList.toggle('dark', settingsToApply.darkMode);
    root.classList.toggle('reduced-motion', settingsToApply.reducedMotion);
    root.classList.toggle('keyboard-navigation', settingsToApply.keyboardNavigation);

    // 確実に背景を変更するため、直接bodyにスタイルを適用
if (settingsToApply.highContrast) {
  document.body.style.background = '#ffffff';
  document.body.style.color = '#000000';
  document.body.style.minHeight = '100vh';
} else if (settingsToApply.darkMode) {
  document.body.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
  document.body.style.minHeight = '100vh';
} else {
  document.body.style.background = '';
  document.body.style.minHeight = '';
}

    console.log('アクセシビリティスタイル適用:', settingsToApply);
  }, []);

  // 初期化処理
  useEffect(() => {
    const initialSettings = loadSettings();
    const systemPreferences = checkSystemPreferences();
    const mergedSettings = { ...initialSettings, ...systemPreferences };
    
    setSettings(mergedSettings);
    applySettings(mergedSettings);
    
    // アナウンス要素を作成
    const announcerElement = createAnnouncer();
    setAnnouncer(announcerElement);

    // クリーンアップ
    return () => {
      if (announcerElement?.parentNode) {
        announcerElement.parentNode.removeChild(announcerElement);
      }
    };
  }, [loadSettings, checkSystemPreferences, createAnnouncer, applySettings]);

  // 設定更新処理
  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      
      // ローカルストレージに保存
      try {
        localStorage.setItem('accessibilitySettings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('アクセシビリティ設定の保存エラー:', error);
      }
      
      // CSS適用
      applySettings(updatedSettings);
      
      return updatedSettings;
    });
  }, [applySettings]);

  // 音声アナウンス機能
  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements || !announcer) return;
    
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';
    
    // わずかな遅延でメッセージを設定
    const setMessageTimer = setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // メッセージをクリア
    const clearMessageTimer = setTimeout(() => {
      announcer.textContent = '';
    }, 1000);

    return () => {
      clearTimeout(setMessageTimer);
      clearTimeout(clearMessageTimer);
    };
  }, [settings.announcements, announcer]);

  // メモ化されたヘルパー関数
  const getFontSizeClass = useCallback((): string => {
    const sizeMap = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      'extra-large': 'text-xl'
    };
    return sizeMap[settings.fontSize];
  }, [settings.fontSize]);

  const getContrastClass = useCallback((): string => {
    return settings.highContrast ? 'high-contrast' : '';
  }, [settings.highContrast]);

  const getMotionClass = useCallback((): string => {
    return settings.reducedMotion ? 'motion-reduced' : '';
  }, [settings.reducedMotion]);

  // キーボードナビゲーションの監視
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-user');
    };

    document.addEventListener('keydown', handleKeyDown, { passive: true });
    document.addEventListener('mousedown', handleMouseDown, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [settings.keyboardNavigation]);

  // メモ化されたコンテキスト値
  const contextValue = useMemo(() => ({
    settings,
    updateSettings,
    announceMessage,
    getFontSizeClass,
    getContrastClass,
    getMotionClass,
  }), [
    settings,
    updateSettings,
    announceMessage,
    getFontSizeClass,
    getContrastClass,
    getMotionClass,
  ]);

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};