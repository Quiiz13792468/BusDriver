"use client";

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

import { saveRouteStopsAction } from '@/app/(protected)/routes/actions.clean';
import { LoadingOverlay } from '@/components/loading-overlay';

type Props = {
  routeId: string;
  initialStops: string[];
};

type StopItem = { id: string; name: string };

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

const initialState = undefined as { status: 'success' | 'error'; message: string } | undefined;

export function RouteStopsEditor({ routeId, initialStops }: Props) {
  const initialItems = useMemo<StopItem[]>(() => initialStops.map((s) => ({ id: makeId(), name: s })), [initialStops]);
  const [stops, setStops] = useState<StopItem[]>(initialItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [state, formAction] = useFormState(saveRouteStopsAction, initialState);

  const onDragStart = (idx: number) => setDragIndex(idx);
  const onDragOver = (e: React.DragEvent<HTMLLIElement>, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    setStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(idx, 0, moved);
      setDragIndex(idx);
      return next;
    });
  };

  return (
    <form
      action={(fd) => {
        fd.append('routeId', routeId);
        fd.append(
          'stops',
          JSON.stringify(
            stops
              .map((i) => i.name.trim())
              .filter((s) => s.length > 0)
          )
        );
        return formAction(fd);
      }}
      className="ui-card ui-card-pad space-y-3"
    >
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white/70">
        {stops.map((item, idx) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 px-3 py-2.5 text-base"
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDrop={(e) => e.preventDefault()}
          >
            <span className="cursor-grab select-none text-slate-600">≡</span>
            <input
              value={item.name}
              onChange={(e) => {
                const v = e.target.value;
                setStops((prev) => prev.map((x, i) => (i === idx ? { ...x, name: v } : x)));
              }}
              className="ui-input flex-1"
            />
            <button
              type="button"
              className="ui-btn-outline border-rose-200 px-3 py-1.5 text-base text-rose-600 hover:bg-rose-50"
              onClick={() => setStops((prev) => prev.filter((_, i) => i !== idx))}
            >
              삭제
            </button>
          </li>
        ))}
        {stops.length === 0 ? (
          <li className="px-3 py-4 text-center text-base text-slate-700">정차 지점이 없습니다.</li>
        ) : null}
      </ul>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStops((prev) => [...prev, { id: makeId(), name: '' }])}
          className="ui-btn-outline border-slate-200 px-3 py-2.5 text-base text-slate-700 hover:bg-white"
        >
          지점 추가
        </button>
        <SaveBtn />
      </div>
      {state ? (
        <p className={`text-base ${state.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function SaveBtn() {
  const status = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={status.pending}
        className="rounded-2xl bg-accent-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-accent-500 disabled:cursor-not-allowed disabled:bg-accent-300"
      >
        {status.pending ? '저장 중...' : '저장'}
      </button>
      <LoadingOverlay show={status.pending} message="저장 중..." />
    </>
  );
}
