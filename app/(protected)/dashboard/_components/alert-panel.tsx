"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { resolveAlertAction } from '@/app/(protected)/dashboard/actions';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';

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
  PAYMENT: '입금 확인 요청',
  INQUIRY: '문의 등록',
  ROUTE_CHANGE: '탑승지점 변경'
};

const FILTERS: AlertType[] = ['ALL', 'PAYMENT', 'INQUIRY', 'ROUTE_CHANGE'];

export function AlertPanel({ alerts, typeParam, year, month, schoolMap, studentMap }: AlertPanelProps) {
  const [open, setOpen] = useState(false);

  const filteredAlerts = useMemo(
    () => (typeParam === 'ALL' ? alerts : alerts.filter((a) => a.type === typeParam)),
    [alerts, typeParam]
  );

  return (
    <div className="ui-card ui-card-compact">
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
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((t) => (
            <Link
              key={t}
              href={`/dashboard?atype=${t}&year=${year}&month=${month}`}
              className={`ui-btn-outline px-3 py-1 text-sm ${typeParam===t ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-700 hover:border-amber-200 hover:bg-amber-50/60 hover:text-amber-700'}`}
            >
              {t === 'ALL' ? '전체' : ALERT_LABEL[t]}
            </Link>
          ))}
          <Link
            href="/dashboard/alerts"
            className="ui-btn-outline border-primary-200 bg-primary-50 px-3 py-1 text-sm text-primary-700 shadow-sm hover:border-primary-300 hover:bg-primary-100"
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
          <div className="ui-table-wrap">
            <UiTable className="divide-y divide-slate-200">
              <UiThead className="bg-slate-50">
                <UiTr>
                  <UiTh className="w-[5rem] border-r border-slate-200 px-[0.3rem] py-2">유형</UiTh>
                  <UiTh className="border-r border-slate-200 px-[0.3rem] py-2">학생</UiTh>
                  <UiTh className="border-r border-slate-200 px-[0.3rem] py-2">학교</UiTh>
                  <UiTh className="w-[6rem] border-r border-slate-200 px-[0.3rem] py-2">연월</UiTh>
                  <UiTh className="border-r border-slate-200 px-[0.3rem] py-2">메모</UiTh>
                  <UiTh className="border-r border-slate-200 px-[0.3rem] py-2">요청시각</UiTh>
                  <UiTh className="w-[4rem] px-[0.3rem] py-2">확인</UiTh>
                </UiTr>
              </UiThead>
              <UiTbody className="divide-y divide-slate-100">
                {filteredAlerts.slice(0, 8).map((a) => (
                  <UiTr key={a.id}>
                    <UiTd className="w-[5rem] border-r border-slate-200 px-[0.3rem] py-2 text-center align-middle font-medium text-slate-900">
                      <span className="mx-auto block max-w-[7.5rem] leading-tight text-slate-900">{ALERT_LABEL[a.type] ?? '알림'}</span>
                    </UiTd>
                    <UiTd className="border-r border-slate-200 px-[0.3rem] py-2 text-center align-middle text-slate-700">{studentMap[a.studentId] ?? '-'}</UiTd>
                    <UiTd className="border-r border-slate-200 px-[0.3rem] py-2 text-center align-middle text-slate-700">{schoolMap[a.schoolId] ?? '-'}</UiTd>
                    <UiTd className="w-[6rem] border-r border-slate-200 px-[0.3rem] py-2 text-center align-middle text-slate-700">{a.year}년 {a.month}월</UiTd>
                    <UiTd className="border-r border-slate-200 px-[0.3rem] py-2 text-center align-middle text-slate-700">{a.memo ?? '-'}</UiTd>
                    <UiTd className="border-r border-slate-200 px-[0.3rem] py-2 text-center align-middle text-slate-700">{new Date(a.createdAt).toLocaleString()}</UiTd>
                    <UiTd className="w-[4rem] px-[0.3rem] py-2 text-center align-middle">
                      <form action={resolveAlertAction.bind(null, a.id)}>
                        <button className="ui-btn-outline border-emerald-200 px-3 py-1.5 text-sm text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50">
                          알림 확인
                        </button>
                      </form>
                    </UiTd>
                  </UiTr>
                ))}
                {filteredAlerts.length === 0 ? (
                  <UiTr>
                    <UiTd colSpan={7} className="text-center text-base text-slate-700">대기 중인 알림이 없습니다.</UiTd>
                  </UiTr>
                ) : null}
              </UiTbody>
            </UiTable>
          </div>
        </div>
      </div>
    </div>
  );
}
