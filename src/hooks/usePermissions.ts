import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export type Permission = 
  // アルバム関連
  | 'album.create'
  | 'album.edit'
  | 'album.delete'
  | 'album.view'
  // 写真関連
  | 'photo.upload'
  | 'photo.edit'
  | 'photo.delete'
  | 'photo.view'
  // コメント関連
  | 'comment.create'
  | 'comment.edit'
  | 'comment.delete'
  | 'comment.view'
  // 招待関連
  | 'invite.create'
  | 'invite.manage'
  // 設定関連
  | 'settings.edit'
  | 'family.manage'
  // 管理者権限
  | 'admin.all';

export type Role = 'admin' | 'editor' | 'viewer';

// ロール別権限マップ
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // すべての権限
    'album.create',
    'album.edit',
    'album.delete',
    'album.view',
    'photo.upload',
    'photo.edit',
    'photo.delete',
    'photo.view',
    'comment.create',
    'comment.edit',
    'comment.delete',
    'comment.view',
    'invite.create',
    'invite.manage',
    'settings.edit',
    'family.manage',
    'admin.all',
  ],
  editor: [
    // 基本的な編集権限（写真削除も含む）
    'album.create',
    'album.edit',
    'album.view',
    'photo.upload',
    'photo.edit',
    'photo.delete', // 編集者も写真削除可能
    'photo.view',
    'comment.create',
    'comment.edit',
    'comment.view',
    'invite.create',
    'settings.edit',
  ],
  viewer: [
    // 閲覧とコメントのみ
    'album.view',
    'photo.view',
    'comment.create',
    'comment.view',
    'settings.edit', // 自分の設定は編集可能
  ],
};

// 特別な権限チェック（自分のコンテンツかどうか）
interface ResourceOwnership {
  createdBy?: string;
  uploadedBy?: string;
  userId?: string;
}

export const usePermissions = () => {
  const { profile, user } = useApp();

  const userRole: Role = profile?.role || 'viewer';
  const userId = user?.id || profile?.id;

  // デバッグログ追加
  console.log('[usePermissions] 現在の権限情報:', {
    userRole,
    userId,
    profile,
    hasUser: !!user
  });

  // 現在のユーザーの権限一覧を取得
  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole]);

  // 権限チェック関数
  const hasPermission = (permission: Permission): boolean => {
    // 管理者は全権限を持つ
    if (userRole === 'admin') {
      return true;
    }
    
    const result = permissions.includes(permission);
    console.log(`[usePermissions] ${permission} = ${result} (role: ${userRole})`);
    return result;
  };

  // 複数権限のチェック（AND条件）
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  // 複数権限のチェック（OR条件）
  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  // リソース所有者チェック付き権限確認
  const canEditResource = (
    basePermission: Permission,
    resource: ResourceOwnership
  ): boolean => {
    // 管理者は常に編集可能
    if (userRole === 'admin') {
      return true;
    }

    // 基本権限がない場合は不可
    if (!hasPermission(basePermission)) {
      return false;
    }

    // 自分が作成したリソースの場合は編集可能
    const resourceOwnerId = resource.createdBy || resource.uploadedBy || resource.userId;
    if (resourceOwnerId === userId) {
      return true;
    }

    // 編集者は他人のリソースも編集可能（アルバム・写真のみ）
    if (userRole === 'editor' && (
      basePermission === 'album.edit' || 
      basePermission === 'photo.edit'
    )) {
      return true;
    }

    return false;
  };

  // リソース削除権限チェック
  const canDeleteResource = (
    basePermission: Permission,
    resource: ResourceOwnership
  ): boolean => {
    console.log('[usePermissions] canDeleteResource チェック:', {
      basePermission,
      resource,
      userRole,
      userId
    });

    // 管理者は常に削除可能
    if (userRole === 'admin') {
      console.log('[usePermissions] 管理者権限で削除可能');
      return true;
    }

    // 削除権限がない場合は不可
    if (!hasPermission(basePermission)) {
      console.log('[usePermissions] 基本削除権限なし');
      return false;
    }

    // 自分が作成したリソースのみ削除可能
    const resourceOwnerId = resource.createdBy || resource.uploadedBy || resource.userId;
    const canDelete = resourceOwnerId === userId;
    
    console.log('[usePermissions] 所有者チェック:', {
      resourceOwnerId,
      userId,
      canDelete
    });

    return canDelete;
  };

  // アルバム固有の権限チェック
  const canManageAlbum = (album: { created_by?: string; is_public?: boolean }) => {
    if (userRole === 'admin') return true;
    if (album.created_by === userId) return true;
    if (userRole === 'editor' && album.is_public) return true;
    return false;
  };

  // コメント固有の権限チェック
  const canManageComment = (comment: { user_id?: string }) => {
    if (userRole === 'admin') return true;
    if (comment.user_id === userId) return true;
    return false;
  };

  // 招待権限チェック
  const canInviteMembers = (): boolean => {
    return hasPermission('invite.create');
  };

  // 家族管理権限チェック
  const canManageFamily = (): boolean => {
    return hasPermission('family.manage');
  };

  // UI表示用の権限情報
  const getPermissionInfo = () => ({
    role: userRole,
    roleLabel: getRoleLabel(userRole),
    permissions: permissions,
    canCreateAlbum: hasPermission('album.create'),
    canInvite: hasPermission('invite.create'),
    canManageSettings: hasPermission('settings.edit'),
    isAdmin: userRole === 'admin',
    isEditor: userRole === 'editor',
    isViewer: userRole === 'viewer',
  });

  // ロールラベル取得
  const getRoleLabel = (role: Role): string => {
    const labels = {
      admin: '管理者',
      editor: '編集者',
      viewer: '閲覧者',
    };
    return labels[role];
  };

  // デバッグ用：権限一覧表示
  const debugPermissions = () => {
    console.log('Current User Role:', userRole);
    console.log('Available Permissions:', permissions);
    console.log('Permission Info:', getPermissionInfo());
  };

  return {
    // 基本情報
    userRole,
    userId,
    permissions,
    
    // 権限チェック関数
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    
    // リソース権限チェック
    canEditResource,
    canDeleteResource,
    canManageAlbum,
    canManageComment,
    
    // 特定機能の権限チェック
    canInviteMembers,
    canManageFamily,
    
    // UI用情報
    getPermissionInfo,
    getRoleLabel,
    
    // デバッグ
    debugPermissions,
  };
};