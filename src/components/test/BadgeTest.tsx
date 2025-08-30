// src/components/test/BadgeTest.tsx - デバッグ強化版
import React, { useState, useEffect, useCallback } from 'react';
import { NewCommentBadge } from '../ui/NewCommentBadge';
import { useNewCommentBadge } from '../../hooks/ui/useNewCommentBadge';
import { useApp } from '../../context/AppContext';
import { useAlbums } from '../../hooks/useAlbums';
import { usePhotos } from '../../hooks/usePhotos';

/**
 * NewCommentBadge の動作確認用テストコンポーネント（デバッグ強化版）
 * 実装完了後は削除予定
 */
export const BadgeTest: React.FC = () => {
  const { user, profile, currentAlbum } = useApp();
  const { albums, loading: albumsLoading, error: albumsError, initialized, fetchAlbums } = useAlbums();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const { photos } = usePhotos(selectedAlbumId);

  // 強制初期化関数
  const handleForceInit = useCallback(async () => {
    console.log('強制初期化実行');
    await fetchAlbums();
  }, [fetchAlbums]);

  // 実際のIDを動的に取得
  const actualAlbumId = selectedAlbumId || currentAlbum?.id || albums[0]?.id || '';
  const actualPhotoId = photos[0]?.id || '';

  // デバッグ情報の出力
  useEffect(() => {
    console.log('=== BadgeTest Debug Info ===');
    console.log('Current User:', { 
      userId: user?.id, 
      profileId: profile?.id,
      profileName: profile?.name 
    });
    console.log('Albums:', { 
      albumsCount: albums.length, 
      albumIds: albums.map(a => ({ id: a.id, title: a.title })).slice(0, 3)
    });
    console.log('Selected Album:', { 
      selectedAlbumId, 
      currentAlbumId: currentAlbum?.id,
      actualAlbumId 
    });
    console.log('Photos:', { 
      photosCount: photos.length, 
      photoIds: photos.map(p => ({ id: p.id, filename: p.original_filename })).slice(0, 3)
    });
    console.log('Target IDs:', { actualAlbumId, actualPhotoId });
    console.log('============================');
  }, [user, profile, albums, selectedAlbumId, currentAlbum, actualAlbumId, photos, actualPhotoId]);

  // アルバム選択の初期設定
  useEffect(() => {
    if (!selectedAlbumId && albums.length > 0) {
      setSelectedAlbumId(albums[0].id);
    }
  }, [albums, selectedAlbumId]);

  // 写真レベルのバッジテスト（条件付き実行）
  const photoResult = useNewCommentBadge({
    targetId: actualPhotoId,
    targetType: 'photo',
    enabled: !!actualPhotoId && !!user?.id
  });

  // アルバムレベルのバッジテスト（条件付き実行）
  const albumResult = useNewCommentBadge({
    targetId: actualAlbumId,
    targetType: 'album',
    enabled: !!actualAlbumId && !!user?.id
  });

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        NewCommentBadge テスト（デバッグ版）
      </h1>

      {/* デバッグ情報セクション */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4 text-yellow-800">デバッグ情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-yellow-700">認証情報</h3>
            <p><strong>User ID:</strong> {user?.id || 'なし'}</p>
            <p><strong>Profile ID:</strong> {profile?.id || 'なし'}</p>
            <p><strong>Profile Name:</strong> {profile?.name || 'なし'}</p>
          </div>
          <div>
            <h3 className="font-medium text-yellow-700">データ状況</h3>
            <p><strong>アルバム数:</strong> {albums.length}</p>
            <p><strong>写真数:</strong> {photos.length}</p>
            <p><strong>実際のアルバムID:</strong> {actualAlbumId || '未選択'}</p>
            <p><strong>実際の写真ID:</strong> {actualPhotoId || '未選択'}</p>
          </div>
        </div>

        {/* アルバム選択 */}
        {albums.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-yellow-700 mb-2">
              テスト用アルバム選択
            </label>
            <select
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              className="border border-yellow-300 rounded px-3 py-2 text-sm"
            >
              {albums.map(album => (
                <option key={album.id} value={album.id}>
                  {album.title} ({album.photo_count || 0}枚)
                </option>
              ))}
            </select>
          </div>
        )}
        {/* 強制初期化ボタン */}
        {!initialized && (
          <div className="mt-4">
            <button
              onClick={handleForceInit}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              disabled={albumsLoading}
            >
              useAlbums 強制初期化
            </button>
          </div>
        )}
      </div>

      {/* 条件チェック */}
      {!user?.id && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700">⚠️ ユーザー認証が完了していません</p>
        </div>
      )}

      {albums.length === 0 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <p className="text-orange-700">⚠️ アルバムが見つかりません</p>
        </div>
      )}

      {photos.length === 0 && selectedAlbumId && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <p className="text-orange-700">⚠️ 選択したアルバムに写真がありません</p>
        </div>
      )}

      {/* Hook状態表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 写真レベルの状態 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">写真レベル Hook状態</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Enabled:</strong> {(!!actualPhotoId && !!user?.id) ? 'Yes' : 'No'}</p>
            <p><strong>Target ID:</strong> {actualPhotoId || 'なし'}</p>
            <p><strong>Loading:</strong> {photoResult.loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {photoResult.error || 'None'}</p>
            <p><strong>New Comments:</strong> {photoResult.newCommentCount}</p>
            <p><strong>Has New:</strong> {photoResult.hasNewComments ? 'Yes' : 'No'}</p>
            <p><strong>Last Seen:</strong> {photoResult.lastSeenAt || 'Never'}</p>
          </div>
          
          <div className="mt-4 space-x-2">
            <button
              onClick={photoResult.refresh}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={photoResult.loading || !actualPhotoId}
            >
              リフレッシュ
            </button>
            
            <button
              onClick={photoResult.markAsSeen}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={photoResult.loading || !actualPhotoId}
            >
              既読にする
            </button>
          </div>
        </div>

        {/* アルバムレベルの状態 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">アルバムレベル Hook状態</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Enabled:</strong> {(!!actualAlbumId && !!user?.id) ? 'Yes' : 'No'}</p>
            <p><strong>Target ID:</strong> {actualAlbumId || 'なし'}</p>
            <p><strong>Loading:</strong> {albumResult.loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {albumResult.error || 'None'}</p>
            <p><strong>Has New:</strong> {albumResult.hasNewComments ? 'Yes' : 'No'}</p>
            <p><strong>Last Seen:</strong> {albumResult.lastSeenAt || 'Never'}</p>
          </div>
          
          <button
            onClick={albumResult.refresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={albumResult.loading || !actualAlbumId}
          >
            リフレッシュ
          </button>
        </div>
      </div>

      {/* バッジ表示テスト */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-6">バッジ表示テスト</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 写真レベルバッジ */}
          <div className="space-y-4">
            <h3 className="font-medium">写真レベルバッジ</h3>
            
            {/* 実際の新着数 */}
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-sm">
                実データ
              </div>
              <NewCommentBadge
                count={photoResult.newCommentCount}
                variant="photo"
                size="md"
              />
            </div>
          </div>

          {/* アルバムレベルバッジ */}
          <div className="space-y-4">
            <h3 className="font-medium">アルバムレベルバッジ</h3>
            
            <div className="relative inline-block">
              <div className="w-32 h-24 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-sm">
                実データ
              </div>
              <NewCommentBadge
                hasNew={albumResult.hasNewComments}
                variant="album"
                size="md"
              />
            </div>
          </div>

          {/* 固定値テスト */}
          <div className="space-y-4">
            <h3 className="font-medium">固定値テスト</h3>
            
            {/* 大きい数字 */}
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-sm">
                99+
              </div>
              <NewCommentBadge
                count={150}
                variant="photo"
                size="md"
              />
            </div>
            
            {/* クリック可能 */}
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-sm">
                クリック
              </div>
              <NewCommentBadge
                count={5}
                variant="photo"
                size="md"
                onClick={() => alert('バッジがクリックされました！')}
              />
            </div>

            {/* アルバムドット */}
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-sm">
                ドット
              </div>
              <NewCommentBadge
                hasNew={true}
                variant="album"
                size="md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};