"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { resolveAlertAction } from '@/app/(protected)/dashboard/actions';

type AlertType = 'ALL' | 'PAYMENT' | 'INQUIRY' | 'ROUTE_CHANGE';

type AlertItem = {
  id: string;
  type: AlertType;
  studentId: string;
  schoolId: string;
  year: number;
  month: number;
  memo: string | null;
  createdAt: string | number | Date;
};

type AlertPanelProps = {
  alerts: AlertItem[];
  typeParam: AlertType;
  year: number;
  month: number;
  schoolMap: Record<string, string>;
  studentMap: Record<string, string>;
};

const ALERT_LABEL: Record<AlertType, string> = {
  ALL: '전체',
  PAYMENT: '입금 확인',
  INQUIRY: '문의',
  ROUTE_CHANGE: '탑승지점 변경'
};

const ALERT_COLOR: Record<AlertType, string> = {
  ALL: 'bg-slate-100 text-slate-700',
  PAYMENT: 'bg-emerald-100 text-emerald-700',
  INQUIRY: 'bg-blue-100 text-blue-700',
  ROUTE_CHANGE: 'bg-amber-100 text-amber-700'
};

const FILTERS: AlertType[] = ['ALL', 'PAYMENT', 'INQUIRY', 'ROUTE_CHANGE'];

export function AlertPanel({ alerts, typeParam, year, month, schoolMap, studentMap }: AlertPanelProps) {
  const [open, setOpen] = useState(false);

  const filteredAlerts = useMemo(
    () => (typeParam === 'ALL' ? alerts : alerts.filter((a) => a.type === typeParam)),
    [alerts, typeParam]
  );

  return (
    <div className="ui-card ui-card-pad">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="alert-panel"
          className="ui-btn-outline flex items-center gap-2 border-slate-200 shadow-sm hover:border-amber-300 hover:bg-amber-50/60"
        >
          알림 리스트
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-sm font-semibold text-amber-700">
            {filteredAlerts.length}
          </span>
          <span className={`text-xs text-slate-600 transition ${open ? 'rotate-180' : 'rotate-0'}`}>▼</span>
        </button>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {FILTERS.map((t) => (
            <Link
              key={t}
              href={`/dashboard?atype=${t}&year=${year}&month=${month}`}
              className={`ui-btn-outline w-full px-3 py-2 text-sm ${typeParam === t ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-700 hover:border-amber-200 hover:bg-amber-50/60 hover:text-amber-700'} sm:w-auto`}
            >
              {t === 'ALL' ? '전체' : ALERT_LABEL[t]}
            </Link>
          ))}
          <Link
            href="/dashboard/alerts"
            className="ui-btn-outline col-span-2 w-full border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700 shadow-sm hover:border-primary-300 hover:bg-primary-100 sm:col-span-1 sm:w-auto"
          >
            전체 보기
          </Link>
        </div>
      </div>

      <div
        id="alert-panel"
        className={`mt-3 grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100 translate-y-0' : 'grid-rows-[0fr] opacity-0 -translate-y-1'}`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2">
            {filteredAlerts.slice(0, 8).map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ALERT_COLOR[a.type]}`}>
                        {ALERT_LABEL[a.type]}
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">{studentMap[a.studentId] ?? '-'}</span>
                      <span className="text-sm text-slate-500 truncate">{schoolMap[a.schoolId] ?? '-'}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                      <span>{a.year}년 {a.month}월</span>
                      <span>{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                    {a.memo && <p className="mt-1 text-sm text-slate-600 truncate">{a.memo}</p>}
                  </div>
                  <form action={resolveAlertAction.bind(null, a.id)} className="shrink-0">
                    <button className="ui-btn-outline border-emerald-200 px-3 py-1.5 text-xs text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 whitespace-nowrap">
                      확인
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {filteredAlerts.length === 0 && (
              <p className="ui-empty">대기 중인 알림이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
