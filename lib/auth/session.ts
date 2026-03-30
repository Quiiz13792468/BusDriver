import 'server-only';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'PARENT';
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  try {
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email ?? '',
      name: (user.user_metadata?.name as string) ?? user.email ?? '',
      // 신규 사용자 또는 role 메타데이터 미설정 시 PARENT로 기본 처리 (의도된 동작)
      role: (user.app_metadata?.role as 'ADMIN' | 'PARENT') ?? 'PARENT'
    };
  } catch {
    return null;
  }
}

export async function requireSession(role?: 'ADMIN' | 'PARENT'): Promise<SessionUser> {
  const user = await getCurrentSession();
  if (!user) redirect('/login');
  if (role && user.role !== role) redirect('/dashboard');
  return user;
}
