"use client";

import { useRef, useState } from 'react';

interface StopItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  position: number;
  description?: string | null;
}

interface RouteStopsEditorProps {
  stops: StopItem[];
  onReorder: (reorderedStops: Array<{ id: string; position: number }>) => void;
  onAdd: (name: string, lat: number, lng: number) => void;
  onDelete: (stopId: string) => void;
  onUpdate: (stopId: string, data: { name?: string; description?: string }) => void;
  pendingLat?: number | null;
  pendingLng?: number | null;
}

export function RouteStopsEditor({
  stops,
  onReorder,
  onAdd,
  onDelete,
  onUpdate,
  pendingLat,
  pendingLng,
}: RouteStopsEditorProps) {
  const [newName, setNewName] = useState('');
  const [editNames, setEditNames] = useState<Record<string, string>>({});
  const [editDescs, setEditDescs] = useState<Record<string, string>>({});
  const [openMemo, setOpenMemo] = useState<Record<string, boolean>>({});
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const sortedRef = useRef<StopItem[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  const sorted = [...stops].sort((a, b) => a.position - b.position);
  sortedRef.current = sorted;

  function handleNameBlur(stop: StopItem) {
    const val = editNames[stop.id];
    if (val !== undefined && val.trim() !== stop.name) {
      onUpdate(stop.id, { name: val.trim() || stop.name });
    }
  }

  function handleDescBlur(stop: StopItem) {
    const val = editDescs[stop.id];
    if (val !== undefined && val !== (stop.description ?? '')) {
      onUpdate(stop.id, { description: val });
    }
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (pendingLat == null || pendingLng == null) return;
    onAdd(name, pendingLat, pendingLng);
    setNewName('');
  }

  function getItemIdxFromPoint(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const li = (el as HTMLElement).closest('[data-drag-idx]') as HTMLElement | null;
    if (!li) return null;
    const idx = parseInt(li.dataset.dragIdx ?? '', 10);
    return isNaN(idx) ? null : idx;
  }

  function handleDragPointerDown(e: React.PointerEvent, idx: number) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragIdx(idx);
    setOverIdx(idx);

    function onMove(me: PointerEvent) {
      const target = getItemIdxFromPoint(me.clientX, me.clientY);
      if (target !== null) setOverIdx(target);
    }

    function onUp() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);

      setDragIdx((prevDrag) => {
        setOverIdx((prevOver) => {
          if (prevDrag !== null && prevOver !== null && prevDrag !== prevOver) {
            const next = [...sortedRef.current];
            const [moved] = next.splice(prevDrag, 1);
            next.splice(prevOver, 0, moved);
            onReorder(next.map((s, i) => ({ id: s.id, position: i })));
          }
          return null;
        });
        return null;
      });
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  const hasPending = pendingLat != null && pendingLng != null;

  return (
    <div className="space-y-3 overflow-x-hidden">
      <ul ref={listRef} className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white/70">
        {sorted.length === 0 && (
          <li className="px-3 py-4 text-center text-base text-slate-700">
            정차 지점이 없습니다. 지도를 클릭해 위치를 선택하세요.
          </li>
        )}
        {sorted.map((stop, idx) => {
          const displayName = editNames[stop.id] !== undefined ? editNames[stop.id] : stop.name;
          const isDragging = dragIdx === idx;
          const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;

          return (
            <li
              key={stop.id}
              data-drag-idx={idx}
              className={`px-2 py-2.5 sm:px-3 transition-colors ${isDragging ? 'opacity-40' : ''} ${isOver ? 'bg-primary-50' : ''}`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Drag handle */}
                <button
                  type="button"
                  aria-label="순서 변경"
                  onPointerDown={(e) => handleDragPointerDown(e, idx)}
                  className="flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-400 hover:bg-slate-50 active:cursor-grabbing sm:h-12 sm:w-12"
                >
                  ☰
                </button>

                {/* Position badge */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  {stop.position + 1}
                </span>

                {/* Name input */}
                <input
                  value={displayName}
                  onChange={(e) => setEditNames((prev) => ({ ...prev, [stop.id]: e.target.value }))}
                  onBlur={() => handleNameBlur(stop)}
                  className="ui-input min-w-0 flex-1 text-base text-slate-900"
                />

                {/* Memo toggle */}
                <button
                  type="button"
                  aria-label="메모"
                  onClick={() => setOpenMemo((prev) => ({ ...prev, [stop.id]: !prev[stop.id] }))}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-base sm:h-12 sm:w-12 ${openMemo[stop.id] || stop.description ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  ▶
                </button>

                {/* Delete */}
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() => onDelete(stop.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-base text-rose-600 hover:bg-rose-50 sm:h-12 sm:w-12"
                >
                  ✕
                </button>
              </div>

              {/* Description input — 메모 버튼 클릭 시 또는 기존 메모 있을 때 표시 */}
              {(openMemo[stop.id] || stop.description) && (
                <div className="mt-2 pl-8">
                  <input
                    value={editDescs[stop.id] !== undefined ? editDescs[stop.id] : (stop.description ?? '')}
                    onChange={(e) => setEditDescs((prev) => ({ ...prev, [stop.id]: e.target.value }))}
                    onBlur={() => handleDescBlur(stop)}
                    placeholder="메모 (선택)"
                    className="ui-input w-full text-sm text-slate-600"
                    autoFocus={openMemo[stop.id] && !stop.description}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Add stop when map location is pending */}
      {hasPending && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-3 space-y-2">
          <p className="text-xs font-medium text-primary-700">
            지도에서 위치가 선택되었습니다. 정차 지점 이름을 입력하세요.
          </p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="정차 지점 이름"
              className="ui-input flex-1 text-base"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="rounded-2xl bg-primary-600 px-4 py-2 text-base font-semibold text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
