'use client';

import { useEffect } from 'react';
import clsx from 'clsx';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

type AdSlotProps = {
  placement: string;
  className?: string;
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
};

export function AdSlot({ placement, className, slot, format = 'auto' }: AdSlotProps) {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const effectiveSlot = slot ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAIN;
  const canRenderRealAd = Boolean(enabled && client && effectiveSlot);

  useEffect(() => {
    if (!canRenderRealAd) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [canRenderRealAd, placement]);

  if (!enabled) return null;

  const formatClass =
    format === 'horizontal' ? 'min-h-[90px]' : format === 'rectangle' ? 'min-h-[250px]' : 'min-h-[120px]';

  return (
    <aside className={clsx('ui-card ui-card-compact border-slate-200/80 bg-white/85', className)} aria-label="광고 영역">
      <div className="mb-2 flex items-center justify-between">
        <span className="ui-badge">광고</span>
        <span className="text-sm text-slate-500">{placement}</span>
      </div>

      {canRenderRealAd ? (
        <ins
          className={clsx('adsbygoogle block w-full overflow-hidden rounded-xl bg-slate-50', formatClass)}
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={effectiveSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div className={clsx('flex w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-600', formatClass)}>
          오픈베타 광고 영역 (설정 후 실제 광고 노출)
        </div>
      )}
    </aside>
  );
}
