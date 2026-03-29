'use client';

import { useEffect, useState } from 'react';
import { useRealtime } from '@/components/realtime-provider';

/**
 * Subscribe to new alerts for the current user
 * Returns live count of PENDING alerts
 */
export function useRealtimeAlerts(initialCount: number = 0) {
  const [count, setCount] = useState(initialCount);
  const { supabase } = useRealtime();

  useEffect(() => {

    const channel = supabase
      .channel('realtime-alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts', filter: 'status=eq.PENDING' },
        () => {
          // Refetch count on any change
          // RLS scopes this query to the current user's accessible alerts
          supabase
            .from('alerts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'PENDING')
            .then(({ count: c }) => {
              if (c !== null) setCount(c);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return count;
}

/**
 * Subscribe to unread board notifications for the current user
 */
export function useRealtimeBoardNotifications(initialCount: number = 0) {
  const [count, setCount] = useState(initialCount);
  const { supabase } = useRealtime();

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      channel = supabase
        .channel('realtime-board-notifs')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'board_notifications' },
          () => {
            supabase
              .from('board_notifications')
              .select('id', { count: 'exact', head: true })
              .eq('is_read', false)
              .eq('user_id', user.id)
              .then(({ count: c }) => {
                if (c !== null) setCount(c);
              });
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  return count;
}

/**
 * Subscribe to payment changes - fires callback on any payment INSERT/UPDATE
 */
export function useRealtimePayments(onPaymentChange: () => void) {
  const { supabase } = useRealtime();

  useEffect(() => {
    const channel = supabase
      .channel('realtime-payments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        onPaymentChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, onPaymentChange]);
}
