import React, { useState } from 'react';
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    setSelectedFiles(validFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
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

    try {
      setIsUploading(true);
      await uploadPhotos(selectedFiles, currentAlbum.id);
      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('アップロードエラー:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">写真・動画をアップロード</h2>

        {/* ドラッグ&ドロップエリア */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            isDragging
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50'
          }`}
        >
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ファイルをドラッグ&ドロップ
          </h3>
          <p className="text-gray-600 mb-4">
            または下のボタンからファイルを選択してください
          </p>
          
          <label htmlFor="file-upload">
            <Button variant="primary" className="cursor-pointer">
              ファイルを選択
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          
          <p className="text-sm text-gray-500 mt-4">
            対応形式: JPEG, PNG, WebP, MP4, MOV, AVI<br />
            最大サイズ: 画像 10MB、動画 100MB
          </p>
        </div>

        {/* 選択されたファイル一覧 */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">
              選択されたファイル ({selectedFiles.length}個)
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg">
                      {file.type.startsWith('image/') ? (
                        <Image size={20} className="text-orange-500" />
                      ) : (
                        <Film size={20} className="text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X size={16} className="text-gray-500" />
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
            <div className="space-y-3 max-h-40 overflow-y-auto">
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
                        {progress.status === 'compressing' && '圧縮中'}
                        {progress.status === 'uploading' && 'アップロード中'}
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
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading || !currentAlbum}
          >
            {isUploading ? 'アップロード中...' : `アップロード (${selectedFiles.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};