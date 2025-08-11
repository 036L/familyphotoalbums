import React, { useState } from 'react';
import { Settings, Bell, Shield, Palette, Type, Moon, Sun, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'accessibility' | 'account'>('notifications');
  const [settings, setSettings] = useState({
    notifications: {
      newPhotos: true,
      newComments: true,
      newMembers: true,
      weeklyDigest: false,
      emailNotifications: true,
      pushNotifications: true,
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      darkMode: false,
      reducedMotion: false,
    },
    privacy: {
      profileVisibility: 'family',
      allowInvitations: true,
      showOnlineStatus: true,
    }
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handleAccessibilityChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: value
      }
    }));
  };

  const handlePrivacyChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      // 設定をローカルストレージまたはサーバーに保存
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // 実際のアプリケーションでは、ここでAPIを呼び出して設定を保存
      console.log('設定を保存:', settings);
      
      onClose();
    } catch (error) {
      console.error('設定の保存に失敗:', error);
    }
  };

  const tabs = [
    { id: 'notifications', name: '通知', icon: Bell },
    { id: 'accessibility', name: 'アクセシビリティ', icon: Palette },
    { id: 'account', name: 'アカウント', icon: Shield },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl">
      <div className="flex h-[600px]">
        {/* サイドバー */}
        <div className="w-64 bg-gray-50 rounded-l-2xl p-4 border-r border-gray-200">
          <div className="flex items-center space-x-2 mb-6">
            <Settings size={24} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">設定</h2>
          </div>
          
          <nav className="space-y-2">
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-100 text-orange-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent size={20} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>

          {/* 通知設定 */}
          {activeTab === 'notifications' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">通知設定</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">写真とコメント</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'newPhotos', label: '新しい写真がアップロードされた時', description: '家族が新しい写真を追加した際に通知を受け取ります' },
                      { key: 'newComments', label: '新しいコメントが投稿された時', description: '写真にコメントが投稿された際に通知を受け取ります' },
                      { key: 'newMembers', label: '新しいメンバーが追加された時', description: '家族に新しいメンバーが追加された際に通知を受け取ります' },
                    ].map(item => (
                      <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="text-sm font-medium text-gray-900">{item.label}</label>
                          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                            onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">通知方法</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'emailNotifications', label: 'メール通知', description: 'メールアドレスに通知を送信します' },
                      { key: 'pushNotifications', label: 'プッシュ通知', description: 'ブラウザでプッシュ通知を表示します' },
                    ].map(item => (
                      <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="text-sm font-medium text-gray-900">{item.label}</label>
                          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                            onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* アクセシビリティ設定 */}
          {activeTab === 'accessibility' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">アクセシビリティ</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    文字サイズ
                  </label>
                  <div className="flex space-x-3">
                    {[
                      { value: 'small', label: '小' },
                      { value: 'medium', label: '中' },
                      { value: 'large', label: '大' },
                      { value: 'extra-large', label: '特大' },
                    ].map(size => (
                      <button
                        key={size.value}
                        onClick={() => handleAccessibilityChange('fontSize', size.value)}
                        className={`px-4 py-2 rounded-xl border-2 transition-colors ${
                          settings.accessibility.fontSize === size.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <Type size={size.value === 'small' ? 14 : size.value === 'large' ? 20 : size.value === 'extra-large' ? 24 : 16} />
                        <span className="block text-xs mt-1">{size.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: 'highContrast',
                      icon: Palette,
                      label: 'ハイコントラストモード',
                      description: '文字と背景のコントラストを高くして読みやすくします'
                    },
                    {
                      key: 'darkMode',
                      icon: Moon,
                      label: 'ダークモード',
                      description: '背景を黒系にして目の疲労を軽減します'
                    },
                    {
                      key: 'reducedMotion',
                      icon: Settings,
                      label: 'アニメーション軽減',
                      description: 'アニメーション効果を最小限に抑えます'
                    },
                  ].map(item => {
                    const IconComponent = item.icon;
                    return (
                      <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <IconComponent size={20} className="text-gray-600 mt-0.5" />
                          <div>
                            <label className="text-sm font-medium text-gray-900">{item.label}</label>
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.accessibility[item.key as keyof typeof settings.accessibility] as boolean}
                            onChange={(e) => handleAccessibilityChange(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* アカウント設定 */}
          {activeTab === 'account' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">アカウント設定</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    プロフィール公開範囲
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'family', label: '家族のみ', description: '家族メンバーのみがプロフィールを表示できます' },
                      { value: 'friends', label: '友人も含む', description: '招待された友人もプロフィールを表示できます' },
                      { value: 'public', label: '公開', description: '誰でもプロフィールを表示できます' },
                    ].map(option => (
                      <label key={option.value} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer">
                        <input
                          type="radio"
                          name="profileVisibility"
                          value={option.value}
                          checked={settings.privacy.profileVisibility === option.value}
                          onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                          className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{option.label}</span>
                          <p className="text-xs text-gray-600">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: 'allowInvitations',
                      label: '招待の受信を許可',
                      description: '他の家族から新しいアルバムへの招待を受け取ります'
                    },
                    {
                      key: 'showOnlineStatus',
                      label: 'オンライン状態を表示',
                      description: '他のメンバーにオンライン状態を表示します'
                    },
                  ].map(item => (
                    <div key={item.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <label className="text-sm font-medium text-gray-900">{item.label}</label>
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy[item.key as keyof typeof settings.privacy] as boolean}
                          onChange={(e) => handlePrivacyChange(item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 保存ボタン */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>
              設定を保存
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};