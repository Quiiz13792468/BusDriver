'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

interface RealtimeContextValue {
  supabase: ReturnType<typeof createBrowserClient>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const supabaseRef = useRef(createBrowserClient());

  useEffect(() => {
    return () => {
      supabaseRef.current.removeAllChannels();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ supabase: supabaseRef.current }}>
      {children}
    </RealtimeContext.Provider>
  );
}
