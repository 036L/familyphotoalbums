// src/components/debug/RoleDebugTools.tsx
import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export const RoleDebugTools: React.FC = () => {
  const { profile, user, updateProfile } = useApp();

  // 開発環境でのみ表示
  if (import.meta.env.PROD) {
    return null;
  }

  const fixAdminRole = async () => {
    try {
      console.log('[RoleDebug] 管理者ロール修正開始');
      
      // ローカルストレージから直接修正
      const currentProfile = localStorage.getItem('demoProfile');
      if (currentProfile) {
        const profile = JSON.parse(currentProfile);
        profile.role = 'admin';
        profile.updated_at = new Date().toISOString();
        localStorage.setItem('demoProfile', JSON.stringify(profile));
        console.log('[RoleDebug] ローカルストレージ修正完了:', profile);
      }
      
      // プロフィール更新
      await updateProfile({ role: 'admin' });
      
      console.log('[RoleDebug] プロフィール更新完了');
      
      // ページリロードして反映
      window.location.reload();
    } catch (error) {
      console.error('[RoleDebug] 修正エラー:', error);
    }
  };

  const logCurrentState = () => {
    console.group('=== 現在のロール状態 ===');
    console.log('Profile:', profile);
    console.log('User:', user);
    console.log('Profile Role:', profile?.role);
    console.log('User Metadata Role:', user?.user_metadata?.role);
    console.log('App Metadata Role:', user?.app_metadata?.role);
    console.log('LocalStorage Profile:', JSON.parse(localStorage.getItem('demoProfile') || '{}'));
    console.groupEnd();
  };

  const clearAndReset = () => {
    console.log('[RoleDebug] デモデータリセット');
    localStorage.removeItem('demoAuth');
    localStorage.removeItem('demoProfile');
    localStorage.removeItem('demoInitialized');
    window.location.reload();
  };

  return (
    <div className="fixed top-20 right-6 z-50 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg">
      <h3 className="text-sm font-bold text-yellow-800 mb-3">ロールデバッグツール</h3>
      
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2 text-yellow-700">
          <span>プロフィールロール:</span>
          <span className="font-mono">{profile?.role || 'なし'}</span>
          <span>ユーザーロール:</span>
          <span className="font-mono">{user?.user_metadata?.role || 'なし'}</span>
        </div>
        
        <div className="border-t border-yellow-300 pt-2 space-y-1">
          <Button
            onClick={fixAdminRole}
            size="sm"
            className="w-full text-xs bg-red-500 hover:bg-red-600"
          >
            管理者ロールに強制修正
          </Button>
          
          <Button
            onClick={logCurrentState}
            size="sm"
            variant="outline"
            className="w-full text-xs"
          >
            状態をコンソール出力
          </Button>
          
          <Button
            onClick={clearAndReset}
            size="sm"
            variant="outline"
            className="w-full text-xs border-red-400 text-red-600"
          >
            リセット
          </Button>
        </div>
      </div>
    </div>
  );
};