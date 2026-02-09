import { NextResponse } from 'next/server';

import { createUser, getUserByEmail, setParentAdminUser } from '@/lib/data/user';
import { signupSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.';
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const { email, name, password, role, adminEmail, studentName, studentPhone, parentPhone } = parsed.data;

    if (role === 'ADMIN' && process.env.ALLOW_ADMIN_SIGNUP !== 'true') {
      return NextResponse.json({ ok: false, error: '관리자 회원가입은 허용되지 않습니다.' }, { status: 403 });
    }

    let adminUserId: string | null = null;
    if (role === 'PARENT') {
      const admin = await getUserByEmail(adminEmail!);
      if (!admin || admin.role !== 'ADMIN') {
        return NextResponse.json({ ok: false, error: '담당 기사님(관리자) 이메일이 올바르지 않습니다.' }, { status: 400 });
      }
      adminUserId = admin.id;
    }

    const user = await createUser({
      email,
      password,
      role,
      name,
      phone: parentPhone ?? null,
      studentName: studentName ?? null,
      studentPhone: studentPhone ?? null
    });

    if (role === 'PARENT' && adminUserId) {
      await setParentAdminUser(user.id, adminUserId);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : '회원가입 처리 중 오류가 발생했습니다.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
