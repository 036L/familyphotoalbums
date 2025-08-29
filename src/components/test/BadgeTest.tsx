// src/components/test/BadgeTest.tsx - テスト用コンポーネント（一時的）
import React, { useState } from 'react';
import { NewCommentBadge } from '../ui/NewCommentBadge';
import { useNewCommentBadge } from '../../hooks/ui/useNewCommentBadge';

/**
 * NewCommentBadge の動作確認用テストコンポーネント
 * 実装完了後は削除予定
 */
export const BadgeTest: React.FC = () => {
  const [testPhotoId] = useState('3ca96dc0-4a19-4cd8-ba39-bd5a8833ffb4'); // テスト結果から取得
  const [testAlbumId] = useState('d94b0bb5-b304-4920-a8eb-0ecff0bd7ef7'); // テスト結果から取得

  // 写真レベルのバッジテスト
  const photoResult = useNewCommentBadge({
    targetId: testPhotoId,
    targetType: 'photo',
    enabled: true
  });

  // アルバムレベルのバッジテスト
  const albumResult = useNewCommentBadge({
    targetId: testAlbumId,
    targetType: 'album',
    enabled: true
  });

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        NewCommentBadge テスト
      </h1>

      {/* Hook状態表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 写真レベルの状態 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">写真レベル Hook状態</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Loading:</strong> {photoResult.loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {photoResult.error || 'None'}</p>
            <p><strong>New Comments:</strong> {photoResult.newCommentCount}</p>
            <p><strong>Has New:</strong> {photoResult.hasNewComments ? 'Yes' : 'No'}</p>
            <p><strong>Last Seen:</strong> {photoResult.lastSeenAt || 'Never'}</p>
          </div>
          
          <button
            onClick={photoResult.refresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={photoResult.loading}
          >
            リフレッシュ
          </button>
          
          <button
            onClick={photoResult.markAsSeen}
            className="mt-4 ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={photoResult.loading}
          >
            既読にする
          </button>
        </div>

        {/* アルバムレベルの状態 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">アルバムレベル Hook状態</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Loading:</strong> {albumResult.loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {albumResult.error || 'None'}</p>
            <p><strong>Has New:</strong> {albumResult.hasNewComments ? 'Yes' : 'No'}</p>
            <p><strong>Last Seen:</strong> {albumResult.lastSeenAt || 'Never'}</p>
          </div>
          
          <button
            onClick={albumResult.refresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={albumResult.loading}
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
            
            {/* 小サイズ */}
            <div className="relative inline-block">
              <div className="w-16 h-16 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-xs">
                写真
              </div>
              <NewCommentBadge
                count={photoResult.newCommentCount}
                variant="photo"
                size="sm"
              />
            </div>
            
            {/* 中サイズ */}
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-sm">
                写真
              </div>
              <NewCommentBadge
                count={photoResult.newCommentCount}
                variant="photo"
                size="md"
              />
            </div>
            
            {/* 大サイズ */}
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center">
                写真
              </div>
              <NewCommentBadge
                count={photoResult.newCommentCount}
                variant="photo"
                size="lg"
              />
            </div>
          </div>

          {/* アルバムレベルバッジ */}
          <div className="space-y-4">
            <h3 className="font-medium">アルバムレベルバッジ</h3>
            
            <div className="relative inline-block">
              <div className="w-32 h-24 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-sm">
                アルバム
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
          </div>
        </div>
      </div>
    </div>
  );
};