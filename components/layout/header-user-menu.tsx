"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'next-auth/react';
import clsx from 'clsx';

type HeaderUserMenuProps = {
  role?: string;
  name?: string | null;
  email?: string | null;
};

export function HeaderUserMenu({ role, name, email }: HeaderUserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const displayName = name ?? email ?? (role === 'ADMIN' ? '관리자' : '사용자');
  const roleLabel   = role === 'ADMIN' ? '관리자' : '학부모';
  const initial     = (displayName[0] ?? '?').toUpperCase();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) close();
    }
    window.addEventListener('mousedown', onOutside);
    return () => window.removeEventListener('mousedown', onOutside);
  }, [open, close]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-700 active:scale-95"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {/* Avatar */}
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
          {initial}
        </span>
        <span className="max-w-[7rem] truncate">{displayName}</span>
        <svg
          className={clsx('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')}
          viewBox="0 0 24 24" fill="none"
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/60">
          {/* 사용자 정보 */}
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
            {email && <p className="text-xs text-slate-500 truncate">{email}</p>}
            <span className="mt-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {roleLabel}
            </span>
          </div>

          {/* 로그아웃 */}
          <button
            type="button"
            onClick={() => { close(); void signOut({ callbackUrl: '/login' }); }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            role="menuitem"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
