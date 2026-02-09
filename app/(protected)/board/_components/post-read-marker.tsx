"use client";

import { useEffect } from 'react';

type PostReadMarkerProps = {
  postId: string;
  viewerId: string;
  lastCommentAt?: string | null;
  fallbackAt?: string;
};

export function PostReadMarker({ postId, viewerId, lastCommentAt, fallbackAt }: PostReadMarkerProps) {
  useEffect(() => {
    try {
      const key = `board:read:${viewerId}:${postId}`;
      const stamp = lastCommentAt ?? fallbackAt ?? new Date().toISOString();
      localStorage.setItem(key, stamp);
    } catch {}
  }, [postId, viewerId, lastCommentAt, fallbackAt]);

  return null;
}
