import React, { useState } from 'react';
import { 
  Accessibility, 
  Type, 
  Eye, 
  Volume2, 
  Keyboard, 
  Moon, 
  Sun, 
  Palette,
  Settings,
  X,
  Check
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Button } from '../ui/Button';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateSettings, announceMessage } = useAccessibility();
  const [activeSection, setActiveSection] = useState<'visual' | 'audio' | 'interaction'>('visual');

  if (!isOpen) return null;

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    updateSettings({ fontSize: size });
    announceMessage(`文字サイズを${getFontSizeLabel(size)}に変更しました`);
  };

  const handleToggleSetting = (setting: keyof typeof settings, label: string) => {
    const newValue = !settings[setting];
    updateSettings({ [setting]: newValue });
    announceMessage(`${label}を${newValue ? '有効' : '無効'}にしました`);
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

  const resetToDefaults = () => {
    updateSettings({
      fontSize: 'medium',
      highContrast: false,
      darkMode: false,
      reducedMotion: false,
      announcements: true,
      keyboardNavigation: true,
    });
    announceMessage('アクセシビリティ設定をデフォルトに戻しました');
  };

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* アクセシビリティパネル */}
      <div 
        className="fixed right-4 top-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-describedby="accessibility-description"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Accessibility size={20} className="text-blue-600" />
            </div>
            <h2 id="accessibility-title" className="text-lg font-semibold text-gray-900">
              アクセシビリティ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors focus-ring"
            aria-label="アクセシビリティパネルを閉じる"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'visual', label: '視覚', icon: Eye },
            { id: 'audio', label: '音声', icon: Volume2 },
            { id: 'interaction', label: '操作', icon: Keyboard },
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors focus-ring ${
                  activeSection === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                aria-pressed={activeSection === tab.id}
              >
                <IconComponent size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-4">
          <p id="accessibility-description" className="text-sm text-gray-600 mb-4">
            アプリケーションをより使いやすくするための設定を調整できます
          </p>

          {/* 視覚設定 */}
          {activeSection === 'visual' && (
            <div className="space-y-6">
              {/* フォントサイズ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Type size={16} className="inline mr-2" />
                  文字サイズ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'small', label: '小', size: 12 },
                    { value: 'medium', label: '中', size: 16 },
                    { value: 'large', label: '大', size: 20 },
                    { value: 'extra-large', label: '特大', size: 24 },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleFontSizeChange(option.value as any)}
                      className={`p-3 rounded-xl border-2 transition-all focus-ring ${
                        settings.fontSize === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      aria-pressed={settings.fontSize === option.value}
                    >
                      <Type size={option.size} className="mx-auto mb-1" />
                      <span className="block text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* テーマ設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Palette size={16} className="inline mr-2" />
                  テーマ
                </label>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.highContrast}
                      onChange={() => handleToggleSetting('highContrast', 'ハイコントラストモード')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">ハイコントラスト</span>
                      <p className="text-xs text-gray-600">文字と背景のコントラストを高くします</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.darkMode}
                      onChange={() => handleToggleSetting('darkMode', 'ダークモード')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {settings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
                        <span className="text-sm font-medium text-gray-900">ダークモード</span>
                      </div>
                      <p className="text-xs text-gray-600">目の疲労を軽減する暗いテーマを使用します</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* アニメーション設定 */}
              <div>
                <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={() => handleToggleSetting('reducedMotion', 'アニメーション軽減')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">アニメーション軽減</span>
                    <p className="text-xs text-gray-600">動きによる不快感を軽減します</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* 音声設定 */}
          {activeSection === 'audio' && (
            <div className="space-y-6">
              <div>
                <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.announcements}
                    onChange={() => handleToggleSetting('announcements', '音声アナウンス')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <Volume2 size={16} />
                      <span className="text-sm font-medium text-gray-900">音声アナウンス</span>
                    </div>
                    <p className="text-xs text-gray-600">操作や変更をスクリーンリーダーでお知らせします</p>
                  </div>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">音声読み上げテスト</h4>
                <p className="text-xs text-blue-700 mb-3">
                  以下のボタンを押すと、音声アナウンス機能をテストできます
                </p>
                <Button
                  onClick={() => announceMessage('音声アナウンス機能が正常に動作しています', 'assertive')}
                  size="sm"
                  className="w-full"
                >
                  テスト音声を再生
                </Button>
              </div>
            </div>
          )}

          {/* 操作設定 */}
          {activeSection === 'interaction' && (
            <div className="space-y-6">
              <div>
                <label className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.keyboardNavigation}
                    onChange={() => handleToggleSetting('keyboardNavigation', 'キーボードナビゲーション')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <Keyboard size={16} />
                      <span className="text-sm font-medium text-gray-900">キーボードナビゲーション</span>
                    </div>
                    <p className="text-xs text-gray-600">Tabキーでの操作時にフォーカスを分かりやすく表示します</p>
                  </div>
                </label>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">キーボードショートカット</h4>
                <div className="space-y-2 text-xs text-green-800">
                  <div className="flex justify-between">
                    <span>Tab</span>
                    <span>次の要素に移動</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shift + Tab</span>
                    <span>前の要素に移動</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enter / Space</span>
                    <span>ボタンを押す</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escape</span>
                    <span>モーダルを閉じる</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>現在の設定を保存しています</span>
            <Check size={14} className="text-green-500" />
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={resetToDefaults}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Settings size={14} className="mr-1" />
              リセット
            </Button>
            <Button
              onClick={onClose}
              size="sm"
              className="flex-1"
            >
              完了
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            設定は自動的に保存されます
          </p>
        </div>
      </div>
    </>
  );
};