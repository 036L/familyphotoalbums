// src/components/debug/RoleTestPanel.tsx
import React, { useState } from 'react';
import { User, Shield } from 'lucide-react';

interface RoleTestPanelProps {
  className?: string;
}

export const RoleTestPanel: React.FC<RoleTestPanelProps> = ({ className = '' }) => {
  const [currentRole, setCurrentRole] = useState<'admin' | 'editor' | 'viewer'>(() => {
    try {
      const profile = localStorage.getItem('demoProfile');
      if (profile) {
        return JSON.parse(profile).role || 'admin';
      }
    } catch (e) {
      console.error('プロフィール読み込みエラー:', e);
    }
    return 'admin';
  });

  const changeRole = (newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      const profileStr = localStorage.getItem('demoProfile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        profile.role = newRole;
        profile.updated_at = new Date().toISOString();
        localStorage.setItem('demoProfile', JSON.stringify(profile));
        setCurrentRole(newRole);
        
        // ページをリロードして権限を反映
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (e) {
      console.error('権限変更エラー:', e);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '管理者';
      case 'editor': return '編集者';
      case 'viewer': return '閲覧者';
      default: return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'すべての操作が可能';
      case 'editor': return 'アルバム・写真の作成・編集が可能';
      case 'viewer': return '閲覧・コメントのみ可能';
      default: return '';
    }
  };

  // 開発環境でのみ表示
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 left-6 z-50 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 max-w-xs ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Shield size={16} className="text-blue-500" />
        <h3 className="font-medium text-gray-900 text-sm">権限テスト</h3>
      </div>
      
      <div className="mb-3">
        <p className="text-xs text-gray-600">現在の権限:</p>
        <div className="flex items-center space-x-2 mt-1">
          <User size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-900">
            {getRoleLabel(currentRole)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {getRoleDescription(currentRole)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">権限を変更:</p>
        {(['admin', 'editor', 'viewer'] as const).map((role) => (
          <button
            key={role}
            onClick={() => changeRole(role)}
            disabled={currentRole === role}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
              currentRole === role
                ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">{getRoleLabel(role)}</div>
            <div className="text-gray-500">{getRoleDescription(role)}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          権限変更後、ページが自動リロードされます
        </p>
      </div>
    </div>
  );
};