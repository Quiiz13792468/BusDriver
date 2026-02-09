"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import clsx from 'clsx';

import { BusIcon } from '@/components/layout/icons';
import { useNavigationOverlay } from '@/components/navigation-overlay';

type HeaderUserMenuProps = {
  role?: string;
  name?: string | null;
  email?: string | null;
};

type MenuItem = {
  href?: string;
  label: string;
  action?: () => Promise<void> | void;
};

export function HeaderUserMenu({ role, name, email }: HeaderUserMenuProps) {
  const pathname = usePathname() ?? '';
  const { show } = useNavigationOverlay();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const baseItems = useMemo<MenuItem[]>(() => {
    if (role === 'ADMIN') {
      const adminItems: MenuItem[] = [
        { href: '/dashboard', label: '대시보드' },
        { href: '/schools', label: '학교/학생 관리' },
        { href: '/payments', label: '입금 현황' },
        { href: '/board', label: '문의 요청' }
      ];
      adminItems.push({ href: '/payments?payment=1', label: '입금 기록 추가' });
      return adminItems;
    }
    return [
      { href: '/dashboard', label: '대시보드' },
      { href: '/board', label: '문의 게시판' }
    ];
  }, [role]);

  const items = useMemo<MenuItem[]>(
    () => [
      ...baseItems,
      {
        label: '로그아웃',
        action: () => {
          void signOut({ callbackUrl: '/login' });
        }
      }
    ],
    [baseItems]
  );

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        close();
      }
    }

    if (open) {
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, close]);

  const displayName = name ?? email ?? (role === 'ADMIN' ? '관리자' : '사용자');

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="ui-btn-outline inline-flex items-center gap-2 bg-white/95 px-4 py-2 text-base font-semibold shadow-lg shadow-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <BusIcon className="h-5 w-5 text-primary-600" />
        <span className="truncate max-w-[9rem] sm:max-w-[14rem]">{displayName}</span>
        <span aria-hidden className={clsx('text-sm transition-transform', open ? 'rotate-180' : 'rotate-0')}>
          v
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-60 overflow-hidden ui-card shadow-2xl shadow-slate-200/60 ring-1 ring-white md:left-auto md:right-0">
          <nav className="flex flex-col divide-y divide-slate-100 text-base text-slate-700" role="menu">
            {items.map((item) => {
              if (item.href) {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'px-4 py-3 transition hover:bg-primary-50/80 hover:text-primary-700',
                      isActive ? 'text-primary-600' : undefined
                    )}
                    onClick={() => {
                      show();
                      close();
                    }}
                    role="menuitem"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action?.();
                    close();
                  }}
                  className="px-4 py-3 text-left transition hover:bg-primary-50/80 hover:text-primary-700"
                  role="menuitem"
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
