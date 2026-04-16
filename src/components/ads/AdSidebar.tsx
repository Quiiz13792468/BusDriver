'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export default function AdSidebar() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? '0000000001'

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
    /* 데스크톱(lg+)에서만 표시 */
    <aside className="hidden lg:flex flex-col w-[300px] flex-none sticky top-[var(--header-h)] h-[calc(100vh-var(--header-h))] overflow-y-auto">
      <div className="p-4">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: '600px' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="vertical"
          data-full-width-responsive="false"
        />
      </div>
    </aside>
  )
}
