"use client";

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { requestShortagePaymentAction } from '@/app/(protected)/dashboard/actions';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';

type ShortageRow = {
  studentId: string;
  studentName: string;
  schoolName: string;
  parentName: string;
  parentPhone: string;
  feeAmount: number;
  paidAmount: number;
  shortageAmount: number;
};

const initialState = { status: 'idle', message: '' } as { status: 'idle' | 'success' | 'error'; message: string };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${disabled || pending ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-primary-600 text-white hover:bg-primary-500'}`}
    >
      {pending ? '요청 중...' : '입금확인요청'}
    </button>
  );
}

export function ShortageRequestForm({ rows, year, month }: { rows: ShortageRow[]; year: number; month: number }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, formAction] = useFormState(requestShortagePaymentAction, initialState);

  const allIds = useMemo(() => rows.map((r) => r.studentId), [rows]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;
  const totalShortage = useMemo(() => rows.reduce((sum, r) => sum + r.shortageAmount, 0), [rows]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="year" value={String(year)} />
      <input type="hidden" name="month" value={String(month)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-base text-slate-700">
          <span>부족 인원 {rows.length}명 · 총 부족금액 {totalShortage.toLocaleString()}원</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelected(new Set(allIds))}
              disabled={rows.length === 0}
              className="ui-btn-outline px-2.5 py-1 text-sm hover:border-amber-300 hover:bg-amber-50/60"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={rows.length === 0}
              className="ui-btn-outline px-2.5 py-1 text-sm hover:border-amber-300 hover:bg-amber-50/60"
            >
              선택 해제
            </button>
          </div>
        </div>
        <SubmitButton disabled={selectedCount === 0} />
      </div>
      {state.message ? (
        <p className={`text-sm ${state.status === 'success' ? 'text-emerald-600' : state.status === 'error' ? 'text-rose-600' : 'text-slate-700'}`}>{state.message}</p>
      ) : null}
      <div className="ui-table-wrap">
        <UiTable>
          <UiThead className="bg-slate-50">
            <UiTr>
              <UiTh className="px-[0.3rem]">선택</UiTh>
              <UiTh className="px-[0.3rem]">학생</UiTh>
              <UiTh className="px-[0.3rem]">학교</UiTh>
              <UiTh className="px-[0.3rem]">학부모</UiTh>
              <UiTh className="px-[0.3rem]">연락처</UiTh>
              <UiTh className="px-[0.3rem]">이용금액</UiTh>
              <UiTh className="px-[0.3rem]">입금액</UiTh>
              <UiTh className="px-[0.3rem]">부족금액</UiTh>
            </UiTr>
          </UiThead>
          <UiTbody>
            {rows.map((row) => (
              <UiTr key={row.studentId}>
                <UiTd className="px-[0.3rem] text-center">
                  <input
                    type="checkbox"
                    name="studentIds"
                    value={row.studentId}
                    checked={selected.has(row.studentId)}
                    onChange={() => toggle(row.studentId)}
                    className="h-4 w-4 accent-amber-500"
                  />
                </UiTd>
                <UiTd className="px-[0.3rem] text-slate-800">{row.studentName}</UiTd>
                <UiTd className="px-[0.3rem] text-slate-700">{row.schoolName}</UiTd>
                <UiTd className="px-[0.3rem] text-slate-700">{row.parentName}</UiTd>
                <UiTd className="px-[0.3rem] text-slate-700">{row.parentPhone}</UiTd>
                <UiTd className="px-[0.3rem] text-right text-slate-800">{row.feeAmount.toLocaleString()}원</UiTd>
                <UiTd className="px-[0.3rem] text-right text-emerald-600">{row.paidAmount.toLocaleString()}원</UiTd>
                <UiTd className="px-[0.3rem] text-right font-semibold text-rose-600">{row.shortageAmount.toLocaleString()}원</UiTd>
              </UiTr>
            ))}
            {rows.length === 0 ? (
              <UiTr>
                <UiTd colSpan={8} className="text-center text-base text-slate-700">부족 인원이 없습니다.</UiTd>
              </UiTr>
            ) : null}
          </UiTbody>
        </UiTable>
      </div>
    </form>
  );
}
