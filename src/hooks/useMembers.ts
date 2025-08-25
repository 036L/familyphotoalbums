import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import type { Role } from '../types/core';

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: Role;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  joined_at: string;
  invited_by: string | null;
  is_current_user: boolean;
  last_seen_at: string | null;
}

export const useMembers = () => {
  const { user, profile } = useApp();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 現在のユーザーのファミリーIDを取得
  const currentFamilyId = profile?.family_id;
  const currentUserId = user?.id;

  // メンバー一覧を取得
  const fetchMembers = useCallback(async () => {
    if (!currentFamilyId || !currentUserId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ファミリーメンバーとプロフィール情報を結合して取得
      const { data, error: fetchError } = await supabase
        .from('family_members')
        .select(`
          id,
          family_id,
          user_id,
          role,
          joined_at,
          invited_by,
          profiles!inner(
            id,
            email,
            display_name,
            avatar_url,
            last_seen_at
          )
        `)
        .eq('family_id', currentFamilyId)
        .order('joined_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // データを適切な形式に変換
      const formattedMembers: FamilyMember[] = (data || []).map((member: any) => ({
        id: member.id,
        family_id: member.family_id,
        user_id: member.user_id,
        role: member.role as Role,
        email: member.profiles?.email || '',
        display_name: member.profiles?.display_name || null,
        avatar_url: member.profiles?.avatar_url || null,
        joined_at: member.joined_at,
        invited_by: member.invited_by,
        is_current_user: member.user_id === currentUserId,
        last_seen_at: member.profiles?.last_seen_at || null,
      }));

      setMembers(formattedMembers);
      
      if (import.meta.env.DEV) {
        console.log('[useMembers] メンバー一覧取得完了:', {
          familyId: currentFamilyId,
          memberCount: formattedMembers.length,
          members: formattedMembers
        });
      }

    } catch (err) {
      console.error('[useMembers] メンバー取得エラー:', err);
      setError(err instanceof Error ? err.message : 'メンバーの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [currentFamilyId, currentUserId]);

  // メンバーの権限を更新
  const updateMemberRole = useCallback(async (memberId: string, newRole: Role) => {
    try {
      setError(null);

      // 権限チェック：管理者のみが実行可能
      if (!profile || profile.role !== 'admin') {
        throw new Error('メンバーの権限変更には管理者権限が必要です');
      }

      // 自分自身の権限は変更不可
      const targetMember = members.find(m => m.id === memberId);
      if (targetMember?.is_current_user) {
        throw new Error('自分自身の権限は変更できません');
      }

      const { error: updateError } = await supabase
        .from('family_members')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .eq('family_id', currentFamilyId); // セキュリティのため家族IDも確認

      if (updateError) {
        throw updateError;
      }

      // ローカル状態を更新
      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === memberId
            ? { ...member, role: newRole }
            : member
        )
      );

      if (import.meta.env.DEV) {
        console.log('[useMembers] 権限更新完了:', { memberId, newRole });
      }

    } catch (err) {
      console.error('[useMembers] 権限更新エラー:', err);
      const errorMessage = err instanceof Error ? err.message : '権限の更新に失敗しました';
      setError(errorMessage);
      throw err; // コンポーネント側でエラーハンドリング
    }
  }, [profile?.role, members, currentFamilyId]);

  // メンバーを削除
  const removeMember = useCallback(async (memberId: string) => {
    try {
      setError(null);

      // 権限チェック：管理者のみが実行可能
      if (!profile || profile.role !== 'admin') {
        throw new Error('メンバーの削除には管理者権限が必要です');
      }

      // 自分自身は削除不可
      const targetMember = members.find(m => m.id === memberId);
      if (targetMember?.is_current_user) {
        throw new Error('自分自身は削除できません');
      }

      const { error: deleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId)
        .eq('family_id', currentFamilyId); // セキュリティのため家族IDも確認

      if (deleteError) {
        throw deleteError;
      }

      // ローカル状態を更新
      setMembers(prevMembers =>
        prevMembers.filter(member => member.id !== memberId)
      );

      if (import.meta.env.DEV) {
        console.log('[useMembers] メンバー削除完了:', { memberId });
      }

    } catch (err) {
      console.error('[useMembers] メンバー削除エラー:', err);
      const errorMessage = err instanceof Error ? err.message : 'メンバーの削除に失敗しました';
      setError(errorMessage);
      throw err; // コンポーネント側でエラーハンドリング
    }
  }, [profile?.role, members, currentFamilyId]);

  // メンバーを招待（将来の実装用）
  const inviteMember = useCallback(async (email: string, role: Role = 'viewer') => {
    try {
      setError(null);

      // 権限チェック：管理者と編集者が実行可能
      if (!profile || !profile.role || !['admin', 'editor'].includes(profile.role)) {
        throw new Error('メンバーの招待には管理者または編集者権限が必要です');
      }

      // 招待ロジックをここに実装
      // 実際の実装では招待メール送信やペンディング状態の管理が必要
      console.log('[useMembers] 招待機能は未実装:', { email, role });
      
      // TODO: 招待機能の実装
      // 1. 招待テーブルにレコード作成
      // 2. 招待メール送信
      // 3. 招待URLの生成
      
    } catch (err) {
      console.error('[useMembers] 招待エラー:', err);
      const errorMessage = err instanceof Error ? err.message : '招待の送信に失敗しました';
      setError(errorMessage);
      throw err;
    }
  }, [profile?.role]);

  // リアルタイム購読の設定
  useEffect(() => {
    if (!currentFamilyId) return;

    // 初回データ取得
    fetchMembers();

    // リアルタイム購読を設定
    const subscription = supabase
      .channel(`family_members:${currentFamilyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'family_members',
        filter: `family_id=eq.${currentFamilyId}`,
      }, (payload) => {
        if (import.meta.env.DEV) {
          console.log('[useMembers] リアルタイム更新:', payload);
        }
        
        // データが変更された場合は再取得
        fetchMembers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentFamilyId, fetchMembers]);

  // ユーティリティ関数
  const getMemberById = useCallback((memberId: string) => {
    return members.find(member => member.id === memberId);
  }, [members]);

  const getMemberByUserId = useCallback((userId: string) => {
    return members.find(member => member.user_id === userId);
  }, [members]);

  const getAdminMembers = useCallback(() => {
    return members.filter(member => member.role === 'admin');
  }, [members]);

  const getCurrentMember = useCallback(() => {
    return members.find(member => member.is_current_user);
  }, [members]);

  // 統計情報
  const memberStats = useCallback(() => {
    const totalMembers = members.length;
    const adminCount = members.filter(m => m.role === 'admin').length;
    const editorCount = members.filter(m => m.role === 'editor').length;
    const viewerCount = members.filter(m => m.role === 'viewer').length;

    return {
      total: totalMembers,
      admins: adminCount,
      editors: editorCount,
      viewers: viewerCount,
    };
  }, [members]);

  return {
    // データ
    members,
    loading,
    error,

    // 操作関数
    fetchMembers,
    updateMemberRole,
    removeMember,
    inviteMember, // 将来の実装用

    // ユーティリティ
    getMemberById,
    getMemberByUserId,
    getAdminMembers,
    getCurrentMember,
    memberStats,

    // 状態管理
    setError,
  };
};