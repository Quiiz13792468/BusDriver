"use client";

import clsx from 'clsx';
import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { HeaderUserMenu } from '@/components/layout/header-user-menu';
import { MobileAlertBell } from '@/components/layout/mobile-alert-bell';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { ProtectedNav } from '@/components/protected-nav';
import { BusIcon } from '@/components/layout/icons';
import { NavigationOverlayProvider, PathnameWatcher } from '@/components/navigation-overlay';

type ProtectedShellProps = {
  user: { name?: string | null; email?: string | null };
  role: string;
  alertCount?: number;
  children: ReactNode;
};

export function ProtectedShell({ user, role, alertCount = 0, children }: ProtectedShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('navCollapsed') : null;
    setCollapsed(v === '1');
  }, []);

  // 자동 로그아웃 (60분 비활성)
  React.useEffect(() => {
    const idleLimitMs = 60 * 60 * 1000;
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];
    let timer: ReturnType<typeof setTimeout> | null = null;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { void signOut({ callbackUrl: '/login?loggedOut=1' }); }, idleLimitMs);
    };
    resetTimer();
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('navCollapsed', next ? '1' : '0'); } catch {}
  };

  // 알림 링크: 관리자 → /dashboard/alerts, 학부모 → /board (게시판)
  const alertHref = role === 'ADMIN' ? '/dashboard/alerts' : '/board';

  return (
    <NavigationOverlayProvider>
      <PathnameWatcher />
      <div className="min-h-screen">

        {/* ── 모바일 상단 헤더 ── */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
          <div className="flex h-[44px] items-center justify-between px-3">
            {/* 로고 + 앱명 → 대시보드로 이동 */}
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-800 transition active:opacity-70">
              <BusIcon className="h-7 w-7 text-primary-600" />
              <span className="text-base font-bold tracking-tight">통학버스 관리</span>
            </Link>

            {/* 우측: 알림 벨 + 유저 메뉴 */}
            <div className="flex items-center gap-1">
              {alertCount > 0 && (
                <MobileAlertBell count={alertCount} href={alertHref} />
              )}
              <HeaderUserMenu role={role} name={user.name} email={user.email} />
            </div>
          </div>
        </header>

        {/* ── 데스크톱: 좌측 사이드바 + 본문 ── */}
        <div className={clsx(
          'mx-auto hidden max-w-6xl gap-4 px-3 py-4 sm:px-6 md:grid',
          collapsed ? 'grid-cols-[80px_1fr]' : 'grid-cols-[220px_1fr]'
        )}>
          <aside className={clsx('sticky top-6 h-fit ui-card ui-card-compact', collapsed && 'p-3')}>
            <div className="mb-2 flex items-center justify-between">
              {!collapsed ? (
                <div className="px-1 text-base font-semibold text-slate-700">
                  {`${user.name ?? '사용자'}님 환영합니다.`}
                </div>
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

        {/* ── 모바일 본문 ── */}
        <main className="mx-auto max-w-6xl px-3 py-2 pb-[60px] sm:px-4 sm:py-3 md:hidden">
          {children}
        </main>

        {/* ── 모바일 하단 탭바 ── */}
        <MobileBottomNav role={role} />
      </div>
    </NavigationOverlayProvider>
  );
}
