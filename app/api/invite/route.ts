import { NextResponse } from 'next/server';

import { requireSession } from '@/lib/auth/session';
import { createInviteToken, validateInviteToken } from '@/lib/data/invite';

// POST /api/invite — 관리자가 초대 토큰 생성
export async function POST(req: Request) {
  try {
    const session = await requireSession('ADMIN');
    const body = await req.json().catch(() => ({}));
    const expiresInHours: number = body.expiresInHours ?? 24;
    const targetRole: 'PARENT' | 'DRIVER' = body.targetRole === 'DRIVER' ? 'DRIVER' : 'PARENT';

    const record = await createInviteToken(session.id, expiresInHours, targetRole);
    return NextResponse.json({ ok: true, token: record.token, expiresAt: record.expiresAt, targetRole: record.targetRole });
  } catch (err: any) {
    const status = err?.message === 'Unauthorized' ? 403 : 500;
    return NextResponse.json({ ok: false, error: err?.message ?? '오류가 발생했습니다.' }, { status });
  }
}

// GET /api/invite?token=xxx — 토큰 유효성 확인 (가입 페이지에서 호출)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ ok: false, error: '토큰이 없습니다.' }, { status: 400 });
    }

    const record = await validateInviteToken(token);
    if (!record) {
      return NextResponse.json({ ok: false, error: '유효하지 않거나 만료된 초대 링크입니다.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, adminId: record.adminId, expiresAt: record.expiresAt, targetRole: record.targetRole });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? '오류가 발생했습니다.' }, { status: 500 });
  }
}
