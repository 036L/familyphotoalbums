// src/lib/imageCompression.ts
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
    quality: 0.8, // 品質80%
    ...options,
  };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const { width, height } = img;
      const maxSize = defaultOptions.maxWidthOrHeight;

      // アスペクト比を保持してサイズ調整
      let newWidth = width;
      let newHeight = height;

      if (width > height && width > maxSize) {
        newWidth = maxSize;
        newHeight = (height * maxSize) / width;
      } else if (height > maxSize) {
        newHeight = maxSize;
        newWidth = (width * maxSize) / height;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        file.type,
        defaultOptions.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

export const createThumbnail = async (
  file: File,
  maxSize: number = 300
): Promise<File> => {
  return compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: maxSize,
    quality: 0.7,
  });
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