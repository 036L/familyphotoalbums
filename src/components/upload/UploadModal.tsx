import React, { useState, useRef } from 'react';
import { Upload, X, Image, Film, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentAlbum, uploadPhotos, uploadProgress } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // リレイトテンプロート防止のためのチェック
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => 
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      setSelectedFiles(prev => [...prev, ...validFiles]);
      
      // ファイル入力をリセット（同じファイルを再選択できるように）
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const validateFile = (file: File): string | null => {
    // ファイルサイズチェック
    const maxSizeImage = 10 * 1024 * 1024; // 10MB
    const maxSizeVideo = 100 * 1024 * 1024; // 100MB
    
    if (file.type.startsWith('image/') && file.size > maxSizeImage) {
      return '画像ファイルは10MB以下にしてください';
    }
    
    if (file.type.startsWith('video/') && file.size > maxSizeVideo) {
      return '動画ファイルは100MB以下にしてください';
    }
    
    // ファイル形式チェック
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const supportedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
    
    if (file.type.startsWith('image/') && !supportedImageTypes.includes(file.type)) {
      return 'サポートされていない画像形式です';
    }
    
    if (file.type.startsWith('video/') && !supportedVideoTypes.includes(file.type)) {
      return 'サポートされていない動画形式です';
    }
    
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!currentAlbum || selectedFiles.length === 0) return;

    // ファイル検証
    const validationErrors: { [key: number]: string } = {};
    selectedFiles.forEach((file, index) => {
      const error = validateFile(file);
      if (error) {
        validationErrors[index] = error;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      alert('一部のファイルに問題があります。確認してください。');
      return;
    }

    try {
      setIsUploading(true);
      await uploadPhotos(selectedFiles, currentAlbum.id);
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('アップロードに失敗しました。もう一度お試しください。');
    } finally {
      setIsUploading(false);
    }
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">写真・動画をアップロード</h2>
          {selectedFiles.length > 0 && (
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

        {/* ドラッグ&ドロップエリア */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
            isDragging
              ? 'border-orange-400 bg-orange-50 scale-102'
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
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/mov,video/avi,video/webm"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <p className="text-sm text-gray-500 mt-4">
              <strong>対応形式:</strong><br />
              画像: JPEG, PNG, WebP, GIF (最大10MB)<br />
              動画: MP4, MOV, AVI, WebM (最大100MB)
            </p>
          </div>
        </div>

        {/* 選択されたファイル一覧 */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">
                選択されたファイル ({selectedFiles.length}個)
              </h3>
              <p className="text-sm text-gray-500">
                合計サイズ: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}
              </p>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-xl p-3">
              {selectedFiles.map((file, index) => {
                const validationError = validateFile(file);
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      validationError ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${
                        validationError ? 'bg-red-100' : 'bg-white'
                      }`}>
                        {file.type.startsWith('image/') ? (
                          <Image size={20} className={validationError ? 'text-red-500' : 'text-orange-500'} />
                        ) : (
                          <Film size={20} className={validationError ? 'text-red-500' : 'text-blue-500'} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        {validationError && (
                          <p className="text-xs text-red-600 mt-1">{validationError}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-100 rounded-full transition-colors ml-2"
                      title="ファイルを削除"
                    >
                      <X size={16} className="text-gray-500 hover:text-red-500" />
                    </button>
                  </div>
                );
              })}
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

        {/* アップロードボタン */}
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
            disabled={selectedFiles.length === 0 || isUploading || !currentAlbum}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>アップロード中...</span>
              </div>
            ) : (
              `アップロード (${selectedFiles.length})`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};