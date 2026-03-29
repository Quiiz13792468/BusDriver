'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtime } from '@/components/realtime-provider';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export function InactivityTracker() {
  const router = useRouter();
  const { supabase } = useRealtime();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = useRef<number>(0);

  useEffect(() => {
    function resetTimer() {
      const now = Date.now();
      if (now - lastResetRef.current < 1000) return; // throttle: max once per second
      lastResetRef.current = now;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/login?reason=inactive');
      }, INACTIVITY_TIMEOUT_MS);
    }

    resetTimer();
    EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [router, supabase]);

  return null;
}
