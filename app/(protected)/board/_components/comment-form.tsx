'use client';

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { createBoardCommentAction } from '@/app/(protected)/board/actions';

const initialState = undefined;

type CommentFormProps = {
  postId: string;
  parentCommentId?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
};

export function CommentForm({ postId, parentCommentId, autoFocus, onSubmitted }: CommentFormProps) {
  const [state, formAction] = useFormState(createBoardCommentAction, initialState);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (state?.status === 'success') {
      setContent('');
      onSubmitted?.();
    }
  }, [state, onSubmitted]);

  return (
    <form action={formAction} className="ui-card ui-card-compact space-y-2">
      <input type="hidden" name="postId" value={postId} />
      {parentCommentId ? <input type="hidden" name="parentCommentId" value={parentCommentId} /> : null}
      <textarea
        name="content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={parentCommentId ? 2 : 3}
        autoFocus={autoFocus}
        className="ui-input"
        placeholder={parentCommentId ? '답글을 입력하세요.' : '댓글을 입력하세요.'}
        required
      />
      {state ? (
        <p className={`text-sm ${state.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>
      ) : null}
      <FormSubmitButton label={parentCommentId ? '답글 등록' : '댓글 등록'} />
    </form>
  );
}

function FormSubmitButton({ label }: { label: string }) {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      disabled={status.pending}
      className="ui-btn px-4 py-2 text-base font-medium"
    >
      {status.pending ? '등록 중...' : label}
    </button>
  );
}
