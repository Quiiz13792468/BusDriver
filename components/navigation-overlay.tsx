"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';

type Ctx = {
  show: () => void;
  hide: () => void;
};

const NavigationOverlayContext = createContext<Ctx | null>(null);

export function useNavigationOverlay() {
  const ctx = useContext(NavigationOverlayContext);
  if (!ctx) throw new Error('useNavigationOverlay must be used within NavigationOverlayProvider');
  return ctx;
}

export function NavigationOverlayProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const value = useMemo<Ctx>(
    () => ({
      show: () => setVisible(true),
      hide: () => setVisible(false)
    }),
    []
  );

  return (
    <NavigationOverlayContext.Provider value={value}>
      {children}
      <Overlay visible={visible} />
    </NavigationOverlayContext.Provider>
  );
}

export function PathnameWatcher() {
  const pathname = usePathname();
  const { hide } = useNavigationOverlay();
  useEffect(() => {
    const t = setTimeout(() => hide(), 150);
    return () => clearTimeout(t);
  }, [pathname, hide]);
  return null;
}

function Overlay({ visible }: { visible: boolean }) {
  if (!visible || typeof window === 'undefined') return null as any;
  return createPortal(
    <div className="ui-overlay-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-[#13201f]/30 backdrop-blur-sm">
      <div className="ui-overlay-panel ui-card ui-card-pad w-[340px] text-center shadow-2xl">
        <div className="mx-auto flex items-center justify-center">
          <img src="/assets/schoolbus_loading.gif" alt="로딩 중" className="h-16 w-16" />
        </div>
        <p className="text-lg font-semibold text-slate-900">저장 중...</p>
        <p className="mt-1 text-base text-slate-700">잠시만 기다려 주세요.</p>
      </div>
    </div>,
    document.body
  );
}
