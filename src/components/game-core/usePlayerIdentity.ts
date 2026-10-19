import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FUTURISTIC_AVATARS } from '@/data/avatars';
import type { PlayerIdentity, CanvasAvatarRenderOptions } from './types';
import { drawPlayerAvatarToCanvas } from './GamePlayerAvatar';

// Global cache for loaded image elements to avoid re-decoding across game sessions
const avatarImageCache = new Map<string, HTMLImageElement>();

/**
 * usePlayerIdentity — Central hook for all games in AVENIR ARENA.
 * Automatically resolves the player's username, avatar, initials, and preloaded HTMLImageElement
 * for zero-latency 60 FPS Canvas/WebGL rendering.
 */
export function usePlayerIdentity(): PlayerIdentity & {
  drawAvatar: (ctx: CanvasRenderingContext2D, options: CanvasAvatarRenderOptions) => void;
} {
  const { currentUser, userProfile } = useAuth();

  // Resolved identity attributes
  const username = useMemo(() => {
    return userProfile?.username || currentUser?.displayName || 'Operative';
  }, [userProfile?.username, currentUser?.displayName]);

  const avatarUrl = useMemo(() => {
    return (
      userProfile?.avatarUrl ||
      currentUser?.photoURL ||
      FUTURISTIC_AVATARS[0].url
    );
  }, [userProfile?.avatarUrl, currentUser?.photoURL]);

  const initials = useMemo(() => {
    return (
      username
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U'
    );
  }, [username]);

  const campus = userProfile?.campus || 'Mirai School of Technology';
  const year = userProfile?.year || '1st';

  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(() => {
    return avatarImageCache.get(avatarUrl) || null;
  });
  const [isAvatarLoaded, setIsAvatarLoaded] = useState<boolean>(() => {
    const cached = avatarImageCache.get(avatarUrl);
    return Boolean(cached && cached.complete && cached.naturalWidth > 0);
  });

  // Preload and cache HTMLImageElement
  useEffect(() => {
    if (!avatarUrl) {
      setAvatarImage(null);
      setIsAvatarLoaded(false);
      return;
    }

    const cached = avatarImageCache.get(avatarUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      setAvatarImage(cached);
      setIsAvatarLoaded(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = avatarUrl;

    img.onload = () => {
      avatarImageCache.set(avatarUrl, img);
      setAvatarImage(img);
      setIsAvatarLoaded(true);
    };

    img.onerror = () => {
      console.warn(`[Game Core Identity] Failed to load avatar from ${avatarUrl}. Using fallback.`);
      setAvatarImage(null);
      setIsAvatarLoaded(false);
    };
  }, [avatarUrl]);

  const identity: PlayerIdentity = useMemo(() => ({
    username,
    avatarUrl,
    initials,
    avatarImage,
    isAvatarLoaded,
    campus,
    year,
  }), [username, avatarUrl, initials, avatarImage, isAvatarLoaded, campus, year]);

  const drawAvatar = useCallback(
    (ctx: CanvasRenderingContext2D, options: CanvasAvatarRenderOptions) => {
      drawPlayerAvatarToCanvas(ctx, identity, options);
    },
    [identity]
  );

  return {
    ...identity,
    drawAvatar,
  };
}
