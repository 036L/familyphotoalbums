import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { AlbumGrid } from './components/album/AlbumGrid';
import { PhotoGrid } from './components/photo/PhotoGrid';
import { UploadModal } from './components/upload/UploadModal';
import { Button } from './components/ui/Button';

function AppContent() {
  const { isAuthenticated, currentAlbum, setCurrentAlbum, loading, createAlbum } = useApp();
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;

    try {
      await createAlbum({
        title: newAlbumTitle,
        description: newAlbumDescription || null,
        is_public: false,
      });
      setNewAlbumTitle('');
      setNewAlbumDescription('');
      setShowCreateAlbum(false);
    } catch (error) {
      console.error('アルバム作成エラー:', error);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Header onShowUpload={() => setShowUpload(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentAlbum ? (
          <div>
            {/* アルバム詳細ヘッダー */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentAlbum(null)}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>戻る</span>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentAlbum.title}
                  </h1>
                  {currentAlbum.description && (
                    <p className="text-gray-600 mt-1">
                      {currentAlbum.description}
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                onClick={() => setShowUpload(true)}
                className="flex items-center space-x-2"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">写真を追加</span>
              </Button>
            </div>

            {/* 写真グリッド */}
            <PhotoGrid />
          </div>
        ) : (
          <div>
            {/* アルバム一覧ヘッダー */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  家族のアルバム
                </h1>
                <p className="text-gray-600 mt-1">
                  大切な思い出をみんなで共有しましょう
                </p>
              </div>
              
              <Button 
                className="flex items-center space-x-2"
                onClick={() => setShowCreateAlbum(true)}
              >
                <Plus size={20} />
                <span className="hidden sm:inline">新しいアルバム</span>
              </Button>
            </div>

            {/* アルバムグリッド */}
            <AlbumGrid />
          </div>
        )}
      </main>

      {/* アップロードモーダル */}
      <UploadModal 
        isOpen={showUpload} 
        onClose={() => setShowUpload(false)} 
      />

      {/* アルバム作成モーダル */}
      <Modal isOpen={showCreateAlbum} onClose={() => setShowCreateAlbum(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">新しいアルバムを作成</h2>
          
          <form onSubmit={handleCreateAlbum} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アルバム名
              </label>
              <input
                type="text"
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                placeholder="例: 2024年家族旅行"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明（任意）
              </label>
              <textarea
                value={newAlbumDescription}
                onChange={(e) => setNewAlbumDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                placeholder="アルバムの説明を入力してください"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateAlbum(false)}
              >
                キャンセル
              </Button>
              <Button type="submit">
                作成
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;