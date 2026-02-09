"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import clsx from 'clsx';
import { useMemo } from 'react';
import { DashboardIcon, SchoolIcon, RouteIcon, WalletIcon, BoardIcon, LogoutIcon } from '@/components/layout/nav-icons';
import { useNavigationOverlay } from '@/components/navigation-overlay';

type ProtectedNavProps = {
  role?: string;
  orientation?: 'horizontal' | 'vertical';
  collapsed?: boolean;
};

export function ProtectedNav({ role, orientation = 'horizontal', collapsed = false }: ProtectedNavProps) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const { show, hide } = useNavigationOverlay();

  const items = useMemo(
    () =>
      role === 'ADMIN'
        ? [
            { href: '/dashboard', label: '대시보드', icon: DashboardIcon },
            { href: '/schools', label: '학교/학생 관리', icon: SchoolIcon },
            { href: '/routes', label: '노선 관리', icon: RouteIcon },
            { href: '/payments', label: '입금 현황', icon: WalletIcon },
            { href: '/board', label: '문의 요청', icon: BoardIcon }
          ]
        : [
            { href: '/dashboard', label: '대시보드', icon: DashboardIcon },
            { href: '/board', label: '문의 게시판', icon: BoardIcon }
          ],
    [role]
  );

  const isVertical = orientation === 'vertical';
  const paymentHref = '/payments?payment=1';
  const paymentAddOpen = searchParams?.get('payment') === '1';
  const isPaymentsPath = pathname === '/payments' || pathname.startsWith('/payments/');

  return (
    <nav className={isVertical ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2 sm:flex-nowrap'}>
      {items.map((item) => {
        const active =
          item.href === '/payments'
            ? isPaymentsPath && !paymentAddOpen
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon as any;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => {
              show();
              if (active) {
                setTimeout(() => hide(), 200);
              }
            }}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            className={clsx(
              isVertical
                ? clsx(
                    'group relative flex items-center rounded-2xl px-4 py-3 text-base font-semibold transition',
                    collapsed ? 'justify-center' : 'gap-2'
                  )
                : 'group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2',
              active
                ? isVertical
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'border-transparent bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white shadow-md shadow-primary-200/60'
                : isVertical
                  ? 'text-slate-700 hover:bg-white/70 hover:text-primary-700'
                  : 'border-slate-200 bg-white/80 text-slate-700 hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-700'
            )}
          >
            {isVertical && Icon ? <Icon className="h-5 w-5 shrink-0 text-slate-600" /> : null}
            {collapsed ? null : <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
            {isVertical ? (
              <span
                className={clsx(
                  'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[4px] rounded-full bg-primary-500 transition-opacity',
                  active ? 'opacity-100' : 'opacity-0'
                )}
                aria-hidden
              />
            ) : null}
          </Link>
        );
      })}
      {isVertical && role === 'ADMIN' ? (
        <Link
          href={paymentHref}
          onClick={(e) => {
            show();
            setTimeout(() => hide(), 200);
          }}
          title={collapsed ? '입금 기록 추가' : undefined}
          className={clsx(
            'group relative flex items-center rounded-2xl px-4 py-3 text-base font-semibold transition',
            collapsed ? 'justify-center' : 'gap-2',
            paymentAddOpen && isPaymentsPath
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-slate-700 hover:bg-white/70 hover:text-primary-700'
          )}
        >
          <WalletIcon className="h-5 w-5 shrink-0 text-slate-600" />
          {collapsed ? null : <span className="relative z-10 whitespace-nowrap">입금 기록 추가</span>}
          <span
            className={clsx(
              'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[4px] rounded-full bg-primary-500 transition-opacity',
              paymentAddOpen && isPaymentsPath ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden
          />
        </Link>
      ) : null}
      {isVertical ? (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login?loggedOut=1' })}
            className={clsx(
              'group relative flex w-full items-center rounded-2xl px-4 py-3 text-base font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700',
              collapsed ? 'justify-center' : 'gap-2'
            )}
          >
            <LogoutIcon className="h-5 w-5 shrink-0 text-slate-600" />
            {!collapsed ? <span className="inline-block">로그아웃</span> : <span className="sr-only">로그아웃</span>}
          </button>
        </div>
      ) : null}
    </nav>
  );
}
