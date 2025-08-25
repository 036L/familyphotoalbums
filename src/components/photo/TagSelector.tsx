import React, { useState, useEffect, useRef } from 'react';
import { Tag, Plus, X, Search, Palette } from 'lucide-react';
import { usePhotoTags } from '../../hooks/usePhotoTags';
import { PhotoTag } from '../../types/core';
import { Button } from '../ui/Button';

interface TagSelectorProps {
  photoId?: string;
  selectedTags?: PhotoTag[];
  onTagsChange?: (tags: PhotoTag[]) => void;
  maxTags?: number;
  size?: 'sm' | 'md' | 'lg';
  allowCreate?: boolean;
  placeholder?: string;
}

const TAG_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FECA57', '#FF9FF3', '#A29BFE', '#74C0FC',
  '#FD79A8', '#FDCB6E', '#6C5CE7', '#00CEC9'
];

export const TagSelector: React.FC<TagSelectorProps> = ({
  photoId,
  selectedTags = [],
  onTagsChange,
  maxTags = 10,
  size = 'md',
  allowCreate = true,
  placeholder = 'タグを検索または作成...'
}) => {
  const { 
    tags, 
    loading, 
    createTag, 
    assignTagToPhoto, 
    removeTagFromPhoto,
    getPhotoTags,
    searchTags 
  } = usePhotoTags();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedTags, setLocalSelectedTags] = useState<PhotoTag[]>(selectedTags);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [filteredTags, setFilteredTags] = useState<PhotoTag[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 写真IDが変わったときにタグを取得
  useEffect(() => {
    if (photoId) {
      getPhotoTags(photoId).then(setLocalSelectedTags);
    }
  }, [photoId, getPhotoTags]);

  // 検索クエリによるフィルタリング
  useEffect(() => {
    const filtered = searchTags(searchQuery).filter(tag => 
      !localSelectedTags.find(selected => selected.id === tag.id)
    );
    setFilteredTags(filtered);
  }, [searchQuery, tags, localSelectedTags, searchTags]);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagSelect = async (tag: PhotoTag) => {
    if (localSelectedTags.length >= maxTags) {
      alert(`最大${maxTags}個までのタグを選択できます`);
      return;
    }

    const newSelectedTags = [...localSelectedTags, tag];
    setLocalSelectedTags(newSelectedTags);
    
    if (photoId) {
      try {
        await assignTagToPhoto(photoId, tag.id);
      } catch (error) {
        console.error('タグ割り当てエラー:', error);
        // エラー時は元に戻す
        setLocalSelectedTags(localSelectedTags);
      }
    }

    onTagsChange?.(newSelectedTags);
    setSearchQuery('');
  };

  const handleTagRemove = async (tag: PhotoTag) => {
    const newSelectedTags = localSelectedTags.filter(t => t.id !== tag.id);
    setLocalSelectedTags(newSelectedTags);
    
    if (photoId) {
      try {
        await removeTagFromPhoto(photoId, tag.id);
      } catch (error) {
        console.error('タグ削除エラー:', error);
        // エラー時は元に戻す
        setLocalSelectedTags(localSelectedTags);
      }
    }

    onTagsChange?.(newSelectedTags);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await createTag(newTagName.trim(), newTagColor);
      await handleTagSelect(newTag);
      
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
      setShowCreateForm(false);
      setSearchQuery('');
    } catch (error) {
      console.error('タグ作成エラー:', error);
      alert('タグの作成に失敗しました');
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          tag: 'px-2 py-1 text-xs',
          input: 'px-3 py-2 text-sm',
          dropdown: 'text-sm'
        };
      case 'lg':
        return {
          tag: 'px-4 py-2 text-base',
          input: 'px-4 py-3 text-base',
          dropdown: 'text-base'
        };
      default:
        return {
          tag: 'px-3 py-1 text-sm',
          input: 'px-3 py-2 text-sm',
          dropdown: 'text-sm'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 選択されたタグの表示 */}
      {localSelectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {localSelectedTags.map(tag => (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses.tag}`}
              style={{ 
                backgroundColor: tag.color + '20', 
                color: tag.color,
                border: `1px solid ${tag.color}40`
              }}
            >
              <Tag size={12} />
              {tag.name}
              <button
                onClick={() => handleTagRemove(tag)}
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                aria-label={`${tag.name}タグを削除`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 入力エリア */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent ${sizeClasses.input}`}
        />
        <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">読み込み中...</div>
          ) : (
            <>
              {/* 既存タグの一覧 */}
              {filteredTags.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2 px-2">既存のタグ</div>
                  {filteredTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagSelect(tag)}
                      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors ${sizeClasses.dropdown}`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left">{tag.name}</span>
                      {tag.usage_count !== undefined && (
                        <span className="text-xs text-gray-400">
                          {tag.usage_count}回使用
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 新規タグ作成 */}
              {allowCreate && searchQuery && (
                <div className="border-t border-gray-100 p-2">
                  {!showCreateForm ? (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-orange-600 ${sizeClasses.dropdown}`}
                    >
                      <Plus size={16} />
                      <span>「{searchQuery}」を新規作成</span>
                    </button>
                  ) : (
                    <div className="space-y-3 p-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          タグ名
                        </label>
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          placeholder="タグ名を入力"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                          autoFocus
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          色を選択
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {TAG_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => setNewTagColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                newTagColor === color 
                                  ? 'border-gray-400 scale-110' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateTag}
                          size="sm"
                          className="flex-1"
                          disabled={!newTagName.trim()}
                        >
                          作成
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewTagName('');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 結果なしの表示 */}
              {!loading && filteredTags.length === 0 && !allowCreate && (
                <div className="p-4 text-center text-gray-500">
                  該当するタグが見つかりません
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* タグ数制限の表示 */}
      {maxTags < 20 && (
        <div className="mt-1 text-xs text-gray-500">
          {localSelectedTags.length} / {maxTags} タグ
        </div>
      )}
    </div>
  );
};