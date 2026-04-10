import { NextResponse } from 'next/server';

import { createUser, getUserByEmail, setParentAdminUser } from '@/lib/data/user';
import { validateInviteToken, markTokenUsed } from '@/lib/data/invite';
import { createStudent } from '@/lib/data/student';
import { signupSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── 초대 링크 기반 가입 (학부모 / 버스기사) ──
    if (body?.inviteToken) {
      const { inviteToken, email, name, password, phone, students } = body;

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

      const role = tokenRecord.targetRole; // 'PARENT' | 'DRIVER'

      // 학부모인 경우 자녀 정보 필수
      if (role === 'PARENT') {
        const studentList: { name: string; phone?: string }[] = Array.isArray(students) ? students : [];
        if (studentList.length === 0 || studentList.some((s) => !s.name?.trim())) {
          return NextResponse.json({ ok: false, error: '자녀 이름을 1명 이상 입력해주세요.' }, { status: 400 });
        }
      }

      const user = await createUser({
        email: email.trim(),
        password,
        role,
        name: name.trim(),
        phone: phone?.trim() ?? null,
      });

      if (role === 'PARENT') {
        // 관리자-학부모 연동
        await setParentAdminUser(user.id, tokenRecord.adminId);

        // 자녀 일괄 등록
        const studentList: { name: string; phone?: string }[] = Array.isArray(students) ? students : [];
        for (const s of studentList) {
          if (!s.name?.trim()) continue;
          await createStudent({
            name: s.name.trim(),
            guardianName: name.trim(),
            parentUserId: user.id,
            phone: s.phone?.trim() || null,
          });
        }
      }

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

    if (role === 'PARENT') {
      return NextResponse.json({ ok: false, error: '학부모 가입은 담당 관리자의 초대 링크로만 가능합니다.' }, { status: 400 });
    }

    await createUser({
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
