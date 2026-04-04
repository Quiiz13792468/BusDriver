'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { createBoardCommentAction } from '@/app/(protected)/board/actions';

const initialState = undefined;

type CommentFormProps = {
  postId: string;
  parentCommentId?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
  locked?: boolean;
};

export function CommentForm({ postId, parentCommentId, autoFocus, onSubmitted, locked }: CommentFormProps) {
  const [state, formAction] = useFormState(createBoardCommentAction, initialState);
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.status === 'success') {
      setContent('');
      onSubmitted?.();
    }
  }, [state, onSubmitted]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  if (locked) {
    return (
      <div className="border-t border-slate-200 bg-white px-4 py-3 pb-safe">
        <p className="text-center text-base text-slate-500">답변이 완료된 문의입니다.</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 pb-safe"
    >
      <input type="hidden" name="postId" value={postId} />
      {parentCommentId ? <input type="hidden" name="parentCommentId" value={parentCommentId} /> : null}
      <input
        ref={inputRef}
        type="text"
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="메시지를 입력하세요..."
        className="min-h-[44px] flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        required
        autoComplete="off"
        enterKeyHint="send"
      />
      <SendButton disabled={!content.trim()} />
      {state?.status === 'error' ? (
        <span className="sr-only">{state.message}</span>
      ) : null}
    </form>
  );
}

function SendButton({ disabled }: { disabled: boolean }) {
  const status = useFormStatus();
  const isPending = status.pending;

  return (
    <button
      type="submit"
      disabled={isPending || disabled}
      aria-label="전송"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
    >
      {isPending ? (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      )}
    </button>
  );
}
