import type { ReactNode } from 'react';

import { requireSession } from '@/lib/auth/session';

import { ProtectedShell } from '@/components/layout/protected-shell';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await requireSession();
  const user = session.user ?? { name: null, email: null };

  return <ProtectedShell user={user} role={session.user?.role ?? 'PARENT'}>{children}</ProtectedShell>;
}
