import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/core';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  role?: 'admin' | 'editor' | 'viewer';
  roles?: ('admin' | 'editor' | 'viewer')[];
  fallback?: ReactNode;
  resource?: {
    createdBy?: string;
    uploadedBy?: string;
    userId?: string;
  };
  action?: 'view' | 'edit' | 'delete';
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = true,
  role,
  roles,
  fallback = null,
  resource,
  action = 'view',
}) => {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canEditResource,
    canDeleteResource,
    userRole,
  } = usePermissions();

  // ロールベースのチェック
  if (role && userRole !== role) {
    return <>{fallback}</>;
  }

  if (roles && !roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // 権限ベースのチェック
  if (permission) {
    // リソース固有のアクションチェック
    if (resource && (action === 'edit' || action === 'delete')) {
      const canPerformAction = action === 'edit' 
        ? canEditResource(permission, resource)
        : canDeleteResource(permission, resource);
      
      if (!canPerformAction) {
        return <>{fallback}</>;
      }
    } else if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
  }

  if (permissions) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// より具体的なガードコンポーネント

// アルバム関連のガード
interface AlbumGuardProps {
  children: ReactNode;
  album?: {
    created_by?: string;
    is_public?: boolean;
  };
  action: 'view' | 'edit' | 'delete' | 'create';
  fallback?: ReactNode;
}

export const AlbumGuard: React.FC<AlbumGuardProps> = ({
  children,
  album,
  action,
  fallback = null,
}) => {
  const { canManageAlbum, hasPermission } = usePermissions();

  let hasAccess = false;

  switch (action) {
    case 'view':
      hasAccess = hasPermission('album.view');
      break;
    case 'create':
      hasAccess = hasPermission('album.create');
      break;
    case 'edit':
      hasAccess = album ? canManageAlbum(album) : hasPermission('album.edit');
      break;
    case 'delete':
      hasAccess = album ? canManageAlbum(album) : hasPermission('album.delete');
      break;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// 写真関連のガード
interface PhotoGuardProps {
  children: ReactNode;
  photo?: {
    uploaded_by?: string;
  };
  action: 'view' | 'upload' | 'edit' | 'delete';
  fallback?: ReactNode;
}

export const PhotoGuard: React.FC<PhotoGuardProps> = ({
  children,
  photo,
  action,
  fallback = null,
}) => {
  const basePermissions = {
    view: 'photo.view' as Permission,
    upload: 'photo.upload' as Permission,
    edit: 'photo.edit' as Permission,
    delete: 'photo.delete' as Permission,
  };

  const permission = basePermissions[action];
  const resource = photo ? { uploadedBy: photo.uploaded_by } : undefined;

  return (
    <PermissionGuard
      permission={permission}
      resource={resource}
      action={action === 'upload' ? 'view' : action}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
};

// コメント関連のガード
interface CommentGuardProps {
  children: ReactNode;
  comment?: {
    user_id?: string;
  };
  action: 'view' | 'create' | 'edit' | 'delete';
  fallback?: ReactNode;
}

export const CommentGuard: React.FC<CommentGuardProps> = ({
  children,
  comment,
  action,
  fallback = null,
}) => {
  const { canManageComment, hasPermission } = usePermissions();

  let hasAccess = false;

  switch (action) {
    case 'view':
      hasAccess = hasPermission('comment.view');
      break;
    case 'create':
      hasAccess = hasPermission('comment.create');
      break;
    case 'edit':
    case 'delete':
      hasAccess = comment ? canManageComment(comment) : false;
      break;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// 招待関連のガード
export const InviteGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => {
  const { canInviteMembers } = usePermissions();
  return canInviteMembers() ? <>{children}</> : <>{fallback}</>;
};

// 管理者専用のガード
export const AdminGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <PermissionGuard role="admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
};

// 編集者以上のガード
export const EditorGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback = null,
}) => {
  return (
    <PermissionGuard roles={['admin', 'editor']} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
};

// デバッグ用：権限情報表示コンポーネント
export const PermissionDebugger: React.FC = () => {
  const { getPermissionInfo, debugPermissions } = usePermissions();
  const info = getPermissionInfo();

  React.useEffect(() => {
    debugPermissions();
  }, [debugPermissions]);

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-xs">
      <h4 className="font-bold mb-2">権限デバッグ情報</h4>
      <div>
        <strong>ロール:</strong> {info.roleLabel}
      </div>
      <div>
        <strong>権限数:</strong> {info.permissions.length}
      </div>
      <div className="mt-2">
        <div>アルバム作成: {info.canCreateAlbum ? '✅' : '❌'}</div>
        <div>招待機能: {info.canInvite ? '✅' : '❌'}</div>
        <div>設定編集: {info.canManageSettings ? '✅' : '❌'}</div>
      </div>
    </div>
  );
};