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
  ALL: 'bg-sp-raised text-sp-muted',
  PAYMENT: 'bg-emerald-900/30 text-emerald-400',
  INQUIRY: 'bg-blue-900/30 text-blue-400',
  ROUTE_CHANGE: 'bg-amber-900/30 text-amber-400'
};

const FILTERS: AlertType[] = ['ALL', 'PAYMENT', 'INQUIRY', 'ROUTE_CHANGE'];

export function AlertPanel({ alerts, typeParam, year, month, schoolMap, studentMap }: AlertPanelProps) {
  const [open, setOpen] = useState(true);

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
          className="ui-btn-outline flex items-center gap-2 border-sp-line shadow-sm hover:border-sp-green hover:bg-sp-raised"
        >
          알림 리스트
          <span className="rounded-full border border-sp-green/40 bg-sp-green/10 px-2.5 py-0.5 text-sm font-semibold text-sp-green">
            {filteredAlerts.length}
          </span>
          <span className={`text-xs text-sp-muted transition ${open ? 'rotate-180' : 'rotate-0'}`}>▼</span>
        </button>
        <div className="flex w-full flex-col gap-1.5">
          <div>
            <Link
              href={`/dashboard?atype=ALL&year=${year}&month=${month}`}
              className={`ui-btn-outline px-3 py-2 text-sm ${typeParam === 'ALL' ? 'border-sp-green bg-sp-green/15 text-sp-green' : 'border-sp-line text-sp-muted hover:border-sp-green hover:bg-sp-raised hover:text-sp-green'}`}
            >
              전체
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['PAYMENT', 'INQUIRY', 'ROUTE_CHANGE'] as AlertType[]).map((t) => (
              <Link
                key={t}
                href={`/dashboard?atype=${t}&year=${year}&month=${month}`}
                className={`ui-btn-outline shrink-0 px-3 py-2 text-sm ${typeParam === t ? 'border-sp-green bg-sp-green/15 text-sp-green' : 'border-sp-line text-sp-muted hover:border-sp-green hover:bg-sp-raised hover:text-sp-green'}`}
              >
                {ALERT_LABEL[t]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div
        id="alert-panel"
        className={`mt-3 grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100 translate-y-0' : 'grid-rows-[0fr] opacity-0 -translate-y-1'}`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2">
            {filteredAlerts.slice(0, 8).map((a) => (
              <div key={a.id} className="rounded-xl border border-sp-border p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ALERT_COLOR[a.type]}`}>
                      {ALERT_LABEL[a.type]}
                    </span>
                    <span className="font-semibold text-sp-text text-sm">{studentMap[a.studentId] ?? '-'}</span>
                    <span className="text-sm text-sp-faint truncate">{schoolMap[a.schoolId] ?? '-'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-sp-faint">
                    <span>{a.year}년 {a.month}월</span>
                    <span>{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  {a.memo && <p className="mt-1 text-sm text-sp-muted truncate">{a.memo}</p>}
                </div>
                <form action={resolveAlertAction.bind(null, a.id)} className="mt-2">
                  <button className="w-full ui-btn-outline border-emerald-700 px-3 py-1.5 text-xs text-emerald-400 hover:border-emerald-500 hover:bg-emerald-900/30 whitespace-nowrap">
                    확인
                  </button>
                </form>
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
