import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const defaultOptions = {
    maxSizeMB: 2, // 2MB以下に圧縮
    maxWidthOrHeight: 1920, // 最大1920px
    useWebWorker: true,
    quality: 0.8, // 品質80%
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('画像圧縮エラー:', error);
    throw new Error('画像の圧縮に失敗しました');
  }
};

export const createThumbnail = async (
  file: File,
  maxSize: number = 300
): Promise<File> => {
  const thumbnailOptions = {
    maxSizeMB: 0.5, // 500KB以下
    maxWidthOrHeight: maxSize,
    useWebWorker: true,
    quality: 0.7,
  };

  try {
    const thumbnail = await imageCompression(file, thumbnailOptions);
    return thumbnail;
  } catch (error) {
    console.error('サムネイル作成エラー:', error);
    throw new Error('サムネイルの作成に失敗しました');
  }
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };
    
    img.src = url;
  });
};