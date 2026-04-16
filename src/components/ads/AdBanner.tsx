'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export default function AdBanner() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER ?? '0000000000'

  useEffect(() => {
    if (!clientId) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // adsbygoogle not ready yet
    }
  }, [clientId])

  if (!clientId) return null

  return (
    /* 모바일 하단 고정 배너 — 데스크톱(lg+)에서는 숨김 */
    <div
      className="lg:hidden fixed left-0 right-0 z-30 bg-white border-t border-[#F2F2F7] overflow-hidden"
      style={{ bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))', height: 'var(--ad-banner-h)' }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="banner"
        data-full-width-responsive="false"
      />
    </div>
  )
}
