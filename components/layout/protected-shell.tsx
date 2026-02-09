"use client";

import clsx from 'clsx';
import React, { type ReactNode } from 'react';
import { signOut } from 'next-auth/react';
import { HeaderUserMenu } from '@/components/layout/header-user-menu';
import { ProtectedNav } from '@/components/protected-nav';
import { NavigationOverlayProvider, PathnameWatcher } from '@/components/navigation-overlay';

type ProtectedShellProps = {
  user: { name?: string | null; email?: string | null };
  role: string;
  children: ReactNode;
};

export function ProtectedShell({ user, role, children }: ProtectedShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('navCollapsed') : null;
    setCollapsed(v === '1');
  }, []);
  React.useEffect(() => {
    const idleLimitMs = 60 * 60 * 1000;
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void signOut({ callbackUrl: '/login?loggedOut=1' });
      }, idleLimitMs);
    };

    resetTimer();
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('navCollapsed', next ? '1' : '0');
    } catch {}
  };

  return (
    <NavigationOverlayProvider>
      <PathnameWatcher />
      <div className="min-h-screen">
        {/* 모바일 헤더: 드롭다운 메뉴 버튼 표시 */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3 sm:px-6">
            <HeaderUserMenu role={role} name={user.name} email={user.email} />
          </div>
        </header>

        {/* 데스크톱 좌측 네비 + 본문 */}
        <div className={clsx('mx-auto hidden max-w-6xl gap-6 px-3 py-8 sm:px-6 md:grid', collapsed ? 'grid-cols-[92px_1fr]' : 'grid-cols-[240px_1fr]')}>
          <aside className={clsx('sticky top-6 h-fit ui-card ui-card-compact', collapsed && 'p-3')}>
            <div className="mb-2 flex items-center justify-between">
              {!collapsed ? (
                <div className="px-1 text-base font-semibold text-slate-700">{`${user.name ?? '사용자'}님 환영합니다.`}</div>
              ) : (
                <div className="h-5" />
              )}
              <button onClick={toggleCollapsed} className="ui-btn-outline whitespace-nowrap px-3 py-1.5 text-sm">
                {collapsed ? '펼치기' : '접기'}
              </button>
            </div>
            <ProtectedNav role={role} orientation="vertical" collapsed={collapsed} />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>

        {/* 모바일 본문 */}
        <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 md:hidden">{children}</main>
      </div>
    </NavigationOverlayProvider>
  );
}
