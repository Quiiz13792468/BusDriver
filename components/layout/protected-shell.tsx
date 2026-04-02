"use client";

import clsx from 'clsx';
import React, { type ReactNode } from 'react';
import Link from 'next/link';
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

  // 자동 로그아웃은 middleware(서버)에서 30분 비활성 기준으로 처리함
  // 클라이언트 중복 타이머 제거

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
          <div className="flex h-[52px] items-center justify-between px-3">
            {/* 좌측: 테두리 있는 버스 아이콘
                관리자: 클릭 시 입금 등록 페이지로 이동
                학부모: 대시보드로 이동 */}
            <Link
              href={role === 'ADMIN' ? '/payments?payment=1' : '/dashboard'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition active:opacity-70"
              aria-label={role === 'ADMIN' ? '입금 등록' : '대시보드로 이동'}
            >
              <BusIcon className="h-6 w-6 text-primary-600" />
            </Link>

            {/* 우측: 알림 벨 + 유저 메뉴 */}
            <div className="flex items-center gap-1">
              <HeaderUserMenu role={role} name={user.name} email={user.email} />
              <MobileAlertBell count={alertCount} href={alertHref} />
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
                  {`${user.name ?? '사용자'}님`}
                </div>
              ) : (
                <div className="h-5" />
              )}
              <button onClick={toggleCollapsed} className="ui-btn-outline p-1.5" aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}>
                {collapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                )}
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
