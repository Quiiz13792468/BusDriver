"use client";

import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { requestPaymentCheckAction } from '@/app/(protected)/dashboard/actions';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Notiflix, ensureNotiflixConfigured } from '@/lib/ui/notiflix';

type RequestPaymentButtonProps = {
  studentId: string;
  schoolId: string;
  year: number;
  month: number;
};

const initialState = undefined as any;

export function RequestPaymentButton({ studentId, schoolId, year, month }: RequestPaymentButtonProps) {
  const [state, formAction] = useFormState(requestPaymentCheckAction, initialState);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    setMessage(state.message);
  }, [state]);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col items-center justify-center gap-1">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <SubmitButton
        onConfirm={async () => {
          ensureNotiflixConfigured();
          Notiflix.Confirm.show(
            '입금 확인 요청',
            `${month}월 입금 확인을 관리자에게 요청하시겠습니까?`,
            '확인',
            '취소',
            async () => {
              const fd = new FormData();
              fd.append('studentId', studentId);
              fd.append('schoolId', schoolId);
              fd.append('year', String(year));
              fd.append('month', String(month));
              await formAction(fd);
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
        className="ui-btn-outline border-accent-300 px-2.5 py-1.5 text-sm text-accent-700 hover:border-accent-400 hover:bg-accent-100 hover:text-primary-700"
      >
        {status.pending ? '요청 중…' : '확인 요청'}
      </button>
      <LoadingOverlay show={status.pending} message="요청 중…" />
    </div>
  );
}
