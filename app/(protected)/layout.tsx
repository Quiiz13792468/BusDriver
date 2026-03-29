export const dynamic = 'force-dynamic';

import type { ReactNode } from 'react';

import { requireSession } from '@/lib/auth/session';
import { countAlerts } from '@/lib/data/alert';
import { countUnreadBoardNotifications } from '@/lib/data/board-notifications';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { RealtimeProvider } from '@/components/realtime-provider';
import { InactivityTracker } from '@/components/inactivity-tracker';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const session = await requireSession();
  const user = { name: session.name, email: session.email };
  const role = session.role ?? 'PARENT';
  const userId = session.id;

  // 역할별 알림 수 조회 (병렬)
  const [adminAlerts, parentAlerts] = await Promise.all([
    role === 'ADMIN' ? countAlerts().catch(() => 0) : Promise.resolve(0),
    role === 'PARENT' && userId ? countUnreadBoardNotifications(userId).catch(() => 0) : Promise.resolve(0),
  ]);
  const alertCount = role === 'ADMIN' ? adminAlerts : parentAlerts;

  return (
    <RealtimeProvider>
      <InactivityTracker />
      <ProtectedShell user={user} role={role} alertCount={alertCount}>
        {children}
      </ProtectedShell>
    </RealtimeProvider>
  );
}
