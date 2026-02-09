"use client";

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { requestSchoolMatchAction } from '@/app/(protected)/board/actions';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Notiflix, ensureNotiflixConfigured } from '@/lib/ui/notiflix';

const initialState = undefined as any;

export function RequestSchoolMatchButton() {
  const [state, formAction] = useFormState(requestSchoolMatchAction, initialState);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    setMessage(state.message);
  }, [state]);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col items-start gap-2">
      <SubmitButton
        onConfirm={async () => {
          ensureNotiflixConfigured();
          Notiflix.Confirm.show(
            '학교-학생 매칭 요청',
            '관리자에게 학교-학생 매칭 요청을 보내시겠습니까?',
            '확인',
            '취소',
            async () => {
              await formAction();
            }
          );
        }}
      />
      {message ? <p className="text-sm text-accent-700">{message}</p> : null}
    </form>
  );
}

function SubmitButton({ onConfirm }: { onConfirm: () => void }) {
  const status = useFormStatus();
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onConfirm}
        disabled={status.pending}
        className="ui-btn-outline border-primary-200 px-4 py-2 text-base text-primary-700 hover:border-primary-300 hover:bg-primary-50"
      >
        {status.pending ? '요청 중…' : '학교-학생 매칭 요청'}
      </button>
      <LoadingOverlay show={status.pending} message="요청 중…" />
    </div>
  );
}
