"use client";

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { changePickupPointAction } from '@/app/(protected)/dashboard/actions';
import type { RouteRecord, StudentRecord } from '@/lib/data/types';
import { SearchableSelect } from '@/components/searchable-select';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Notiflix, ensureNotiflixConfigured } from '@/lib/ui/notiflix';

type Props = { student: StudentRecord; routes: RouteRecord[] };

const initialState = undefined as { status: 'success' | 'error'; message: string } | undefined;

export function ChangePickupButton({ student, routes }: Props) {
  const [open, setOpen] = useState(false);
  const [nextPoint, setNextPoint] = useState<string>(student.pickupPoint ?? '');
  const [routeId, setRouteId] = useState<string | ''>(student.routeId ?? '');
  const [state, formAction] = useFormState(changePickupPointAction, initialState);

  const stops = useMemo(() => routes.flatMap((r) => r.stops.map((s) => ({ r, s }))), [routes]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ui-btn-outline w-full justify-center border-primary-200 text-primary-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 sm:w-auto"
      >
        탑승지점 변경
      </button>
      {open ? (
        <form onSubmit={(e) => e.preventDefault()} className="ui-card ui-card-compact grid gap-3">
          <div className="grid gap-1.5">
            <label className="text-base font-semibold text-slate-700" htmlFor={`route-${student.id}`}>
              노선 선택
            </label>
            <select
              id={`route-${student.id}`}
              value={routeId}
              onChange={(e) => setRouteId(e.target.value as any)}
              className="ui-select"
            >
              <option value="">선택 안 함</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <SearchableSelect label="탑승지점" value={nextPoint} onChange={setNextPoint} options={Array.from(new Set(stops.map(({ s }) => s)))} />
          <SubmitBtn
            onConfirm={async () => {
              ensureNotiflixConfigured();
              const before = student.pickupPoint ?? '-';
              const after = nextPoint || '-';
              Notiflix.Confirm.show(
                '탑승지점 변경',
                `변경 전: ${before}\n변경 후: ${after}\n\n그래도 변경하시겠습니까?`,
                '확인',
                '취소',
                async () => {
                  if (!student.schoolId) {
                    Notiflix.Notify.failure('학교 배정 후에 변경할 수 있습니다.');
                    return;
                  }
                  const fd = new FormData();
                  fd.append('studentId', student.id);
                  fd.append('schoolId', student.schoolId);
                  fd.append('pickupPoint', nextPoint);
                  fd.append('routeId', routeId);
                  await formAction(fd);
                }
              );
            }}
          />
          {state ? <p className={`text-base ${state.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}

function SubmitBtn({ onConfirm }: { onConfirm: () => void }) {
  const status = useFormStatus();
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={onConfirm}
        disabled={status.pending}
        className="ui-btn-accent px-4 py-2.5 text-base font-semibold"
      >
        {status.pending ? '저장 중…' : '저장'}
      </button>
      <LoadingOverlay show={status.pending} message="저장 중…" />
    </div>
  );
}
