import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/options';

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireSession(role?: 'ADMIN' | 'PARENT') {
  const session = await getCurrentSession();

  if (!session?.user) {
    throw new Error('로그인이 필요합니다.');
  }

  if (role && session.user.role !== role) {
    throw new Error('접근 권한이 없습니다.');
  }

  return session;
}
