import React from 'react';
import { 
  Accessibility, 
  Type, 
  Palette,
  Settings,
  X,
  Check,
  Moon,
  Sun
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

  if (!isOpen) return null;

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large' | 'extra-large'): void => {
    updateSettings({ fontSize: size });
    announceMessage(`文字サイズを${getFontSizeLabel(size)}に変更しました`);
  };

  const handleToggleSetting = (setting: keyof typeof settings, label: string): void => {
    const newValue = !settings[setting];
    updateSettings({ [setting]: newValue });
    announceMessage(`${label}を${newValue ? '有効' : '無効'}にしました`);
  };

  const getFontSizeLabel = (size: string): string => {
    const labelMap: Record<string, string> = {
      small: '小',
      medium: '中',
      large: '大',
      'extra-large': '特大'
    };
    return labelMap[size] || '中';
  };

  const resetToDefaults = (): void => {
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
            type="button"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-4">
          <p id="accessibility-description" className="text-sm text-gray-600 mb-6">
            アプリケーションをより使いやすくするための設定を調整できます
          </p>

          <div className="space-y-6">
            {/* フォントサイズ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Type size={16} className="inline mr-2" />
                文字サイズ
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'small', label: '小', demo: 'Aa' },
                  { value: 'medium', label: '中', demo: 'Aa' },
                  { value: 'large', label: '大', demo: 'Aa' },
                  { value: 'extra-large', label: '特大', demo: 'Aa' },
                ] as const).map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFontSizeChange(option.value)}
                    className={`p-3 rounded-xl border-2 transition-all focus-ring flex flex-col items-center ${
                      settings.fontSize === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    aria-pressed={settings.fontSize === option.value}
                    type="button"
                  >
                    <span 
                      className={`font-bold mb-1 ${
                        option.value === 'small' ? 'text-sm' :
                        option.value === 'medium' ? 'text-base' :
                        option.value === 'large' ? 'text-lg' : 'text-xl'
                      }`}
                    >
                      {option.demo}
                    </span>
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* テーマ設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Palette size={16} className="inline mr-2" />
                表示設定
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
                    <p className="text-xs text-gray-600 mt-1">文字と背景のコントラストを高くします</p>
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
                    <p className="text-xs text-gray-600 mt-1">目の疲労を軽減する暗いテーマを使用します</p>
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
                  <p className="text-xs text-gray-600 mt-1">動きによる不快感を軽減します</p>
                </div>
              </label>
            </div>

            {/* プレビューエリア */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">プレビュー</h4>
              <div className="space-y-2">
                <p className="text-gray-800">これは通常のテキストです。</p>
                <p className="text-sm text-gray-600">これは小さいテキストです。</p>
                <button className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">
                  ボタンの例
                </button>
              </div>
            </div>
          </div>
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