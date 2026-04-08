"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type HeaderUserMenuProps = {
  role?: string;
  name?: string | null;
  email?: string | null;
};

export function HeaderUserMenu({ role, name, email }: HeaderUserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/login?loggedOut=1';
  };

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
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${displayName} 메뉴`}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-sp-border bg-sp-surface shadow-2xl">
          {/* 사용자 정보 */}
          <div className="border-b border-sp-border px-4 py-3">
            <p className="text-sm font-semibold text-sp-text truncate">{displayName}</p>
            {email && <p className="text-xs text-sp-muted truncate">{email}</p>}
            <span className="mt-1 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {roleLabel}
            </span>
          </div>

          {/* 로그아웃 */}
          <button
            type="button"
            onClick={() => { close(); void handleSignOut(); }}
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
