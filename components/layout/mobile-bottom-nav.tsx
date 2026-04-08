"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { DashboardIcon, SchoolIcon, RouteIcon, WalletIcon, BoardIcon, MapIcon } from '@/components/layout/nav-icons';
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

const ADMIN_TABS: NavItem[] = [
  { href: '/dashboard', label: '메인',  icon: DashboardIcon },
  { href: '/schools',   label: '학교',  icon: SchoolIcon },
  { href: '/routes',    label: '노선',  icon: RouteIcon },
  { href: '/payments',  label: '매출',  icon: WalletIcon, matchPrefix: '/payments' },
  { href: '/board',     label: '게시판', icon: BoardIcon },
];

const PARENT_TABS: NavItem[] = [
  { href: '/dashboard',         label: '메인', icon: DashboardIcon },
  { href: '/dashboard/route',   label: '노선확인', icon: RouteIcon },
  { href: '/dashboard/pickup',  label: '노선변경', icon: MapIcon },
  { href: '/board',             label: '게시판',   icon: BoardIcon },
];

function NavTab({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const { show } = useNavigationOverlay();
  return (
    <Link
      href={item.href}
      onClick={() => { if (!active) show('잠시만 기다려 주세요.'); }}
      className="relative flex h-16 flex-1 flex-col items-center justify-center gap-0.5"
      aria-current={active ? 'page' : undefined}
    >
      {/* active 상태: pill 배경 */}
      <span
        className={clsx(
          'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
          active ? 'bg-teal-500/10' : 'bg-transparent'
        )}
      >
        <Icon className={clsx('h-6 w-6', active ? 'text-sp-green' : 'text-sp-faint')} />
      </span>
      <span className={clsx(
        'text-[11px] font-semibold leading-none',
        active ? 'text-sp-green' : 'text-sp-faint'
      )}>
        {item.label}
      </span>
    </Link>
  );
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();

  function isActive(item: NavItem) {
    const prefix = item.matchPrefix ?? item.href;
    if (item.href === '/payments') {
      return pathname.startsWith(prefix) && searchParams?.get('payment') !== '1';
    }
    // /dashboard 탭은 하위 경로(route, pickup 등)가 별도 탭으로 있을 때 정확히 일치할 때만 active
    if (item.href === '/dashboard') {
      const hasSubTab = PARENT_TABS.some((t) => t.href !== '/dashboard' && t.href.startsWith('/dashboard/'));
      if (hasSubTab) return pathname === '/dashboard';
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const tabs = role === 'ADMIN' ? ADMIN_TABS : PARENT_TABS;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-sp-border backdrop-blur-sm md:hidden"
      style={{ backgroundColor: 'rgba(255,255,255,0.90)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map((item) => (
        <NavTab key={item.href} item={item} active={isActive(item)} />
      ))}
    </nav>
  );
}
