"use client";

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { assignStudentsBulkToRouteAction } from '@/app/(protected)/routes/actions.clean';
import { SearchableSelect } from '@/components/searchable-select';
import { LoadingOverlay } from '@/components/loading-overlay';

type Props = {
  routeId: string;
  students: { id: string; name: string }[];
  stops?: string[];
};

const initialState = undefined as { status: 'success' | 'error'; message: string } | undefined;

export function BulkAssignStudents({ routeId, students, stops = [] }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [state, formAction] = useFormState(assignStudentsBulkToRouteAction as any, initialState);
  const [stop, setStop] = useState('');

  const ids = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  return (
    <form
      action={(fd) => {
        fd.append('routeId', routeId);
        fd.append('studentIds', ids.join(','));
        fd.append('pickupPoint', stop);
        return (formAction as any)(fd);
      }}
      className="ui-card ui-card-pad space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-slate-800">일괄 배정</p>
        <AssignBtn />
      </div>
      <SearchableSelect options={stops} value={stop} onChange={setStop} label="정차 지점(선택)" />
      <div className="grid max-h-64 gap-1 overflow-auto pr-1">
        {students.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-base text-slate-700">
            <input
              type="checkbox"
              checked={!!selected[s.id]}
              onChange={(e) => setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))}
            />
            <span>{s.name}</span>
          </label>
        ))}
        {students.length === 0 ? (
          <div className="px-2 py-6 text-center text-base text-slate-700">표시할 학생이 없습니다.</div>
        ) : null}
      </div>
      {state ? (
        <p className={`text-base ${state.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function AssignBtn() {
  const status = useFormStatus();
  return (
    <div className="relative inline-block">
      <button
        type="submit"
        disabled={status.pending}
        className="ui-btn-accent px-4 py-2.5 text-base font-semibold"
      >
        {status.pending ? '배정 중...' : '일괄 배정'}
      </button>
      <LoadingOverlay show={status.pending} message="배정 중..." />
    </div>
  );
}
