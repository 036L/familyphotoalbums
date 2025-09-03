// src/hooks/ui/useAlbumBadges.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import type { Album } from '../../types/core';

interface AlbumBadgeState {
  [albumId: string]: boolean;
}

export const useAlbumBadges = (albums: Album[]) => {
  const [badgeStates, setBadgeStates] = useState<AlbumBadgeState>({});
  const [loading, setLoading] = useState(false);
  const { user, profile } = useApp();
  const userId = user?.id || profile?.id;

  const fetchAlbumBadges = useCallback(async () => {
    if (!userId || albums.length === 0) return;

    try {
      setLoading(true);
      const newBadgeStates: AlbumBadgeState = {};

      // 各アルバムの新着コメント状況を確認
      for (const album of albums) {
        // アルバム内の写真IDを取得
        const { data: photos } = await supabase
          .from('photos')
          .select('id')
          .eq('album_id', album.id);

        if (!photos || photos.length === 0) {
          newBadgeStates[album.id] = false;
          continue;
        }

        // 各写真の新着コメントをチェック
        let hasNewComments = false;
        for (const photo of photos) {
          const { data: lastSeen } = await supabase
            .from('user_last_seen')
            .select('last_seen_at')
            .eq('user_id', userId)
            .eq('target_type', 'photo')
            .eq('target_id', photo.id)
            .single();

          const { count } = await supabase
            .from('comments')
            .select('id', { count: 'exact' })
            .eq('photo_id', photo.id)
            .gt('created_at', lastSeen?.last_seen_at || '1970-01-01');

          if (count && count > 0) {
            hasNewComments = true;
            break;
          }
        }

        newBadgeStates[album.id] = hasNewComments;
      }

      setBadgeStates(newBadgeStates);
    } catch (error) {
      console.error('アルバムバッジ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, albums]);

  useEffect(() => {
    if (albums.length > 0) {
      fetchAlbumBadges();
    }
  }, [albums, fetchAlbumBadges]);

  return { badgeStates, loading, refresh: fetchAlbumBadges };
};