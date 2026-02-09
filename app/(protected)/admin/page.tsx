import { redirect } from 'next/navigation';

import { requireSession } from '@/lib/auth/session';

export default async function AdminRedirectPage() {
  await requireSession('ADMIN');
  redirect('/dashboard');
}
