'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type DashboardAutoRefreshProps = {
  intervalMs?: number;
};

export function DashboardAutoRefresh({ intervalMs = 30_000 }: DashboardAutoRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, router, startTransition]);

  return null;
}
