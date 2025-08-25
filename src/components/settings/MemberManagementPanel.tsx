import React, { useState } from 'react';
import { Users, Crown, Edit3, Eye, AlertTriangle, Check, X } from 'lucide-react';
import { useMembers } from '../../hooks/useMembers';
import { usePermissions } from '../../hooks/usePermissions';
import { Button } from '../ui/Button';
import type { Role } from '../../types/core';

export const MemberManagementPanel: React.FC = () => {
  const { members, loading, updateMemberRole, removeMember } = useMembers();
  const { hasPermission, userRole } = usePermissions();
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [confirmRemoval, setConfirmRemoval] = useState<string | null>(null);

  // 管理者権限チェック
  if (!hasPermission('member.manage')) {
    return (
      <div className="text-center py-8">
        <Users size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">メンバー管理権限がありません</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 mt-2">メンバー情報を読み込み中...</p>
      </div>
    );
  }

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'admin':
        return <Crown size={16} className="text-yellow-500" />;
      case 'editor':
        return <Edit3 size={16} className="text-blue-500" />;
      case 'viewer':
        return <Eye size={16} className="text-gray-500" />;
      default:
        return <Eye size={16} className="text-gray-500" />;
    }
  };

  const getRoleLabel = (role: Role): string => {
    const labels: Record<Role, string> = {
      admin: '管理者',
      editor: '編集者',
      viewer: '閲覧者',
    };
    return labels[role];
  };

  const getRoleDescription = (role: Role): string => {
    const descriptions: Record<Role, string> = {
      admin: 'すべての操作が可能。メンバー管理もできます。',
      editor: 'アルバムや写真の編集・削除が可能。',
      viewer: '閲覧とコメントのみ可能。',
    };
    return descriptions[role];
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      await updateMemberRole(memberId, newRole);
      setEditingMember(null);
    } catch (error) {
      console.error('権限変更エラー:', error);
      alert('権限の変更に失敗しました');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      setConfirmRemoval(null);
    } catch (error) {
      console.error('メンバー削除エラー:', error);
      alert('メンバーの削除に失敗しました');
    }
  };

  const canModifyMember = (member: any) => {
    // 自分自身は編集不可
    if (member.is_current_user) return false;
    // 管理者のみが他のメンバーを編集可能
    return userRole === 'admin';
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">メンバー管理</h3>
      
      <div className="space-y-4">
        {members.map(member => (
          <div
            key={member.id}
            className={`p-4 bg-gray-50 rounded-xl border-2 transition-colors ${
              member.is_current_user 
                ? 'border-orange-200 bg-orange-50' 
                : 'border-transparent hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* メンバー情報 */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {member.display_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {member.display_name || member.email}
                    </h4>
                    {member.is_current_user && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        あなた
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    {getRoleIcon(member.role)}
                    <span className="text-sm text-gray-600">
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">
                    {getRoleDescription(member.role)}
                  </p>
                  
                  <p className="text-xs text-gray-400 mt-1">
                    参加日: {new Date(member.joined_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>

              {/* 操作ボタン */}
              <div className="flex items-center space-x-2">
                {canModifyMember(member) && (
                  <>
                    {editingMember === member.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                        >
                          <option value="viewer">閲覧者</option>
                          <option value="editor">編集者</option>
                          <option value="admin">管理者</option>
                        </select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMember(null)}
                          className="p-1"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMember(member.id)}
                          className="text-xs"
                        >
                          権限変更
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmRemoval(member.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          削除
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 削除確認ダイアログ */}
            {confirmRemoval === member.id && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle size={20} className="text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-medium text-red-900">メンバーを削除しますか？</h5>
                    <p className="text-sm text-red-700 mt-1">
                      {member.display_name || member.email}さんをファミリーから削除します。
                      この操作は取り消せません。
                    </p>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Check size={14} className="mr-1" />
                        削除する
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRemoval(null)}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* メンバーが存在しない場合 */}
      {members.length === 0 && (
        <div className="text-center py-8">
          <Users size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">まだメンバーがいません</p>
          <p className="text-sm text-gray-500 mt-1">
            家族を招待してアルバムを共有しましょう
          </p>
        </div>
      )}

      {/* 権限説明 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl">
        <h4 className="font-medium text-blue-900 mb-3">権限について</h4>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <Crown size={16} className="text-yellow-500 mt-0.5" />
            <div>
              <span className="font-medium">管理者</span>: 
              すべての操作が可能。アルバムの作成・編集・削除、写真のアップロード・編集・削除、メンバー管理ができます。
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Edit3 size={16} className="text-blue-500 mt-0.5" />
            <div>
              <span className="font-medium">編集者</span>: 
              アルバムの作成・編集、写真のアップロード・編集・削除、コメントの投稿・編集ができます。
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Eye size={16} className="text-gray-500 mt-0.5" />
            <div>
              <span className="font-medium">閲覧者</span>: 
              アルバムや写真の閲覧、コメントの投稿・編集のみ可能です。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};