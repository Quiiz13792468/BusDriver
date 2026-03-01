import { NextResponse } from 'next/server';

// Uptime Robot이 주기적으로 호출해 Supabase 프리 플랜 자동 정지를 방지합니다.
export async function GET() {
  return NextResponse.json({ status: 'ok', ts: new Date().toISOString() });
}
