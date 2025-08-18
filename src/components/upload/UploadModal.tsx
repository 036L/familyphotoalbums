// src/components/upload/UploadModal.tsx - 修正版
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, Image, Film, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import type { Album } from '../../types/core';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAlbum?: Album | null;
  className?: string;
}

interface SelectedFile extends File {
  id: string;
  preview?: string;
  isValid?: boolean;
  error?: string;
}

const DEFAULT_CONFIG = {
  maxFiles: 50,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'video/mp4', 
    'video/mov', 
    'video/avi', 
    'video/webm'
  ],
};

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  targetAlbum = null,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Array<{
    fileId: string;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
  }>>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentAlbum, uploadPhotos } = useApp();

  const targetUploadAlbum = useMemo(() => {
    return targetAlbum || currentAlbum;
  }, [targetAlbum, currentAlbum]);

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (!DEFAULT_CONFIG.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `サポートされていないファイル形式です（${file.type}）`
      };
    }

    if (file.size > DEFAULT_CONFIG.maxFileSize) {
      const maxSizeMB = Math.round(DEFAULT_CONFIG.maxFileSize / (1024 * 1024));
      return {
        isValid: false,
        error: `ファイルサイズが大きすぎます（最大${maxSizeMB}MB）`
      };
    }

    return { isValid: true };
  }, []);

  const createFilePreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  const processFiles = useCallback((files: File[]) => {
    if (selectedFiles.length + files.length > DEFAULT_CONFIG.maxFiles) {
      setError(`ファイル数が上限を超えています（最大${DEFAULT_CONFIG.maxFiles}ファイル）`);
      return;
    }

    const processedFiles: SelectedFile[] = files
      .filter(file => {
        const isDuplicate = selectedFiles.some(selected => 
          selected.name === file.name && selected.size === file.size
        );
        if (isDuplicate) {
          console.warn(`重複ファイルをスキップ: ${file.name}`);
        }
        return !isDuplicate;
      })
      .map(file => {
        const validation = validateFile(file);
        const processedFile: SelectedFile = Object.assign(file, {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          preview: createFilePreview(file),
          isValid: validation.isValid,
          error: validation.error
        });
        return processedFile;
      });

    setSelectedFiles(prev => [...prev, ...processedFiles]);
    setError(null);
  }, [selectedFiles, validateFile, createFilePreview]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      processFiles(fileArray);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [processFiles]);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(files => {
      return files.filter(file => {
        if (file.id === fileId) {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
          return false;
        }
        return true;
      });
    });
  }, []);

  const clearAllFiles = useCallback(() => {
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    setUploadProgress([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles]);

  const handleUpload = useCallback(async () => {
    if (!targetUploadAlbum || selectedFiles.length === 0) {
      setError('アップロード先のアルバムが選択されていません');
      return;
    }

    const validFiles = selectedFiles.filter(file => file.isValid);
    if (validFiles.length === 0) {
      setError('アップロード可能なファイルがありません');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // 進行状況を初期化
      const initialProgress = validFiles.map(file => ({
        fileId: file.id,
        progress: 0,
        status: 'pending' as const,
      }));
      setUploadProgress(initialProgress);

      // 1つずつ順番にアップロード（デモモード用の改善）
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        try {
          // 進行状況を更新
          setUploadProgress(prev => 
            prev.map(item => 
              item.fileId === file.id 
                ? { ...item, status: 'uploading', progress: 20 }
                : item
            )
          );

          // 人工的な遅延（デモモード用）
          await new Promise(resolve => setTimeout(resolve, 500));

          setUploadProgress(prev => 
            prev.map(item => 
              item.fileId === file.id 
                ? { ...item, progress: 60 }
                : item
            )
          );

          await new Promise(resolve => setTimeout(resolve, 500));

          setUploadProgress(prev => 
            prev.map(item => 
              item.fileId === file.id 
                ? { ...item, progress: 100, status: 'completed' }
                : item
            )
          );

        } catch (fileError) {
          console.error(`ファイル ${file.name} のアップロードに失敗:`, fileError);
          setUploadProgress(prev => 
            prev.map(item => 
              item.fileId === file.id 
                ? { 
                    ...item, 
                    status: 'error', 
                    error: fileError instanceof Error ? fileError.message : 'アップロードに失敗しました'
                  }
                : item
            )
          );
        }
      }

      // 実際のアップロード処理を呼び出し
      await uploadPhotos(validFiles, targetUploadAlbum.id);
      
      // 成功時のクリーンアップ
      clearAllFiles();
      
      // 少し遅延してからモーダルを閉じる
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('アップロードエラー:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'アップロードに失敗しました。もう一度お試しください。'
      );
    } finally {
      setIsUploading(false);
    }
  }, [targetUploadAlbum, selectedFiles, uploadPhotos, clearAllFiles, onClose]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const fileStats = useMemo(() => {
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const validFiles = selectedFiles.filter(file => file.isValid);
    const invalidFiles = selectedFiles.filter(file => !file.isValid);
    
    return {
      totalCount: selectedFiles.length,
      validCount: validFiles.length,
      invalidCount: invalidFiles.length,
      totalSize,
      canUpload: validFiles.length > 0 && invalidFiles.length === 0
    };
  }, [selectedFiles]);

  const acceptedTypesDisplay = useMemo(() => {
    const imageTypes = DEFAULT_CONFIG.allowedTypes
      .filter(type => type.startsWith('image/'))
      .map(type => type.split('/')[1].toUpperCase());
    const videoTypes = DEFAULT_CONFIG.allowedTypes
      .filter(type => type.startsWith('video/'))
      .map(type => type.split('/')[1].toUpperCase());
    
    const parts = [];
    if (imageTypes.length > 0) {
      parts.push(`画像: ${imageTypes.join(', ')}`);
    }
    if (videoTypes.length > 0) {
      parts.push(`動画: ${videoTypes.join(', ')}`);
    }
    
    return parts.join(' / ');
  }, []);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className={`w-full max-w-4xl ${className}`}
    >
      <div className="p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">写真・動画をアップロード</h2>
            {targetUploadAlbum && (
              <p className="text-sm text-gray-600 mt-1">
                アップロード先: {targetUploadAlbum.title}
              </p>
            )}
          </div>
          {selectedFiles.length > 0 && !isUploading && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllFiles}
              className="text-sm"
            >
              すべてクリア
            </Button>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">{error}</h4>
              </div>
            </div>
          </div>
        )}

        {/* ドラッグ&ドロップエリア */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
            isDragging
              ? 'border-orange-400 bg-orange-50 scale-[1.02]'
              : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50'
          }`}
        >
          <div className={`transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}>
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ファイルをドラッグ&ドロップ
            </h3>
            <p className="text-gray-600 mb-4">
              または下のボタンからファイルを選択してください
            </p>
            
            <Button 
              type="button"
              variant="primary" 
              onClick={handleFileButtonClick}
              disabled={isUploading}
            >
              ファイルを選択
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={DEFAULT_CONFIG.allowedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-500">
                <strong>対応形式:</strong> {acceptedTypesDisplay}
              </p>
              <p className="text-xs text-gray-400">
                最大{Math.round(DEFAULT_CONFIG.maxFileSize / (1024 * 1024))}MB、
                最大{DEFAULT_CONFIG.maxFiles}ファイル
              </p>
            </div>
          </div>
        </div>

        {/* ファイル統計 */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{fileStats.totalCount}</div>
                <div className="text-xs text-gray-600">選択中</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{fileStats.validCount}</div>
                <div className="text-xs text-gray-600">有効</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{fileStats.invalidCount}</div>
                <div className="text-xs text-gray-600">無効</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{formatFileSize(fileStats.totalSize)}</div>
                <div className="text-xs text-gray-600">合計サイズ</div>
              </div>
            </div>
          </div>
        )}

        {/* 選択されたファイル一覧 */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">
              選択されたファイル
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-xl p-3">
              {selectedFiles.map((file) => (
                <div 
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    file.isValid 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* ファイルプレビューまたはアイコン */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      file.isValid ? 'bg-white' : 'bg-red-100'
                    }`}>
                      {file.preview ? (
                        <img 
                          src={file.preview} 
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : file.type.startsWith('image/') ? (
                        <Image size={20} className={file.isValid ? 'text-orange-500' : 'text-red-500'} />
                      ) : file.type.startsWith('video/') ? (
                        <Film size={20} className={file.isValid ? 'text-blue-500' : 'text-red-500'} />
                      ) : (
                        <FileText size={20} className="text-gray-500" />
                      )}
                    </div>
                    
                    {/* ファイル情報 */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.type}</span>
                      </div>
                      {file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* 削除ボタン */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors ml-2 flex-shrink-0"
                    title="ファイルを削除"
                    disabled={isUploading}
                  >
                    <X size={16} className="text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* アップロード進行状況 */}
        {uploadProgress.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">
              アップロード進行状況
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto border rounded-xl p-3">
              {uploadProgress.map((progress) => {
                const file = selectedFiles.find(f => f.id === progress.fileId);
                return (
                  <div key={progress.fileId} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {file?.name || 'Unknown file'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {progress.status === 'completed' && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                        {progress.status === 'error' && (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {progress.status === 'pending' && '待機中...'}
                          {progress.status === 'uploading' && 'アップロード中...'}
                          {progress.status === 'completed' && '完了'}
                          {progress.status === 'error' && 'エラー'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress.status === 'error' 
                            ? 'bg-red-500' 
                            : progress.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    {progress.error && (
                      <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-100">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isUploading}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!fileStats.canUpload || isUploading || !targetUploadAlbum}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>アップロード中...</span>
              </div>
            ) : (
              `アップロード (${fileStats.validCount})`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};