"use client";

import { useEffect, useState } from 'react';

type PostUnreadBadgeProps = {
  postId: string;
  viewerId: string;
  lastCommentAt?: string | null;
};

function parseTime(value?: string | null) {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export function PostUnreadBadge({ postId, viewerId, lastCommentAt }: PostUnreadBadgeProps) {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    if (!lastCommentAt) {
      setUnread(false);
      return;
    }
    try {
      const key = `board:read:${viewerId}:${postId}`;
      const lastRead = localStorage.getItem(key);
      const lastReadTime = parseTime(lastRead);
      const lastCommentTime = parseTime(lastCommentAt);
      setUnread(lastCommentTime > 0 && lastReadTime < lastCommentTime);
    } catch {
      setUnread(false);
    }
  }, [postId, viewerId, lastCommentAt]);

  if (!unread) return null;

  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
      N
    </span>
  );
}
