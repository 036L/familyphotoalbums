import React, { useState, useEffect } from 'react';
import { 
  Info, 
  Calendar, 
  Camera, 
  MapPin, 
  FileText, 
  Ruler, 
  Clock,
  Eye,
  EyeOff,
  Copy,
  Check,
  LucideIcon
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PhotoMetadata {
  // 基本情報
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  width: number | null;
  height: number | null;
  created_at: string;
  
  // EXIF情報
  camera_make?: string;
  camera_model?: string;
  lens_model?: string;
  focal_length?: number;
  f_number?: number;
  iso?: number;
  exposure_time?: string;
  flash?: boolean;
  
  // 位置情報
  latitude?: number;
  longitude?: number;
  location_name?: string;
  
  // その他
  color_space?: string;
  orientation?: number;
  date_taken?: string;
  keywords?: string[];
  description?: string;
}

interface PhotoMetadataProps {
  photo: {
    id: string;
    filename: string;
    original_filename: string;
    file_size: number;
    file_type: 'image' | 'video';
    width: number | null;
    height: number | null;
    created_at: string;
    metadata?: Record<string, any>;
  };
  showSensitiveInfo?: boolean;
}

export const PhotoMetadata: React.FC<PhotoMetadataProps> = ({ 
  photo, 
  showSensitiveInfo = false 
}) => {
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null);
  const [showLocation, setShowLocation] = useState(showSensitiveInfo);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'camera' | 'technical'>('basic');

  useEffect(() => {
    // メタデータの準備（実際のアプリケーションではEXIFから抽出）
    const extractedMetadata: PhotoMetadata = {
      filename: photo.filename,
      original_filename: photo.original_filename,
      file_size: photo.file_size,
      file_type: photo.file_type,
      width: photo.width,
      height: photo.height,
      created_at: photo.created_at,
      
      // デモ用のEXIF情報
      camera_make: 'Apple',
      camera_model: 'iPhone 14 Pro',
      lens_model: 'iPhone 14 Pro back triple camera 2.22mm f/2.2',
      focal_length: 24,
      f_number: 2.2,
      iso: 100,
      exposure_time: '1/120',
      flash: false,
      
      // デモ用の位置情報
      latitude: 35.6762,
      longitude: 139.6503,
      location_name: '東京都, 日本',
      
      // その他の情報
      color_space: 'sRGB',
      orientation: 1,
      date_taken: '2024-01-15T10:30:00Z',
      keywords: ['家族', '旅行', '思い出'],
      description: '家族旅行での素敵な一枚',
      
      ...photo.metadata // 実際のメタデータがあれば上書き
    };

    setMetadata(extractedMetadata);
  }, [photo]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '不明';
    }
  };

  const formatResolution = (width: number | null, height: number | null): string => {
    if (!width || !height) return '不明';
    const megapixels = (width * height / 1000000).toFixed(1);
    return `${width} × ${height} (${megapixels}MP)`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('コピーに失敗:', error);
    }
  };

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getExposureValue = (fNumber?: number, exposureTime?: string, iso?: number): string => {
    if (!fNumber || !exposureTime || !iso) return '不明';
    
    // 簡易的なEV計算
    const shutterSpeed = eval(exposureTime); // 注意: 実際のアプリでは安全な解析を使用
    const ev = Math.log2((fNumber * fNumber) / shutterSpeed) - Math.log2(iso / 100);
    return `EV ${ev.toFixed(1)}`;
  };

  if (!metadata) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  const MetadataItem: React.FC<{
    icon: LucideIcon;
    label: string;
    value: string | null | undefined;
    copyable?: boolean;
    sensitive?: boolean;
  }> = ({ icon: Icon, label, value, copyable = false, sensitive = false }) => {
    if (!value) return null;

    const displayValue = sensitive && !showLocation ? '••••••' : value;

    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center space-x-3">
          <Icon size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-900 font-mono">{displayValue}</span>
          {copyable && !sensitive && (
            <button
              onClick={() => copyToClipboard(value, label)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="コピー"
            >
              {copied === label ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Copy size={12} className="text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Info size={20} className="text-blue-500" />
            <h3 className="font-semibold text-gray-900">ファイル情報</h3>
          </div>
          <div className="text-xs text-gray-500">
            {photo.file_type === 'image' ? '画像' : '動画'}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'basic', label: '基本情報', icon: FileText },
          { id: 'camera', label: 'カメラ', icon: Camera },
          { id: 'technical', label: '技術情報', icon: Ruler },
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <IconComponent size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {/* 基本情報タブ */}
        {activeTab === 'basic' && (
          <div className="space-y-1">
            <MetadataItem
              icon={FileText}
              label="ファイル名"
              value={metadata.original_filename}
              copyable
            />
            <MetadataItem
              icon={Ruler}
              label="ファイルサイズ"
              value={formatFileSize(metadata.file_size)}
            />
            <MetadataItem
              icon={Ruler}
              label="解像度"
              value={formatResolution(metadata.width, metadata.height)}
            />
            <MetadataItem
              icon={Calendar}
              label="撮影日時"
              value={metadata.date_taken ? formatDate(metadata.date_taken) : null}
            />
            <MetadataItem
              icon={Clock}
              label="アップロード日時"
              value={formatDate(metadata.created_at)}
            />
            
            {/* 位置情報セクション */}
            {(metadata.latitude && metadata.longitude) && (
              <>
                <div className="pt-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span>位置情報</span>
                    </h4>
                    <button
                      onClick={() => setShowLocation(!showLocation)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title={showLocation ? '位置情報を隠す' : '位置情報を表示'}
                    >
                      {showLocation ? (
                        <EyeOff size={14} className="text-gray-500" />
                      ) : (
                        <Eye size={14} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                <MetadataItem
                  icon={MapPin}
                  label="場所"
                  value={metadata.location_name || null}
                  sensitive
                />
                <MetadataItem
                  icon={MapPin}
                  label="座標"
                  value={metadata.latitude && metadata.longitude ? formatCoordinates(metadata.latitude, metadata.longitude) : null}
                  copyable
                  sensitive
                />
              </>
            )}
          </div>
        )}

        {/* カメラ情報タブ */}
        {activeTab === 'camera' && (
          <div className="space-y-1">
            <MetadataItem
              icon={Camera}
              label="メーカー"
              value={metadata.camera_make || null}
            />
            <MetadataItem
              icon={Camera}
              label="機種"
              value={metadata.camera_model || null}
            />
            <MetadataItem
              icon={Camera}
              label="レンズ"
              value={metadata.lens_model || null}
            />
            <MetadataItem
              icon={Camera}
              label="焦点距離"
              value={metadata.focal_length ? `${metadata.focal_length}mm` : null}
            />
            <MetadataItem
              icon={Camera}
              label="F値"
              value={metadata.f_number ? `f/${metadata.f_number}` : null}
            />
            <MetadataItem
              icon={Camera}
              label="シャッター速度"
              value={metadata.exposure_time ? `${metadata.exposure_time}秒` : null}
            />
            <MetadataItem
              icon={Camera}
              label="ISO感度"
              value={metadata.iso ? `ISO ${metadata.iso}` : null}
            />
            <MetadataItem
              icon={Camera}
              label="フラッシュ"
              value={metadata.flash !== undefined ? (metadata.flash ? '発光' : '非発光') : null}
            />
            <MetadataItem
              icon={Camera}
              label="露出値"
              value={getExposureValue(metadata.f_number, metadata.exposure_time, metadata.iso) !== '不明' ? getExposureValue(metadata.f_number, metadata.exposure_time, metadata.iso) : null}
            />
          </div>
        )}

        {/* 技術情報タブ */}
        {activeTab === 'technical' && (
          <div className="space-y-1">
            <MetadataItem
              icon={Ruler}
              label="ファイル形式"
              value={metadata.file_type.toUpperCase()}
            />
            <MetadataItem
              icon={Ruler}
              label="色空間"
              value={metadata.color_space || null}
            />
            <MetadataItem
              icon={Ruler}
              label="向き"
              value={metadata.orientation ? `方向 ${metadata.orientation}` : null}
            />
            <MetadataItem
              icon={FileText}
              label="説明"
              value={metadata.description || null}
            />
            {metadata.keywords && metadata.keywords.length > 0 && (
              <div className="py-2 border-b border-gray-100">
                <div className="flex items-start space-x-3">
                  <FileText size={16} className="text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">キーワード</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {metadata.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>最終更新: {formatDate(metadata.created_at)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2), 'メタデータ')}
            className="text-xs"
          >
            {copied === 'メタデータ' ? (
              <>
                <Check size={12} className="mr-1" />
                コピー済み
              </>
            ) : (
              <>
                <Copy size={12} className="mr-1" />
                JSON出力
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};