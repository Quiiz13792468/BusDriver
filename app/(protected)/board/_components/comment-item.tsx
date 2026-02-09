'use client';

import { useState } from 'react';

import { CommentForm } from '@/app/(protected)/board/_components/comment-form';

type CommentAuthor = {
  name: string | null;
};

type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  replies: CommentNode[];
};

type CommentItemProps = {
  comment: CommentNode;
  postId: string;
};

export function CommentItem({ comment, postId }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="ui-card ui-card-pad space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-900">{comment.author.name ?? '익명'}</p>
          <p className="text-sm text-slate-700">{new Date(comment.createdAt).toLocaleString()}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowReply((prev) => !prev)}
          className="ui-btn-outline border-primary-200 px-3 py-1.5 text-sm text-primary-600 hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-700"
        >
          {showReply ? '답글 닫기' : '답글 쓰기'}
        </button>
      </div>
      <p className="text-base leading-relaxed text-slate-700">{comment.content}</p>

      {showReply ? (
        <div className="ui-card ui-card-compact">
          <CommentForm postId={postId} parentCommentId={comment.id} autoFocus onSubmitted={() => setShowReply(false)} />
        </div>
      ) : null}

      {comment.replies.length > 0 ? (
        <div className="space-y-3 border-l border-slate-200 pl-4 sm:pl-6">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="ui-card ui-card-compact">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{reply.author.name ?? '익명'}</p>
                  <p className="text-sm text-slate-700">{new Date(reply.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-2 text-base leading-relaxed text-slate-700">{reply.content}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
