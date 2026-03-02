"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { DashboardIcon, SchoolIcon, RouteIcon, WalletIcon, BoardIcon } from '@/components/layout/nav-icons';
import { useNavigationOverlay } from '@/components/navigation-overlay';

type MobileBottomNavProps = {
  role: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefix?: string;
};

const ADMIN_LEFT: NavItem[] = [
  { href: '/dashboard', label: '대시', icon: DashboardIcon },
  { href: '/schools',   label: '학교',  icon: SchoolIcon },
];

const ADMIN_RIGHT: NavItem[] = [
  { href: '/routes',   label: '노선',  icon: RouteIcon },
  { href: '/payments', label: '입금',  icon: WalletIcon, matchPrefix: '/payments' },
  { href: '/board',    label: '게시판', icon: BoardIcon },
];

const PARENT_TABS: NavItem[] = [
  { href: '/dashboard', label: '대시보드', icon: DashboardIcon },
  { href: '/board',     label: '게시판',   icon: BoardIcon },
];

function NavTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const { show } = useNavigationOverlay();
  return (
    <Link
      href={item.href}
      onClick={() => { if (!active) show('이동 중...'); }}
      className={clsx(
        'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
        active ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
      )}
    >
      <Icon className={clsx('h-6 w-6', active ? 'text-primary-600' : 'text-slate-400')} />
      <span>{item.label}</span>
      {active && (
        <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary-500" aria-hidden />
      )}
    </Link>
  );
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const { show } = useNavigationOverlay();

  function isActive(item: NavItem) {
    const prefix = item.matchPrefix ?? item.href;
    if (item.href === '/payments') {
      return pathname.startsWith(prefix) && searchParams?.get('payment') !== '1';
    }
    if (item.href === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (role !== 'ADMIN') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-slate-200 bg-white/95 backdrop-blur-sm safe-bottom md:hidden">
        {PARENT_TABS.map((item) => (
          <NavTab key={item.href} item={item} active={isActive(item)} />
        ))}
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {ADMIN_LEFT.map((item) => (
        <NavTab key={item.href} item={item} active={isActive(item)} />
      ))}

      {/* 중앙 입금 등록 FAB */}
      <div className="relative flex flex-none items-center justify-center px-2">
        <Link
          href="/payments?payment=1"
          onClick={() => show('이동 중...')}
          className="flex h-14 w-14 -translate-y-3 flex-col items-center justify-center rounded-full bg-primary-600 shadow-lg shadow-primary-200/60 transition active:scale-95 active:bg-primary-700"
          aria-label="입금 등록"
        >
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="mt-0.5 text-[9px] font-bold leading-none text-white">입금등록</span>
        </Link>
      </div>

      {ADMIN_RIGHT.map((item) => (
        <NavTab key={item.href} item={item} active={isActive(item)} />
      ))}
    </nav>
  );
}
