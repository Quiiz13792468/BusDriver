import { NextResponse } from 'next/server';

import { createUser, getUserByEmail, setParentAdminUser } from '@/lib/data/user';
import { validateInviteToken, markTokenUsed } from '@/lib/data/invite';
import { signupSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── 초대 링크 기반 학부모 가입 ──
    if (body?.inviteToken) {
      const { inviteToken, email, name, password, phone } = body;

      if (!email || !name || !password) {
        return NextResponse.json({ ok: false, error: '이름, 이메일, 비밀번호를 입력해주세요.' }, { status: 400 });
      }

      const tokenRecord = await validateInviteToken(inviteToken);
      if (!tokenRecord) {
        return NextResponse.json({ ok: false, error: '유효하지 않거나 만료된 초대 링크입니다.' }, { status: 400 });
      }

      const existing = await getUserByEmail(email.trim());
      if (existing) {
        return NextResponse.json({ ok: false, error: '이미 사용 중인 이메일입니다.' }, { status: 400 });
      }

      const user = await createUser({
        email: email.trim(),
        password,
        role: 'PARENT',
        name: name.trim(),
        phone: phone?.trim() ?? null,
        studentName: null,
        studentPhone: null,
      });

      await setParentAdminUser(user.id, tokenRecord.adminId);
      await markTokenUsed(inviteToken, user.id);

      return NextResponse.json({ ok: true });
    }

    // ── 기존 관리자 가입 (adminEmail 방식) ──
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.';
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const { email, name, password, role, adminEmail, studentName, studentPhone, parentPhone } = parsed.data;

    if (role === 'ADMIN' && process.env.ALLOW_ADMIN_SIGNUP !== 'true') {
      return NextResponse.json({ ok: false, error: '관리자 회원가입은 허용되지 않습니다.' }, { status: 403 });
    }

    // 학부모가 직접 가입 시도할 경우 초대 링크를 요청하도록 안내
    if (role === 'PARENT') {
      return NextResponse.json({ ok: false, error: '학부모 가입은 담당 기사님의 초대 링크로만 가능합니다.' }, { status: 400 });
    }

    const user = await createUser({
      email,
      password,
      role,
      name,
      phone: parentPhone ?? null,
      studentName: studentName ?? null,
      studentPhone: studentPhone ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : '회원가입 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
