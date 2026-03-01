import type { ReactNode } from 'react';

import { requireSession } from '@/lib/auth/session';
import { countAlerts } from '@/lib/data/alert';
import { countUnreadBoardNotifications } from '@/lib/data/board-notifications';
import { ProtectedShell } from '@/components/layout/protected-shell';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await requireSession();
  const user = session.user ?? { name: null, email: null };
  const role = session.user?.role ?? 'PARENT';
  const userId = (session.user as any)?.id as string | undefined;

  // 역할별 알림 수 조회
  let alertCount = 0;
  if (role === 'ADMIN') {
    alertCount = await countAlerts();
  } else if (role === 'PARENT' && userId) {
    alertCount = await countUnreadBoardNotifications(userId);
  }

  return (
    <ProtectedShell user={user} role={role} alertCount={alertCount}>
      {children}
    </ProtectedShell>
  );
}
