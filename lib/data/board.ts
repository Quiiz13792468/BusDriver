import crypto from 'node:crypto';

import type { BoardCommentRecord, BoardPostRecord } from '@/lib/data/types';
import { getUserById } from '@/lib/data/user';
import { supaEnabled, restSelect, restInsert, restPatch } from '@/lib/supabase/rest';

function ensureSupabase() {
  if (!supaEnabled()) {
    throw new Error('Supabase is not configured.');
  }
}

export async function getBoardPosts(params?: { schoolId?: string; authorId?: string; targetParentId?: string }) {
  ensureSupabase();
  const schoolId = params?.schoolId;
  const authorId = params?.authorId;
  const targetParentId = params?.targetParentId;
  const baseQuery: Record<string, string> = {};
  if (schoolId) baseQuery.school_id = schoolId;
  const rows = await restSelect<any>('board_posts', baseQuery, { order: 'created_at.desc' });
  const filtered = rows.filter((r) => {
    if (schoolId && r.school_id && r.school_id !== schoolId) return false;
    if (authorId && targetParentId) {
      if (r.author_id !== authorId && r.target_parent_id !== targetParentId) return false;
    } else if (authorId && r.author_id !== authorId) {
      return false;
    } else if (targetParentId && r.target_parent_id !== targetParentId) {
      return false;
    }
    return true;
  });
  const posts = filtered.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    authorId: r.author_id,
    schoolId: r.school_id ?? null,
    targetParentId: r.target_parent_id ?? null,
    parentOnly: !!r.parent_only,
    locked: !!r.locked,
    viewCount: r.view_count ?? 0,
    commentCount: r.comment_count ?? 0,
    lastCommentAt: r.last_comment_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  } as BoardPostRecord));
  const withAuthors = await Promise.all(posts.map(async (post) => {
    const author = await getUserById(post.authorId);
    return { ...post, author: author ? { id: author.id, name: author.name } : { id: post.authorId, name: null } } as any;
  }));
  return withAuthors;
}

export async function getBoardPostWithComments(postId: string) {
  ensureSupabase();
  const rows = await restSelect<any>('board_posts', { id: postId }, { limit: 1 });
  const r = rows[0];
  if (!r) return null;
  const post: BoardPostRecord = {
    id: r.id,
    title: r.title,
    content: r.content,
    authorId: r.author_id,
    schoolId: r.school_id ?? null,
    targetParentId: r.target_parent_id ?? null,
    parentOnly: !!r.parent_only,
    locked: !!r.locked,
    viewCount: r.view_count ?? 0,
    commentCount: r.comment_count ?? 0,
    lastCommentAt: r.last_comment_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
  const author = await getUserById(post.authorId);
  const commentsRows = await restSelect<any>('board_comments', { post_id: postId }, { order: 'created_at.asc' });
  const comments: BoardCommentRecord[] = commentsRows.map((c) => ({ id: c.id, postId: c.post_id, authorId: c.author_id, content: c.content, parentCommentId: c.parent_comment_id ?? null, createdAt: c.created_at, updatedAt: c.updated_at }));
  type CommentNode = BoardCommentRecord & { replies: BoardCommentRecord[] };
  type DecoratedComment = BoardCommentRecord & { author: { id: string; name: string | null }; replies: Array<BoardCommentRecord & { author: { id: string; name: string | null } }>; };
  const commentMap = new Map<string, CommentNode>();
  const topLevel: CommentNode[] = [];
  for (const c of comments) commentMap.set(c.id, { ...c, replies: [] });
  for (const c of comments) {
    if (c.parentCommentId) {
      const p = commentMap.get(c.parentCommentId);
      if (p) p.replies.push({ ...c });
    } else {
      const n = commentMap.get(c.id);
      if (n) topLevel.push(n);
    }
  }
  const commentAuthors = await Promise.all(comments.map((c) => getUserById(c.authorId)));
  const authorMap = new Map<string, { id: string; name: string | null }>();
  comments.forEach((c, i) => authorMap.set(c.id, { id: c.authorId, name: commentAuthors[i]?.name ?? null }));
  const decorate = (node: CommentNode): DecoratedComment => ({ ...node, author: authorMap.get(node.id) ?? { id: node.authorId, name: null }, replies: node.replies.map((r) => ({ ...r, author: authorMap.get(r.id) ?? { id: r.authorId, name: null } })) });
  return { ...post, author: author ? { id: author.id, name: author.name } : { id: post.authorId, name: null }, comments: topLevel.map((n) => decorate(n)) };
}

export async function createBoardPost(input: {
  title: string;
  content: string;
  authorId: string;
  schoolId?: string | null;
  parentOnly?: boolean;
  targetParentId?: string | null;
}) {
  ensureSupabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await restInsert('board_posts', [{
    id,
    title: input.title,
    content: input.content,
    author_id: input.authorId,
    school_id: input.schoolId ?? null,
    target_parent_id: input.targetParentId ?? null,
    parent_only: input.parentOnly ?? true,
    locked: false,
    view_count: 0,
    comment_count: 0,
    last_comment_at: null,
    created_at: now,
    updated_at: now
  }]);
  const rows = await restSelect<any>('board_posts', { id }, { limit: 1 });
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    authorId: r.author_id,
    schoolId: r.school_id ?? null,
    targetParentId: r.target_parent_id ?? null,
    parentOnly: !!r.parent_only,
    locked: !!r.locked,
    viewCount: r.view_count ?? 0,
    commentCount: r.comment_count ?? 0,
    lastCommentAt: r.last_comment_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  } as BoardPostRecord;
}

export async function createBoardComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string | null;
}) {
  ensureSupabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await restInsert('board_comments', [{ id, post_id: input.postId, author_id: input.authorId, content: input.content, parent_comment_id: input.parentCommentId ?? null, created_at: now, updated_at: now }]);
  const rows = await restSelect<any>('board_posts', { id: input.postId }, { limit: 1 });
  const current = rows[0];
  const nextCount = (current?.comment_count ?? 0) + 1;
  await restPatch('board_posts', { id: input.postId }, { comment_count: nextCount, last_comment_at: now, updated_at: now });
  return { id, postId: input.postId, authorId: input.authorId, content: input.content, parentCommentId: input.parentCommentId ?? null, createdAt: now, updatedAt: now } as BoardCommentRecord;
}

export async function incrementBoardPostViews(postId: string) {
  ensureSupabase();
  const rows = await restSelect<any>('board_posts', { id: postId }, { limit: 1 });
  const current = rows[0];
  const nextCount = (current?.view_count ?? 0) + 1;
  await restPatch('board_posts', { id: postId }, { view_count: nextCount });
}

export async function lockBoardPost(id: string) {
  ensureSupabase();
  await restPatch('board_posts', { id }, { locked: true, updated_at: new Date().toISOString() });
}
