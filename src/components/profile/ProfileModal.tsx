import React, { useState } from 'react';
import { User, Camera, Save, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useApp } from '../../context/AppContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const { profile, updateProfile } = useApp();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
      });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('画像ファイルは5MB以下にしてください');
        return;
      }

      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください');
        return;
      }

      setAvatarFile(file);
      setError('');

      // プレビュー用URLを作成
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 名前の必須チェック
      if (!formData.name.trim()) {
        setError('名前を入力してください');
        return;
      }

      let avatarUrl = profile?.avatar_url;

      // アバター画像のアップロード
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      // プロフィール更新
      await updateProfile({
        name: formData.name.trim(),
        avatar_url: avatarUrl,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    // デモモードの場合は、ObjectURLを返す
    if (!import.meta.env.VITE_SUPABASE_URL) {
      return URL.createObjectURL(file);
    }

    // 実際のSupabaseアップロード処理をここに実装
    // 現在はプレースホルダー
    return Promise.resolve(URL.createObjectURL(file));
  };

  const handleClose = () => {
    // プレビューURLをクリーンアップ
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">プロフィール編集</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* アバター画像 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="プロフィール画像"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-200 flex items-center justify-center">
                    <User size={32} className="text-orange-600" />
                  </div>
                )}
              </div>
              
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <p className="text-sm text-gray-500 text-center">
              クリックして画像を変更<br />
              (最大5MB、JPEG/PNG)
            </p>
          </div>

          {/* 名前 */}
          <div>
            <Input
              label="名前"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="田中太郎"
              required
            />
          </div>

          {/* メールアドレス（読み取り専用） */}
          <div>
            <Input
              label="メールアドレス"
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              メールアドレスは変更できません
            </p>
          </div>

          {/* ロール表示 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              権限
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                {profile?.role === 'admin' && '管理者'}
                {profile?.role === 'editor' && '編集者'}
                {profile?.role === 'viewer' && '閲覧者'}
              </span>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{isLoading ? '更新中...' : '保存'}</span>
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};