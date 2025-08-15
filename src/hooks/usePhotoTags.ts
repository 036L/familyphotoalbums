// src/hooks/usePhotoTags.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useEnvironment } from './useEnvironment';
import type { PhotoTag } from '../types/core';

// デモ用のタグデータ
const demoTags: PhotoTag[] = [
  {
    id: 'tag-1',
    name: '家族',
    color: '#FF6B6B',
    created_by: 'demo-user-1',
    created_at: '2024-01-01T00:00:00Z',
    usage_count: 12
  },
  {
    id: 'tag-2',
    name: '旅行',
    color: '#4ECDC4',
    created_by: 'demo-user-1',
    created_at: '2024-01-01T00:00:00Z',
    usage_count: 8
  },
  {
    id: 'tag-3',
    name: '食事',
    color: '#45B7D1',
    created_by: 'demo-user-1',
    created_at: '2024-01-01T00:00:00Z',
    usage_count: 5
  },
  {
    id: 'tag-4',
    name: '風景',
    color: '#96CEB4',
    created_by: 'demo-user-1',
    created_at: '2024-01-01T00:00:00Z',
    usage_count: 15
  },
  {
    id: 'tag-5',
    name: 'イベント',
    color: '#FECA57',
    created_by: 'demo-user-1',
    created_at: '2024-01-01T00:00:00Z',
    usage_count: 6
  },
  {
    id: 'tag-6',
    name: 'ペット',
    color: '#FF9FF3',
    created_by: 'demo-user-1',
    created_at: '2024-01-01T00:00:00Z',
    usage_count: 3
  }
];

export const usePhotoTags = () => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const [tags, setTags] = useState<PhotoTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 環境情報をHookで取得
  const { isDemo } = useEnvironment();

  // タグ一覧の取得
  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // デモモードの場合
        setTimeout(() => {
          setTags(demoTags);
          setLoading(false);
        }, 300);
        return;
      }

      const { data, error } = await supabase
        .from('photo_tags')
        .select(`
          *,
          photo_tag_assignments(count)
        `)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      const tagsWithUsage = data.map((tag: any) => ({
        ...tag,
        usage_count: tag.photo_tag_assignments?.[0]?.count || 0
      }));

      setTags(tagsWithUsage);
    } catch (err) {
      console.error('タグ取得エラー:', err);
      setError('タグの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 新しいタグの作成
  const createTag = async (name: string, color: string): Promise<PhotoTag> => {
    try {
      if (isDemo) {
        const newTag: PhotoTag = {
          id: `tag-${Date.now()}`,
          name,
          color,
          created_by: 'demo-user-1',
          created_at: new Date().toISOString(),
          usage_count: 0
        };
        setTags(prev => [newTag, ...prev]);
        return newTag;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      const { data, error } = await supabase
        .from('photo_tags')
        .insert({
          name,
          color,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newTag = { ...data, usage_count: 0 };
      setTags(prev => [newTag, ...prev]);
      return newTag;
    } catch (err) {
      console.error('タグ作成エラー:', err);
      throw new Error('タグの作成に失敗しました');
    }
  };

  // タグの更新
  const updateTag = async (id: string, updates: Partial<PhotoTag>): Promise<PhotoTag> => {
    try {
      if (isDemo) {
        const updatedTag = tags.find(tag => tag.id === id);
        if (!updatedTag) throw new Error('タグが見つかりません');
        
        const newTag = { ...updatedTag, ...updates };
        setTags(prev => prev.map(tag => tag.id === id ? newTag : tag));
        return newTag;
      }

      const { data, error } = await supabase
        .from('photo_tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTags(prev => prev.map(tag => tag.id === id ? { ...tag, ...data } : tag));
      return data;
    } catch (err) {
      console.error('タグ更新エラー:', err);
      throw new Error('タグの更新に失敗しました');
    }
  };

  // タグの削除
  const deleteTag = async (id: string): Promise<void> => {
    try {
      if (isDemo) {
        setTags(prev => prev.filter(tag => tag.id !== id));
        return;
      }

      const { error } = await supabase
        .from('photo_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTags(prev => prev.filter(tag => tag.id !== id));
    } catch (err) {
      console.error('タグ削除エラー:', err);
      throw new Error('タグの削除に失敗しました');
    }
  };

  // 写真にタグを割り当て
  const assignTagToPhoto = async (photoId: string, tagId: string): Promise<void> => {
    try {
      if (isDemo) {
        // デモモードでは何もしない（UIの表示のみ）
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      const { error } = await supabase
        .from('photo_tag_assignments')
        .insert({
          photo_id: photoId,
          tag_id: tagId,
          assigned_by: user.id,
        });

      if (error) throw error;

      // 使用回数を更新
      await updateTagUsageCount(tagId);
    } catch (err) {
      console.error('タグ割り当てエラー:', err);
      throw new Error('タグの割り当てに失敗しました');
    }
  };

  // 写真からタグを削除
  const removeTagFromPhoto = async (photoId: string, tagId: string): Promise<void> => {
    try {
      if (isDemo) {
        return;
      }

      const { error } = await supabase
        .from('photo_tag_assignments')
        .delete()
        .eq('photo_id', photoId)
        .eq('tag_id', tagId);

      if (error) throw error;

      // 使用回数を更新
      await updateTagUsageCount(tagId);
    } catch (err) {
      console.error('タグ削除エラー:', err);
      throw new Error('タグの削除に失敗しました');
    }
  };

  // 写真に割り当てられたタグを取得
  const getPhotoTags = async (photoId: string): Promise<PhotoTag[]> => {
    try {
      if (isDemo) {
        // デモ用の写真タグ
        return [demoTags[0], demoTags[1]]; // "家族"と"旅行"タグ
      }

      const { data, error } = await supabase
        .from('photo_tag_assignments')
        .select(`
          photo_tags(*)
        `)
        .eq('photo_id', photoId);

      if (error) throw error;

      return data.map((assignment: any) => assignment.photo_tags).filter(Boolean);
    } catch (err) {
      console.error('写真タグ取得エラー:', err);
      return [];
    }
  };

  // タグの使用回数を更新
  const updateTagUsageCount = async (tagId: string): Promise<void> => {
    try {
      if (isDemo) return;

      const { data, error } = await supabase
        .from('photo_tag_assignments')
        .select('id')
        .eq('tag_id', tagId);

      if (error) throw error;

      const usageCount = data.length;

      await supabase
        .from('photo_tags')
        .update({ usage_count: usageCount })
        .eq('id', tagId);

      // ローカル状態も更新
      setTags(prev => 
        prev.map(tag => 
          tag.id === tagId ? { ...tag, usage_count: usageCount } : tag
        )
      );
    } catch (err) {
      console.error('使用回数更新エラー:', err);
    }
  };

  // タグでの写真検索
  const searchPhotosByTags = async (tagIds: string[]): Promise<string[]> => {
    try {
      if (isDemo) {
        // デモモードでは空配列を返す
        return [];
      }

      const { data, error } = await supabase
        .from('photo_tag_assignments')
        .select('photo_id')
        .in('tag_id', tagIds);

      if (error) throw error;

      // 重複を除去
      const photoIds = [...new Set(data.map((assignment: any) => assignment.photo_id))];
      return photoIds;
    } catch (err) {
      console.error('タグ検索エラー:', err);
      return [];
    }
  };

  // よく使用されるタグを取得
  const getPopularTags = (limit: number = 5): PhotoTag[] => {
    return [...tags]
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, limit);
  };

  // 色別のタグを取得
  const getTagsByColor = (): Record<string, PhotoTag[]> => {
    return tags.reduce((acc, tag) => {
      if (!acc[tag.color]) {
        acc[tag.color] = [];
      }
      acc[tag.color].push(tag);
      return acc;
    }, {} as Record<string, PhotoTag[]>);
  };

  // タグ名で検索
  const searchTags = (query: string): PhotoTag[] => {
    if (!query.trim()) return tags;
    
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  useEffect(() => {
    fetchTags();
  }, [isDemo]); // isDemo も依存配列に追加

  return {
    tags,
    loading,
    error,
    
    // CRUD操作
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    
    // 写真との関連付け
    assignTagToPhoto,
    removeTagFromPhoto,
    getPhotoTags,
    
    // 検索・フィルタリング
    searchPhotosByTags,
    searchTags,
    getPopularTags,
    getTagsByColor,
  };
};