"use client";

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-sm font-medium text-slate-600 transition hover:text-primary-600"
    >
      로그아웃
    </button>
  );
}
