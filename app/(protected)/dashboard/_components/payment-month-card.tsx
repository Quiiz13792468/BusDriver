'use client';

import clsx from 'clsx';
import type { PaymentSummary } from '@/lib/data/types';

interface PaymentMonthCardProps {
  year: number;
  month: number;
  summary: PaymentSummary | null; // null = no data (future month)
  isCurrent: boolean;
  onClick?: () => void;
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

export function PaymentMonthCard({ year, month, summary, isCurrent, onClick }: PaymentMonthCardProps) {
  const effectiveFee = summary?.effectiveFee ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const status = summary?.status ?? 'UNPAID';
  const shortage = summary?.shortage ?? 0;

  const progressPct = effectiveFee > 0 ? Math.min(100, Math.round((totalPaid / effectiveFee) * 100)) : 0;

  const now = new Date();
  const isPast = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  const isOverdue = isPast && status !== 'PAID' && effectiveFee > 0;

  const cardBg = isOverdue ? 'bg-rose-50 border-rose-200'
    : status === 'PAID' ? 'bg-emerald-50 border-emerald-200'
    : status === 'PARTIAL' ? 'bg-amber-50 border-amber-200'
    : 'bg-white border-slate-200';

  const barColor = isOverdue ? 'bg-rose-400'
    : status === 'PAID' ? 'bg-emerald-400'
    : status === 'PARTIAL' ? 'bg-amber-400'
    : 'bg-slate-200';

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'relative w-full rounded-xl border p-3 text-left transition active:scale-95',
        cardBg,
        isCurrent && 'ring-2 ring-primary-400 ring-offset-1'
      )}
      style={{ minHeight: '80px' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-slate-800">{MONTH_LABELS[month - 1]}</span>
        {isOverdue && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">미납</span>
        )}
        {status === 'PAID' && !isOverdue && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">완납</span>
        )}
        {status === 'PARTIAL' && !isOverdue && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">부분납</span>
        )}
      </div>
      {effectiveFee > 0 && (
        <>
          <div className="mt-2 text-xs text-slate-500">
            {totalPaid.toLocaleString()}원 / {effectiveFee.toLocaleString()}원
          </div>
          <div
            className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="납부 진행률"
          >
            <div
              className={clsx('h-full rounded-full transition-all', barColor)}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {shortage > 0 && (
            <div className="mt-1 text-xs font-medium text-rose-600">
              부족: {shortage.toLocaleString()}원
            </div>
          )}
        </>
      )}
    </button>
  );
}
