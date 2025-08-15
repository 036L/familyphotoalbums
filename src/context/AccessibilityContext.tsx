// src/context/AccessibilityContext.tsx
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

  // CSSクラスを適用する処理をメモ化
  const applySettings = useCallback((settingsToApply: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // フォントサイズの適用
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
    root.classList.add(`text-${settingsToApply.fontSize}`);
    
    // 高コントラストの適用
    root.classList.toggle('high-contrast', settingsToApply.highContrast);
    
    // ダークモードの適用
    root.classList.toggle('dark', settingsToApply.darkMode);
    
    // モーション軽減の適用
    root.classList.toggle('reduced-motion', settingsToApply.reducedMotion);

    // キーボードナビゲーションの適用
    root.classList.toggle('keyboard-navigation', settingsToApply.keyboardNavigation);
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

  // 設定更新処理（最適化）
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

  // 音声アナウンス機能（最適化）
  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announcements || !announcer) return;
    
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';
    
    // わずかな遅延でメッセージを設定（スクリーンリーダーが確実に読み上げるため）
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

  // キーボードナビゲーションの監視（最適化）
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

  // ページ変更時のアナウンス（最適化）
  useEffect(() => {
    if (!settings.announcements) return;

    const handleLocationChange = () => {
      const title = document.title || 'ページが変更されました';
      announceMessage(`${title}に移動しました`);
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
  }, [settings.announcements, announceMessage]);

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