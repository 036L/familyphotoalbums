// src/components/upload/UploadModal.tsx
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Upload, X, Image, Film, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import type { Album } from '../../types/core';

// Props型の厳密な定義
interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAlbum?: Album | null;
  className?: string;
  // 制限設定
  maxFiles?: number;
  maxFileSize?: number; // バイト単位
  allowedTypes?: string[];
  // コールバック
  onUploadStart?: (files: File[]) => void;
  onUploadComplete?: (uploadedCount: number) => void;
  onUploadError?: (error: UploadError) => void;
  // 表示オプション
  showFileList?: boolean;
  showProgress?: boolean;
  // アクセシビリティ
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// ファイル検証結果の型
interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// アップロードエラーの型
interface UploadError {
  type: 'FILE_SIZE' | 'FILE_TYPE' | 'FILE_COUNT' | 'UPLOAD_FAILED' | 'ALBUM_NOT_FOUND';
  message: string;
  fileName?: string;
  details?: string;
}

// ファイル情報の拡張型
interface SelectedFile extends File {
  id: string;
  preview?: string;
  validationResult?: FileValidationResult;
}

// デフォルト設定
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
  imageMaxSize: 10 * 1024 * 1024, // 10MB
  videoMaxSize: 100 * 1024 * 1024, // 100MB
};

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  targetAlbum = null,
  className = '',
  maxFiles = DEFAULT_CONFIG.maxFiles,
  maxFileSize = DEFAULT_CONFIG.maxFileSize,
  allowedTypes = DEFAULT_CONFIG.allowedTypes,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  showFileList = true,
  showProgress = true,
  ariaLabel = 'ファイルアップロードモーダル',
  ariaDescribedBy,
}) => {
  // すべてのHooksをトップレベルで宣言（Hooksルール遵守）
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentAlbum, uploadPhotos, uploadProgress } = useApp();

  // 実際のアップロード対象アルバムを決定
  const targetUploadAlbum = useMemo(() => {
    return targetAlbum || currentAlbum;
  }, [targetAlbum, currentAlbum]);

  // エラーハンドリング用のユーティリティ関数
  const handleError = useCallback((error: UploadError) => {
    console.error('[UploadModal] エラー:', error);
    setError(error);
    onUploadError?.(error);

    // エラータイプに応じた自動回復処理
    switch (error.type) {
      case 'ALBUM_NOT_FOUND':
        // アルバムが見つからない場合は自動でモーダルを閉じる
        setTimeout(onClose, 3000);
        break;
      case 'FILE_COUNT':
        // ファイル数超過の場合は制限以内のファイルのみ残す
        setSelectedFiles(prev => prev.slice(0, maxFiles));
        break;
    }
  }, [onUploadError, onClose, maxFiles]);

  // エラークリア
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ファイル検証関数
  const validateFile = useCallback((file: File): FileValidationResult => {
    // ファイル形式チェック
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `サポートされていないファイル形式です（${file.type}）`
      };
    }

    // ファイルサイズチェック
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const maxSize = isImage ? DEFAULT_CONFIG.imageMaxSize : 
                   isVideo ? DEFAULT_CONFIG.videoMaxSize : maxFileSize;

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        isValid: false,
        error: `ファイルサイズが大きすぎます（最大${maxSizeMB}MB）`
      };
    }

    // ファイル名の検証
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: 'ファイル名が長すぎます（最大255文字）'
      };
    }

    return { isValid: true };
  }, [allowedTypes, maxFileSize]);

  // プレビューURL作成（メモリリークを防ぐため適切に管理）
  const createFilePreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  // ファイル処理の共通ロジック
  const processFiles = useCallback((files: File[]) => {
    // ファイル数制限チェック
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      handleError({
        type: 'FILE_COUNT',
        message: `ファイル数が上限を超えています（最大${maxFiles}ファイル）`,
        details: `現在：${selectedFiles.length}、追加：${files.length}、上限：${maxFiles}`
      });
      return;
    }

    const processedFiles: SelectedFile[] = files
      .filter(file => {
        // 重複チェック
        const isDuplicate = selectedFiles.some(selected => 
          selected.name === file.name && selected.size === file.size
        );
        if (isDuplicate) {
          console.warn(`重複ファイルをスキップ: ${file.name}`);
        }
        return !isDuplicate;
      })
      .map(file => {
        const validationResult = validateFile(file);
        const processedFile: SelectedFile = Object.assign(file, {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          preview: createFilePreview(file),
          validationResult
        });
        return processedFile;
      });

    setSelectedFiles(prev => [...prev, ...processedFiles]);
    clearError();
  }, [selectedFiles, maxFiles, validateFile, createFilePreview, handleError, clearError]);

  // ドラッグ&ドロップイベントハンドラー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // 子要素への移動を検出して誤った離脱を防ぐ
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
    const validFiles = droppedFiles.filter(file => 
      allowedTypes.includes(file.type)
    );
    
    if (validFiles.length !== droppedFiles.length) {
      const invalidCount = droppedFiles.length - validFiles.length;
      handleError({
        type: 'FILE_TYPE',
        message: `${invalidCount}個のファイルがサポートされていない形式のため除外されました`,
      });
    }
    
    if (validFiles.length > 0) {
      processFiles(validFiles);
    }
  }, [allowedTypes, processFiles, handleError]);

  // ファイル選択イベントハンドラー
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => 
        allowedTypes.includes(file.type)
      );
      processFiles(validFiles);
      
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [allowedTypes, processFiles]);

  // ファイル選択ボタンのクリックハンドラー
  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ファイル削除
  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(files => {
      const updatedFiles = files.filter(file => {
        if (file.id === fileId) {
          // プレビューURLを解放してメモリリークを防ぐ
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
          return false;
        }
        return true;
      });
      return updatedFiles;
    });
  }, []);

  // すべてのファイルをクリア
  const clearAllFiles = useCallback(() => {
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles]);

  // アップロード処理
  const handleUpload = useCallback(async () => {
    if (!targetUploadAlbum || selectedFiles.length === 0) {
      handleError({
        type: 'ALBUM_NOT_FOUND',
        message: 'アップロード先のアルバムが選択されていません',
      });
      return;
    }

    // ファイル検証
    const invalidFiles = selectedFiles.filter(file => !file.validationResult?.isValid);
    if (invalidFiles.length > 0) {
      handleError({
        type: 'FILE_TYPE',
        message: `${invalidFiles.length}個のファイルに問題があります。修正してください。`,
        details: invalidFiles.map(f => `${f.name}: ${f.validationResult?.error}`).join(', ')
      });
      return;
    }

    const validFiles = selectedFiles.filter(file => file.validationResult?.isValid);
    if (validFiles.length === 0) {
      handleError({
        type: 'FILE_TYPE',
        message: 'アップロード可能なファイルがありません',
      });
      return;
    }

    try {
      setIsUploading(true);
      clearError();
      onUploadStart?.(validFiles);
      
      await uploadPhotos(validFiles, targetUploadAlbum.id);
      
      onUploadComplete?.(validFiles.length);
      clearAllFiles();
      onClose();
    } catch (error) {
      handleError({
        type: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'アップロードに失敗しました。もう一度お試しください。',
        details: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsUploading(false);
    }
  }, [targetUploadAlbum, selectedFiles, handleError, clearError, onUploadStart, uploadPhotos, onUploadComplete, clearAllFiles, onClose]);

  // ファイルサイズフォーマット
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 統計情報の計算
  const fileStats = useMemo(() => {
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const validFiles = selectedFiles.filter(file => file.validationResult?.isValid);
    const invalidFiles = selectedFiles.filter(file => !file.validationResult?.isValid);
    
    return {
      totalCount: selectedFiles.length,
      validCount: validFiles.length,
      invalidCount: invalidFiles.length,
      totalSize,
      canUpload: validFiles.length > 0 && invalidFiles.length === 0
    };
  }, [selectedFiles]);

  // 受け入れ可能なファイル形式の表示用文字列
  const acceptedTypesDisplay = useMemo(() => {
    const imageTypes = allowedTypes.filter(type => type.startsWith('image/')).map(type => type.split('/')[1].toUpperCase());
    const videoTypes = allowedTypes.filter(type => type.startsWith('video/')).map(type => type.split('/')[1].toUpperCase());
    
    const parts = [];
    if (imageTypes.length > 0) {
      parts.push(`画像: ${imageTypes.join(', ')}`);
    }
    if (videoTypes.length > 0) {
      parts.push(`動画: ${videoTypes.join(', ')}`);
    }
    
    return parts.join(' / ');
  }, [allowedTypes]);

  // クリーンアップ：モーダルが閉じられたときにプレビューURLを解放
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  // アップロード不可の理由を取得
  const getUploadDisabledReason = useCallback(() => {
    if (!targetUploadAlbum) return 'アルバムが選択されていません';
    if (selectedFiles.length === 0) return 'ファイルが選択されていません';
    if (!fileStats.canUpload) return '無効なファイルが含まれています';
    if (isUploading) return 'アップロード中です';
    return null;
  }, [targetUploadAlbum, selectedFiles.length, fileStats.canUpload, isUploading]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className={`w-full max-w-4xl ${className}`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
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
          {selectedFiles.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAllFiles}
              className="text-sm"
              disabled={isUploading}
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
                <h4 className="text-sm font-medium text-red-800">{error.message}</h4>
                {error.details && (
                  <p className="text-xs text-red-600 mt-1">{error.details}</p>
                )}
                <button
                  onClick={clearError}
                  className="text-xs text-red-600 hover:text-red-800 underline mt-2"
                >
                  エラーを閉じる
                </button>
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
          role="button"
          tabIndex={0}
          aria-label="ファイルをドラッグ&ドロップまたはクリックして選択"
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
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />
            
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-500">
                <strong>対応形式:</strong> {acceptedTypesDisplay}
              </p>
              <p className="text-xs text-gray-400">
                画像最大{Math.round(DEFAULT_CONFIG.imageMaxSize / (1024 * 1024))}MB、
                動画最大{Math.round(DEFAULT_CONFIG.videoMaxSize / (1024 * 1024))}MB、
                最大{maxFiles}ファイル
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
        {showFileList && selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">
              選択されたファイル
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-xl p-3">
              {selectedFiles.map((file) => (
                <div 
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    file.validationResult?.isValid 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* ファイルプレビューまたはアイコン */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      file.validationResult?.isValid ? 'bg-white' : 'bg-red-100'
                    }`}>
                      {file.preview ? (
                        <img 
                          src={file.preview} 
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : file.type.startsWith('image/') ? (
                        <Image size={20} className={file.validationResult?.isValid ? 'text-orange-500' : 'text-red-500'} />
                      ) : file.type.startsWith('video/') ? (
                        <Film size={20} className={file.validationResult?.isValid ? 'text-blue-500' : 'text-red-500'} />
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
                      {file.validationResult?.error && (
                        <p className="text-xs text-red-600 mt-1">{file.validationResult.error}</p>
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
        {showProgress && uploadProgress.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">
              アップロード進行状況
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto border rounded-xl p-3">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {progress.file.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      {progress.status === 'completed' && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                      {progress.status === 'error' && (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                      <span className="text-xs text-gray-500">
                        {progress.status === 'compressing' && '圧縮中...'}
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
              ))}
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
            title={getUploadDisabledReason() || undefined}
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

        {/* ヘルプテキスト */}
        {getUploadDisabledReason() && (
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">{getUploadDisabledReason()}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};