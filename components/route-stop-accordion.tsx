"use client";

import { useState } from 'react';

export type StopGroup = {
  stopName: string;
  students: { id: string; name: string; phone: string | null }[];
};

export function RouteStopAccordion({ groups }: { groups: StopGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (groups.length === 0) {
    return <p className="py-3 text-center text-sm text-slate-500">정차 지점이 없습니다.</p>;
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-slate-100 divide-y divide-slate-100">
      {groups.map((g, idx) => {
        const isOpen = open === g.stopName;
        return (
          <li key={g.stopName}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-slate-100"
              onClick={() => setOpen(isOpen ? null : g.stopName)}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {idx + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800">{g.stopName}</span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  g.students.length > 0 ? 'bg-primary-50 text-primary-700' : 'bg-slate-100 text-slate-500',
                ].join(' ')}
              >
                {g.students.length}명
              </span>
              <svg
                className={['h-4 w-4 shrink-0 text-slate-400 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                {g.students.length === 0 ? (
                  <p className="text-sm text-slate-500">이 정류장에 배정된 학생이 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {g.students.map((s) => (
                      <li key={s.id} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                        <span className="text-sm font-medium text-slate-800">{s.name}</span>
                        {s.phone && <span className="ml-auto text-xs text-slate-500">{s.phone}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
