"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';

type Ctx = {
  show: (message?: string) => void;
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
  const [message, setMessage] = useState('잠시만 기다려 주세요.');
  const msgRef = useRef('잠시만 기다려 주세요.');

  const value = useMemo<Ctx>(
    () => ({
      show: (msg?: string) => {
        const m = msg ?? '잠시만 기다려 주세요.';
        msgRef.current = m;
        setMessage(m);
        setVisible(true);
      },
      hide: () => setVisible(false)
    }),
    []
  );

  return (
    <NavigationOverlayContext.Provider value={value}>
      {children}
      <Overlay visible={visible} message={message} />
    </NavigationOverlayContext.Provider>
  );
}

export function PathnameWatcher() {
  const pathname = usePathname();
  const { hide } = useNavigationOverlay();
  useEffect(() => {
    hide();
  }, [pathname, hide]);
  return null;
}

function Overlay({ visible, message }: { visible: boolean; message: string }) {
  if (!visible || typeof window === 'undefined') return null as any;

  return createPortal(
    <div className="ui-overlay-backdrop fixed inset-0 z-[9999] flex items-center justify-center bg-[#13201f]/30 backdrop-blur-sm">
      <div className="ui-overlay-panel ui-card ui-card-pad w-[340px] text-center shadow-2xl">
        <div className="mx-auto flex items-center justify-center">
          <Image src="/assets/schoolbus_loading.gif" alt="로딩 중" width={64} height={64} unoptimized priority />
        </div>
        <p className="text-lg font-semibold text-slate-900">{message}</p>
      </div>
    </div>,
    document.body
  );
}
