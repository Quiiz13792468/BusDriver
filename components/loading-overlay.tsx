"use client";

import { useEffect } from 'react';
import { Notiflix, ensureNotiflixConfigured } from '@/lib/ui/notiflix';

export function LoadingOverlay({ show, message = '로딩 중...' }: { show: boolean; message?: string }) {
  useEffect(() => {
    ensureNotiflixConfigured();
    if (show) {
      Notiflix.Loading.dots(message);
      return () => {
        try {
          Notiflix.Loading.remove();
        } catch {}
      };
    }
    try {
      Notiflix.Loading.remove();
    } catch {}
    return undefined;
  }, [show, message]);

  return null as any;
}