import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const LAST_ACTIVE_COOKIE = 'bus-last-active';

export async function POST() {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(LAST_ACTIVE_COOKIE);
  return res;
}
