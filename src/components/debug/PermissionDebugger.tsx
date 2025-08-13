// src/components/debug/PermissionDebugger.tsx
import React from 'react';
import { Eye } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useApp } from '../../context/AppContext';

interface PermissionDebuggerProps {
  className?: string;
}

export const PermissionDebugger: React.FC<PermissionDebuggerProps> = ({ className = '' }) => {
  const { profile, user } = useApp();
  const { 
    userRole, 
    permissions, 
    hasPermission,
    getPermissionInfo,
    debugPermissions 
  } = usePermissions();

  // 開発環境でのみ表示
  if (import.meta.env.PROD) {
    return null;
  }

  const permissionInfo = getPermissionInfo();

  React.useEffect(() => {
    debugPermissions();
  }, [debugPermissions, userRole]);

  return (
    <div className={`fixed top-6 left-6 z-50 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-xs ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Eye size={14} className="text-green-400" />
        <h4 className="font-bold text-green-400">権限デバッグ情報</h4>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong className="text-yellow-400">ユーザー情報:</strong>
          <div className="ml-2 text-gray-300">
            <div>ID: {user?.id || profile?.id || 'なし'}</div>
            <div>名前: {profile?.name || 'なし'}</div>
            <div>ロール: {userRole}</div>
          </div>
        </div>
        
        <div>
          <strong className="text-yellow-400">権限チェック:</strong>
          <div className="ml-2 text-gray-300">
            <div>アルバム作成: {hasPermission('album.create') ? '✅' : '❌'}</div>
            <div>アルバム削除: {hasPermission('album.delete') ? '✅' : '❌'}</div>
            <div>写真アップロード: {hasPermission('photo.upload') ? '✅' : '❌'}</div>
            <div>写真削除: {hasPermission('photo.delete') ? '✅' : '❌'}</div>
            <div>招待機能: {hasPermission('invite.create') ? '✅' : '❌'}</div>
          </div>
        </div>
        
        <div>
          <strong className="text-yellow-400">権限一覧:</strong>
          <div className="ml-2 text-gray-300 max-h-32 overflow-y-auto">
            {permissions.map(permission => (
              <div key={permission} className="text-xs">• {permission}</div>
            ))}
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-700">
          <button
            onClick={() => {
              console.log('=== 権限デバッグ情報 ===');
              console.log('Profile:', profile);
              console.log('User:', user);
              console.log('Role:', userRole);
              console.log('Permissions:', permissions);
              console.log('Permission Info:', permissionInfo);
            }}
            className="text-blue-400 hover:text-blue-300 underline text-xs"
          >
            コンソールに詳細出力
          </button>
        </div>
      </div>
    </div>
  );
};