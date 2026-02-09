"use client";

import { useFormState, useFormStatus } from 'react-dom';

import { createRouteAction } from '@/app/(protected)/routes/actions.clean';
import { LoadingOverlay } from '@/components/loading-overlay';

type Props = {
  schoolId: string;
};

const initialState = undefined as { status: 'success' | 'error'; message: string } | undefined;

export function RouteCreateCard({ schoolId }: Props) {
  const [state, formAction] = useFormState(createRouteAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="schoolId" value={schoolId} />
      <div className="grid items-stretch gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-base font-semibold text-slate-700" htmlFor={`name-${schoolId}`}>
            노선명
          </label>
          <input
            id={`name-${schoolId}`}
            name="name"
            className="ui-input h-full"
            placeholder="예: 1호차 노선"
            required
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-base font-semibold text-slate-700" htmlFor={`stops-${schoolId}`}>
            정차 지점(표시는 줄바꿈으로 구분)
          </label>
          <textarea
            id={`stops-${schoolId}`}
            name="stops"
            className="ui-input h-full"
            rows={3}
            placeholder="예: OO학교 정문, OO아파트 OO마트"
          />
        </div>
      </div>
      {state ? (
        <p className={`text-base ${state.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const status = useFormStatus();
  return (
    <div className="relative inline-block">
      <button className="ui-btn-accent px-4 py-2.5 text-base font-semibold" disabled={status.pending}>
        {status.pending ? '저장 중…' : '추가'}
      </button>
      <LoadingOverlay show={status.pending} message="저장 중…" />
    </div>
  );
}
