// src/hooks/usePermissions.ts
import { useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useEnvironment } from './useEnvironment';
import type { Permission, Role, ResourceOwnership } from '../types/core';

// ロール別権限マップ（型安全性を向上）
const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
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
  ] as const,
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
    'comment.delete',
    'invite.create',
    'settings.edit',
  ] as const,
  viewer: [
    // 閲覧とコメントのみ
    'album.view',
    'photo.view',
    'comment.create',
    'comment.view',
    'comment.delete',
    'settings.edit', // 自分の設定は編集可能
  ] as const,
} as const;

// より具体的なリソース所有権の型定義
interface ExtendedResourceOwnership extends ResourceOwnership {
  created_by?: string; // データベースフィールドとの互換性
  uploaded_by?: string; // データベースフィールドとの互換性
  user_id?: string; // データベースフィールドとの互換性
}

// ロールラベル取得関数（Hookの外部で定義）
const getRoleLabel = (role: Role): string => {
  const labels: Record<Role, string> = {
    admin: '管理者',
    editor: '編集者',
    viewer: '閲覧者',
  };
  return labels[role];
};

export const usePermissions = () => {
  const { profile, user } = useApp();
  const { isDevelopment } = useEnvironment();

  const userRole: Role = profile?.role || 'viewer';
  const userId = user?.id || profile?.id;

  // デバッグログ関数をuseCallbackでメモ化
  const debugLog = useCallback((message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[usePermissions] ${message}`, data);
    }
  }, [isDevelopment]);

  // 現在のユーザーの権限一覧を取得（最適化済み）
  const permissions = useMemo(() => {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    // デバッグログは開発時かつ初回のみ
    if (isDevelopment) {
      debugLog('権限計算', { userRole, permissionCount: rolePermissions.length });
    }
    return rolePermissions;
  }, [userRole, isDevelopment, debugLog]);

  // 権限チェック関数（メモ化で最適化）
  const hasPermission = useCallback((permission: Permission): boolean => {
    // 管理者は全権限を持つ
    if (userRole === 'admin') {
      return true;
    }
    
    const result = permissions.includes(permission);
    // デバッグログは重要な権限チェック時のみ
    if (isDevelopment && (permission.includes('delete') || permission.includes('admin'))) {
      debugLog(`重要権限チェック: ${permission} = ${result}`);
    }
    return result;
  }, [userRole, permissions, isDevelopment, debugLog]);

  // 複数権限のチェック（AND条件）
  const hasAllPermissions = useCallback((requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // 複数権限のチェック（OR条件）
  const hasAnyPermission = useCallback((requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // リソース所有者チェック付き権限確認（型安全性向上）
  const canEditResource = useCallback((
    basePermission: Permission,
    resource: ExtendedResourceOwnership
  ): boolean => {
    // 管理者は常に編集可能
    if (userRole === 'admin') {
      return true;
    }

    // 基本権限がない場合は不可
    if (!hasPermission(basePermission)) {
      return false;
    }

    // 複数の所有者IDフィールドをチェック
    const resourceOwnerId = resource.createdBy || 
                          resource.uploadedBy || 
                          resource.userId ||
                          resource.created_by ||
                          resource.uploaded_by ||
                          resource.user_id;
    
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
  }, [userRole, hasPermission, userId]);

  // リソース削除権限チェック（デバッグログ最適化）
  const canDeleteResource = useCallback((
    basePermission: Permission,
    resource: ExtendedResourceOwnership
  ): boolean => {
    // 重要な削除操作のみデバッグログ
    const shouldLog = isDevelopment && (
      basePermission === 'album.delete' || 
      basePermission === 'photo.delete'
    );

    if (shouldLog) {
      debugLog('削除権限チェック開始', {
        basePermission,
        resource,
        userRole,
        userId
      });
    }

    // 管理者は常に削除可能
    if (userRole === 'admin') {
      if (shouldLog) debugLog('管理者権限で削除可能');
      return true;
    }

    // 削除権限がない場合は不可
    if (!hasPermission(basePermission)) {
      if (shouldLog) debugLog('基本削除権限なし');
      return false;
    }

    // 複数の所有者IDフィールドをチェック
    const resourceOwnerId = resource.createdBy || 
                          resource.uploadedBy || 
                          resource.userId ||
                          resource.created_by ||
                          resource.uploaded_by ||
                          resource.user_id;
    
    const canDelete = resourceOwnerId === userId;
    
    if (shouldLog) {
      debugLog('所有者チェック結果', {
        resourceOwnerId,
        userId,
        canDelete
      });
    }

    return canDelete;
  }, [userRole, hasPermission, userId, isDevelopment, debugLog]);

  // アルバム固有の権限チェック
  const canManageAlbum = useCallback((album: { 
    created_by?: string; 
    is_public?: boolean;
    createdBy?: string; // 互換性のため 
  }) => {
    if (userRole === 'admin') return true;
    
    const albumCreator = album.created_by || album.createdBy;
    if (albumCreator === userId) return true;
    
    if (userRole === 'editor' && album.is_public) return true;
    return false;
  }, [userRole, userId]);

  // コメント固有の権限チェック
  const canManageComment = useCallback((comment: { 
    user_id?: string;
    userId?: string; // 互換性のため
  }) => {
    if (userRole === 'admin') return true;
    
    const commentAuthor = comment.user_id || comment.userId;
    if (commentAuthor === userId) return true;
    return false;
  }, [userRole, userId]);

  // 招待権限チェック
  const canInviteMembers = useCallback((): boolean => {
    return hasPermission('invite.create');
  }, [hasPermission]);

  // 家族管理権限チェック
  const canManageFamily = useCallback((): boolean => {
    return hasPermission('family.manage');
  }, [hasPermission]);

  // UI表示用の権限情報（関数として定義）
  const getPermissionInfo = useCallback(() => ({
    role: userRole,
    roleLabel: getRoleLabel(userRole), // 外部関数を使用
    permissions: [...permissions], // 配列のコピーを返す
    canCreateAlbum: hasPermission('album.create'),
    canInvite: hasPermission('invite.create'),
    canManageSettings: hasPermission('settings.edit'),
    isAdmin: userRole === 'admin',
    isEditor: userRole === 'editor',
    isViewer: userRole === 'viewer',
  }), [userRole, permissions, hasPermission]);

  // デバッグ用：権限一覧表示（開発時のみ、実行を最適化）
  const debugPermissions = useCallback(() => {
    if (!isDevelopment) return;
    
    console.group('=== 権限デバッグ情報 ===');
    console.log('User Role:', userRole);
    console.log('User ID:', userId);
    console.log('Available Permissions:', permissions);
    console.table(getPermissionInfo());
    console.groupEnd();
  }, [isDevelopment, userRole, userId, permissions, getPermissionInfo]);

  return {
    // 基本情報
    userRole,
    userId,
    permissions: [...permissions], // 配列のコピーを返す（イミュータブル）
    
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
    getRoleLabel: useCallback(getRoleLabel, []), // 外部関数をwrap
    
    // デバッグ（開発時のみ）
    debugPermissions,
  };
};