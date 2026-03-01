import 'server-only';

import crypto from 'node:crypto';

import { supaEnabled, restSelect, restInsert, restPatch } from '@/lib/supabase/rest';

export type BoardNotificationRecord = {
  id: string;
  receiverId: string;
  postId: string;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
};

function ensureSupabase() {
  if (!supaEnabled()) throw new Error('Supabase is not configured.');
}

export async function createBoardNotification(input: {
  receiverId: string;
  postId: string;
  commentId?: string | null;
}) {
  if (!supaEnabled()) return;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await restInsert('board_notifications', [{
    id,
    receiver_id: input.receiverId,
    post_id: input.postId,
    comment_id: input.commentId ?? null,
    is_read: false,
    created_at: now,
  }]);
}

export async function countUnreadBoardNotifications(userId: string): Promise<number> {
  if (!supaEnabled()) return 0;
  const rows = await restSelect<any>('board_notifications', { receiver_id: userId });
  return rows.filter((r: any) => !r.is_read).length;
}

export async function getBoardNotifications(userId: string): Promise<BoardNotificationRecord[]> {
  if (!supaEnabled()) return [];
  const rows = await restSelect<any>(
    'board_notifications',
    { receiver_id: userId },
    { order: 'created_at.desc', limit: 30 }
  );
  return rows.map((r: any) => ({
    id: r.id,
    receiverId: r.receiver_id,
    postId: r.post_id,
    commentId: r.comment_id ?? null,
    isRead: r.is_read,
    createdAt: r.created_at,
  }));
}

export async function markBoardNotificationRead(id: string) {
  if (!supaEnabled()) return;
  await restPatch('board_notifications', { id }, { is_read: true });
}

export async function markAllBoardNotificationsRead(userId: string) {
  if (!supaEnabled()) return;
  await restPatch('board_notifications', { receiver_id: userId, is_read: 'false' } as any, { is_read: true });
}
