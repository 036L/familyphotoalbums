import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Calendar, 
  Tag, 
  Camera, 
  MapPin, 
  FileImage, 
  SortAsc, 
  SortDesc,
  Grid,
  List,
  Sliders,
  LucideIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAutoSort, SortCriteria, GroupCriteria, FilterCriteria } from '../../hooks/useAutoSort';
import { usePhotoTags } from '../../hooks/usePhotoTags';

interface AlbumFiltersProps {
  onFiltersChange: (filters: {
    sort: SortCriteria;
    group: GroupCriteria;
    filter: FilterCriteria;
  }) => void;
  photoCount: number;
  className?: string;
}

export const AlbumFilters: React.FC<AlbumFiltersProps> = ({
  onFiltersChange,
  photoCount,
  className = ''
}) => {
  const {
    sortCriteria,
    groupCriteria,
    filterCriteria,
    setSortCriteria,
    setGroupCriteria,
    setFilterCriteria,
    presets,
    applyPreset
  } = useAutoSort();
  
  const { tags } = usePhotoTags();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sort' | 'group' | 'filter'>('sort');
  const [tempFilters, setTempFilters] = useState(filterCriteria);

  // フィルター変更の通知
  useEffect(() => {
    onFiltersChange({
      sort: sortCriteria,
      group: groupCriteria,
      filter: filterCriteria
    });
  }, [sortCriteria, groupCriteria, filterCriteria, onFiltersChange]);

  const handleSortChange = (field: SortCriteria['field'], order: SortCriteria['order']) => {
    setSortCriteria({ field, order });
  };

  const handleGroupChange = (by: GroupCriteria['by']) => {
    setGroupCriteria({ by, showCount: true });
  };

  const handleFilterApply = () => {
    setFilterCriteria(tempFilters);
    setIsOpen(false);
  };

  const handleFilterReset = () => {
    const resetFilters = {};
    setTempFilters(resetFilters);
    setFilterCriteria(resetFilters);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filterCriteria.dateRange) count++;
    if (filterCriteria.fileTypes?.length) count++;
    if (filterCriteria.sizeRange) count++;
    if (filterCriteria.tags?.length) count++;
    if (filterCriteria.location) count++;
    if (filterCriteria.camera) count++;
    return count;
  };

  // formatFileSize関数を削除（現在未使用のため）

  return (
    <div className={`relative ${className}`}>
      {/* フィルターバー */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-3">
        {/* 左側：並び替えとグループ化 */}
        <div className="flex items-center space-x-4">
          {/* 並び替え */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">並び順:</span>
            <select
              value={`${sortCriteria.field}-${sortCriteria.order}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [SortCriteria['field'], SortCriteria['order']];
                handleSortChange(field, order);
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="date-desc">新しい順</option>
              <option value="date-asc">古い順</option>
              <option value="name-asc">名前順 (A-Z)</option>
              <option value="name-desc">名前順 (Z-A)</option>
              <option value="size-desc">サイズ大順</option>
              <option value="size-asc">サイズ小順</option>
            </select>
          </div>

          {/* グループ化 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">グループ:</span>
            <select
              value={groupCriteria.by}
              onChange={(e) => handleGroupChange(e.target.value as GroupCriteria['by'])}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="none">なし</option>
              <option value="date">日付別</option>
              <option value="month">月別</option>
              <option value="year">年別</option>
              <option value="location">場所別</option>
              <option value="camera">カメラ別</option>
              <option value="tags">タグ別</option>
            </select>
          </div>
        </div>

        {/* 右側：フィルターとプリセット */}
        <div className="flex items-center space-x-3">
          {/* 写真数表示 */}
          <span className="text-sm text-gray-600">
            {photoCount}枚の写真
          </span>

          {/* プリセット */}
          <div className="flex items-center space-x-1">
            {Object.keys(presets).map((presetKey) => {
              const getPresetLabel = (key: string) => {
                switch (key) {
                  case 'recent': return '最新';
                  case 'byMonth': return '月別';
                  case 'byLocation': return '場所別';
                  case 'thisYear': return '今年';
                  default: return key;
                }
              };

              return (
                <Button
                  key={presetKey}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(presetKey as keyof typeof presets)}
                  className="text-xs px-3 py-1"
                >
                  {getPresetLabel(presetKey)}
                </Button>
              );
            })}
          </div>

          {/* 詳細フィルターボタン */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2"
          >
            <Filter size={16} />
            <span>フィルター</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* 詳細フィルターパネル */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-30">
          {/* タブ */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'sort', label: '並び替え', icon: SortAsc },
              { id: 'group', label: 'グループ化', icon: Grid },
              { id: 'filter', label: 'フィルター', icon: Sliders },
            ].map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* タブコンテンツ */}
          <div className="p-4">
            {/* 並び替えタブ */}
            {activeTab === 'sort' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">並び替え基準</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { field: 'date', label: '日付', icon: Calendar },
                      { field: 'name', label: '名前', icon: FileImage },
                      { field: 'size', label: 'サイズ', icon: Sliders },
                      { field: 'type', label: 'ファイル形式', icon: FileImage },
                    ] as Array<{ field: SortCriteria['field']; label: string; icon: LucideIcon }>).map(option => {
                      const IconComponent = option.icon;
                      return (
                        <button
                          key={option.field}
                          onClick={() => handleSortChange(option.field, sortCriteria.order)}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                            sortCriteria.field === option.field
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                        >
                          <IconComponent size={20} />
                          <span className="font-medium">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">並び順</h4>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSortChange(sortCriteria.field, 'asc')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        sortCriteria.order === 'asc'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <SortAsc size={16} />
                      <span>昇順</span>
                    </button>
                    <button
                      onClick={() => handleSortChange(sortCriteria.field, 'desc')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        sortCriteria.order === 'desc'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <SortDesc size={16} />
                      <span>降順</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* グループ化タブ */}
            {activeTab === 'group' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">グループ化方法</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { by: 'none', label: 'グループ化なし', icon: List },
                      { by: 'date', label: '日付別', icon: Calendar },
                      { by: 'month', label: '月別', icon: Calendar },
                      { by: 'year', label: '年別', icon: Calendar },
                      { by: 'location', label: '場所別', icon: MapPin },
                      { by: 'camera', label: 'カメラ別', icon: Camera },
                    ] as Array<{ by: GroupCriteria['by']; label: string; icon: LucideIcon }>).map(option => {
                      const IconComponent = option.icon;
                      return (
                        <button
                          key={option.by}
                          onClick={() => handleGroupChange(option.by)}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                            groupCriteria.by === option.by
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                        >
                          <IconComponent size={20} />
                          <span className="font-medium">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* フィルタータブ */}
            {activeTab === 'filter' && (
              <div className="space-y-6">
                {/* 日付範囲 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>日付範囲</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">開始日</label>
                      <input
                        type="date"
                        value={tempFilters.dateRange?.start?.split('T')[0] || ''}
                        onChange={(e) => setTempFilters(prev => ({
                          ...prev,
                          dateRange: {
                            start: e.target.value + 'T00:00:00Z',
                            end: prev.dateRange?.end || new Date().toISOString()
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">終了日</label>
                      <input
                        type="date"
                        value={tempFilters.dateRange?.end?.split('T')[0] || ''}
                        onChange={(e) => setTempFilters(prev => ({
                          ...prev,
                          dateRange: {
                            start: prev.dateRange?.start || new Date(0).toISOString(),
                            end: e.target.value + 'T23:59:59Z'
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                  </div>
                </div>

                {/* ファイル形式 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <FileImage size={16} />
                    <span>ファイル形式</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['image', 'video'].map(type => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.fileTypes?.includes(type) || false}
                          onChange={(e) => {
                            const currentTypes = tempFilters.fileTypes || [];
                            if (e.target.checked) {
                              setTempFilters(prev => ({
                                ...prev,
                                fileTypes: [...currentTypes, type]
                              }));
                            } else {
                              setTempFilters(prev => ({
                                ...prev,
                                fileTypes: currentTypes.filter(t => t !== type)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm">{type === 'image' ? '画像' : '動画'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* タグ */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Tag size={16} />
                    <span>タグ</span>
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {tags.map(tag => (
                      <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.tags?.includes(tag.id) || false}
                          onChange={(e) => {
                            const currentTags = tempFilters.tags || [];
                            if (e.target.checked) {
                              setTempFilters(prev => ({
                                ...prev,
                                tags: [...currentTags, tag.id]
                              }));
                            } else {
                              setTempFilters(prev => ({
                                ...prev,
                                tags: currentTags.filter(t => t !== tag.id)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span 
                          className="text-sm px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: tag.color + '20', 
                            color: tag.color 
                          }}
                        >
                          {tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 場所 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <MapPin size={16} />
                    <span>場所</span>
                  </h4>
                  <input
                    type="text"
                    value={tempFilters.location || ''}
                    onChange={(e) => setTempFilters(prev => ({
                      ...prev,
                      location: e.target.value
                    }))}
                    placeholder="場所名で検索..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* フィルターアクション */}
          <div className="border-t border-gray-200 p-4 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFilterReset}
            >
              リセット
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                onClick={handleFilterApply}
              >
                適用
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};