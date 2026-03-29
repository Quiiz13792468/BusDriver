'use client';

import Link from 'next/link';
import { useRealtimeAlerts } from '@/lib/supabase/realtime';

type MobileAlertBellProps = {
  count: number;
  href: string;
};

export function MobileAlertBell({ count, href }: MobileAlertBellProps) {
  const liveCount = useRealtimeAlerts(count);
  const badge = liveCount > 9 ? '9+' : liveCount > 0 ? String(liveCount) : null;

  return (
    <Link
      href={href}
      className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100 active:bg-slate-200"
      aria-label={`알림 ${liveCount}건`}
    >
      {/* Bell icon */}
      <svg className="h-6 w-6 text-slate-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 0 0-5-5.917V4a1 1 0 1 0-2 0v1.083A6 6 0 0 0 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Badge */}
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
