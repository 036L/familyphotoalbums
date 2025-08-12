import { useState, useCallback } from 'react';

// Photo型の定義（プロジェクトの型定義に合わせて調整）
interface Photo {
  id: string;
  filename?: string;
  original_filename?: string;
  url: string;
  thumbnail_url?: string;
  file_type: 'image' | 'video';
  file_size?: number;
  width?: number | null;
  height?: number | null;
  album_id?: string;
  uploaded_by?: string;
  created_at?: string;
  uploadedAt?: string; // 既存のプロパティとの互換性
  metadata?: Record<string, any>;
}

export interface SortCriteria {
  field: 'date' | 'name' | 'size' | 'type' | 'location';
  order: 'asc' | 'desc';
}

export interface GroupCriteria {
  by: 'date' | 'month' | 'year' | 'location' | 'camera' | 'tags' | 'none';
  showCount?: boolean;
}

export interface FilterCriteria {
  dateRange?: {
    start: string;
    end: string;
  };
  fileTypes?: string[];
  sizeRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  location?: string;
  camera?: string;
}

interface PhotoGroup {
  key: string;
  label: string;
  photos: Photo[];
  count: number;
  metadata?: Record<string, any>;
}

export const useAutoSort = () => {
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>({
    field: 'date',
    order: 'desc'
  });
  
  const [groupCriteria, setGroupCriteria] = useState<GroupCriteria>({
    by: 'none',
    showCount: true
  });
  
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});

  // 写真のソート
  const sortPhotos = useCallback((photos: Photo[], criteria: SortCriteria = sortCriteria): Photo[] => {
    const sorted = [...photos].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (criteria.field) {
        case 'date':
          // 複数の日付フィールドから最初に見つかったものを使用
          const aDate = a.created_at || a.uploadedAt;
          const bDate = b.created_at || b.uploadedAt;
          aValue = aDate ? new Date(aDate).getTime() : 0;
          bValue = bDate ? new Date(bDate).getTime() : 0;
          break;
        case 'name':
          aValue = (a.filename || a.original_filename || '').toLowerCase();
          bValue = (b.filename || b.original_filename || '').toLowerCase();
          break;
        case 'size':
          aValue = a.file_size || 0;
          bValue = b.file_size || 0;
          break;
        case 'type':
          aValue = a.file_type || '';
          bValue = b.file_type || '';
          break;
        case 'location':
          aValue = a.metadata?.location_name || '';
          bValue = b.metadata?.location_name || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return criteria.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return criteria.order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [sortCriteria]);

  // 写真のフィルタリング
  const filterPhotos = useCallback((photos: Photo[], criteria: FilterCriteria = filterCriteria): Photo[] => {
    return photos.filter(photo => {
      // 日付範囲フィルター
      if (criteria.dateRange) {
        const photoDateStr = photo.created_at || photo.uploadedAt;
        if (photoDateStr) {
          const photoDate = new Date(photoDateStr);
          const startDate = new Date(criteria.dateRange.start);
          const endDate = new Date(criteria.dateRange.end);
          
          if (photoDate < startDate || photoDate > endDate) {
            return false;
          }
        }
      }

      // ファイルタイプフィルター
      if (criteria.fileTypes && criteria.fileTypes.length > 0) {
        if (!criteria.fileTypes.includes(photo.file_type)) {
          return false;
        }
      }

      // ファイルサイズフィルター
      if (criteria.sizeRange) {
        const size = photo.file_size || 0;
        if (size < criteria.sizeRange.min || size > criteria.sizeRange.max) {
          return false;
        }
      }

      // タグフィルター（実装は写真にタグ情報が必要）
      if (criteria.tags && criteria.tags.length > 0) {
        const photoTags = photo.metadata?.tags || [];
        if (!criteria.tags.some(tag => photoTags.includes(tag))) {
          return false;
        }
      }

      // 場所フィルター
      if (criteria.location) {
        const photoLocation = photo.metadata?.location_name || '';
        if (!photoLocation.includes(criteria.location)) {
          return false;
        }
      }

      // カメラフィルター
      if (criteria.camera) {
        const photoCamera = photo.metadata?.camera_model || '';
        if (!photoCamera.includes(criteria.camera)) {
          return false;
        }
      }

      return true;
    });
  }, [filterCriteria]);

  // 写真のグループ化
  const groupPhotos = useCallback((photos: Photo[], criteria: GroupCriteria = groupCriteria): PhotoGroup[] => {
    if (criteria.by === 'none') {
      return [{
        key: 'all',
        label: 'すべての写真',
        photos,
        count: photos.length
      }];
    }

    const groups: Record<string, Photo[]> = {};

    photos.forEach(photo => {
      let groupKey = '';
      
      switch (criteria.by) {
        case 'date':
          const dateStr = photo.created_at || photo.uploadedAt;
          if (dateStr) {
            const date = new Date(dateStr);
            groupKey = date.toLocaleDateString('ja-JP');
          } else {
            groupKey = '日付不明';
          }
          break;
        case 'month':
          const monthDateStr = photo.created_at || photo.uploadedAt;
          if (monthDateStr) {
            const monthDate = new Date(monthDateStr);
            groupKey = monthDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
          } else {
            groupKey = '日付不明';
          }
          break;
        case 'year':
          const yearDateStr = photo.created_at || photo.uploadedAt;
          if (yearDateStr) {
            const yearDate = new Date(yearDateStr);
            groupKey = yearDate.getFullYear().toString();
          } else {
            groupKey = '日付不明';
          }
          break;
        case 'location':
          groupKey = photo.metadata?.location_name || '場所不明';
          break;
        case 'camera':
          groupKey = photo.metadata?.camera_model || 'カメラ不明';
          break;
        case 'tags':
          const tags = photo.metadata?.tags || [];
          groupKey = tags.length > 0 ? tags[0] : 'タグなし';
          break;
        default:
          groupKey = 'その他';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(photo);
    });

    return Object.entries(groups)
      .map(([key, photos]) => ({
        key,
        label: key,
        photos: sortPhotos(photos),
        count: photos.length,
        metadata: criteria.by === 'location' ? {
          coordinates: photos[0]?.metadata?.coordinates
        } : undefined
      }))
      .sort((a, b) => {
        // グループの並び順
        if (criteria.by === 'date' || criteria.by === 'month' || criteria.by === 'year') {
          const aDateStr = a.photos[0]?.created_at || a.photos[0]?.uploadedAt;
          const bDateStr = b.photos[0]?.created_at || b.photos[0]?.uploadedAt;
          const aTime = aDateStr ? new Date(aDateStr).getTime() : 0;
          const bTime = bDateStr ? new Date(bDateStr).getTime() : 0;
          return bTime - aTime;
        }
        return b.count - a.count; // 写真数の多い順
      });
  }, [groupCriteria, sortPhotos]);

  // 統計情報の計算
  const calculateStats = useCallback((photos: Photo[]) => {
    const totalSize = photos.reduce((sum, photo) => sum + (photo.file_size || 0), 0);
    const fileTypes = photos.reduce((acc, photo) => {
      const type = photo.file_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dateRange = photos.reduce((range, photo) => {
      const dateStr = photo.created_at || photo.uploadedAt;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!range.earliest || date < range.earliest) {
          range.earliest = date;
        }
        if (!range.latest || date > range.latest) {
          range.latest = date;
        }
      }
      return range;
    }, { earliest: null as Date | null, latest: null as Date | null });

    const cameras = photos.reduce((acc, photo) => {
      const camera = photo.metadata?.camera_model;
      if (camera) {
        acc[camera] = (acc[camera] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const locations = photos.reduce((acc, photo) => {
      const location = photo.metadata?.location_name;
      if (location) {
        acc[location] = (acc[location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCount: photos.length,
      totalSize,
      fileTypes,
      dateRange,
      cameras,
      locations,
      averageSize: photos.length > 0 ? totalSize / photos.length : 0
    };
  }, []);

  // 自動分類の提案
  const suggestGrouping = useCallback((photos: Photo[]): GroupCriteria => {
    const stats = calculateStats(photos);
    
    // 日付の範囲に基づいて最適なグループ化を提案
    if (stats.dateRange.earliest && stats.dateRange.latest) {
      const daysDiff = Math.ceil(
        (stats.dateRange.latest.getTime() - stats.dateRange.earliest.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff <= 7) {
        return { by: 'date', showCount: true };
      } else if (daysDiff <= 365) {
        return { by: 'month', showCount: true };
      } else {
        return { by: 'year', showCount: true };
      }
    }

    // 場所の多様性をチェック
    if (Object.keys(stats.locations).length > 2) {
      return { by: 'location', showCount: true };
    }

    // デフォルトは日付グループ
    return { by: 'month', showCount: true };
  }, [calculateStats]);

  // 重複写真の検出
  const findDuplicates = useCallback((photos: Photo[]) => {
    const duplicates: Photo[][] = [];
    const processed = new Set<string>();

    photos.forEach(photo => {
      if (processed.has(photo.id)) return;

      const similar = photos.filter(other => 
        other.id !== photo.id &&
        !processed.has(other.id) &&
        (
          // ファイル名が似ている
          other.original_filename === photo.original_filename ||
          // サイズが同じ
          (other.file_size === photo.file_size && 
           other.width === photo.width && 
           other.height === photo.height) ||
          // 撮影日時が近い（1秒以内）
          ((() => {
            const otherDateStr = other.created_at || other.uploadedAt;
            const photoDateStr = photo.created_at || photo.uploadedAt;
            if (otherDateStr && photoDateStr) {
              return Math.abs(
                new Date(otherDateStr).getTime() - 
                new Date(photoDateStr).getTime()
              ) < 1000;
            }
            return false;
          })())
        )
      );

      if (similar.length > 0) {
        const group = [photo, ...similar];
        duplicates.push(group);
        group.forEach(p => processed.add(p.id));
      }
    });

    return duplicates;
  }, []);

  // プリセットの管理
  const presets = {
    recent: {
      sort: { field: 'date' as const, order: 'desc' as const },
      group: { by: 'date' as const, showCount: true },
      filter: {}
    },
    byMonth: {
      sort: { field: 'date' as const, order: 'desc' as const },
      group: { by: 'month' as const, showCount: true },
      filter: {}
    },
    byLocation: {
      sort: { field: 'date' as const, order: 'desc' as const },
      group: { by: 'location' as const, showCount: true },
      filter: {}
    },
    thisYear: {
      sort: { field: 'date' as const, order: 'desc' as const },
      group: { by: 'month' as const, showCount: true },
      filter: {
        dateRange: {
          start: new Date(new Date().getFullYear(), 0, 1).toISOString(),
          end: new Date().toISOString()
        }
      }
    }
  };

  const applyPreset = (presetName: keyof typeof presets) => {
    const preset = presets[presetName];
    setSortCriteria(preset.sort);
    setGroupCriteria(preset.group);
    setFilterCriteria(preset.filter);
  };

  return {
    // 設定
    sortCriteria,
    groupCriteria,
    filterCriteria,
    setSortCriteria,
    setGroupCriteria,
    setFilterCriteria,

    // 処理関数
    sortPhotos,
    filterPhotos,
    groupPhotos,
    calculateStats,
    suggestGrouping,
    findDuplicates,

    // プリセット
    presets,
    applyPreset,
  };
};