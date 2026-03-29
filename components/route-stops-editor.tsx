"use client";

import { useState } from 'react';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editNames, setEditNames] = useState<Record<string, string>>({});
  const [editDescs, setEditDescs] = useState<Record<string, string>>({});

  const sorted = [...stops].sort((a, b) => a.position - b.position);

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...sorted];
    const tmp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = tmp;
    onReorder(next.map((s, i) => ({ id: s.id, position: i })));
  }

  function moveDown(idx: number) {
    if (idx === sorted.length - 1) return;
    const next = [...sorted];
    const tmp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = tmp;
    onReorder(next.map((s, i) => ({ id: s.id, position: i })));
  }

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

  const hasPending = pendingLat != null && pendingLng != null;

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white/70">
        {sorted.length === 0 && (
          <li className="px-3 py-4 text-center text-base text-slate-500">
            정차 지점이 없습니다. 지도를 클릭해 위치를 선택하세요.
          </li>
        )}
        {sorted.map((stop, idx) => {
          const displayName = editNames[stop.id] !== undefined ? editNames[stop.id] : stop.name;
          const isExpanded = expandedId === stop.id;

          return (
            <li key={stop.id} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                {/* Position badge */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  {stop.position + 1}
                </span>

                {/* Name input */}
                <input
                  value={displayName}
                  onChange={(e) => setEditNames((prev) => ({ ...prev, [stop.id]: e.target.value }))}
                  onBlur={() => handleNameBlur(stop)}
                  className="ui-input min-w-0 flex-1 text-base"
                />

                {/* Up / Down */}
                <button
                  type="button"
                  aria-label="위로"
                  disabled={idx === 0}
                  onClick={() => moveUp(idx)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="아래로"
                  disabled={idx === sorted.length - 1}
                  onClick={() => moveDown(idx)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                >
                  ▼
                </button>

                {/* Toggle description */}
                <button
                  type="button"
                  aria-label="메모 펼치기"
                  onClick={() => setExpandedId((prev) => (prev === stop.id ? null : stop.id))}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  {isExpanded ? '▾' : '▸'}
                </button>

                {/* Delete */}
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() => onDelete(stop.id)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50"
                >
                  ✕
                </button>
              </div>

              {/* Collapsible description */}
              {isExpanded && (
                <div className="mt-2 pl-8">
                  <input
                    value={editDescs[stop.id] !== undefined ? editDescs[stop.id] : (stop.description ?? '')}
                    onChange={(e) => setEditDescs((prev) => ({ ...prev, [stop.id]: e.target.value }))}
                    onBlur={() => handleDescBlur(stop)}
                    placeholder="메모 (선택)"
                    className="ui-input w-full text-sm text-slate-600"
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
