import 'server-only';

import type { ParentProfileRecord, Role, UserRecord } from '@/lib/data/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { restInsert, restPatch, restSelect } from '@/lib/supabase/rest';

function mapAuthUser(user: any): UserRecord {
  return {
    id: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.name as string) ?? null,
    phone: (user.user_metadata?.phone as string) ?? null,
    passwordHash: '', // Supabase Auth 관리 — 앱에서 직접 사용 안 함
    role: (user.app_metadata?.role as Role) ?? 'PARENT',
    createdAt: user.created_at,
    updatedAt: user.updated_at ?? user.created_at,
  };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const supabase = createAdminClient();
  // Supabase Admin API: 이메일로 사용자 조회
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error || !data) return null;
  const found = data.users.find(
    (u) => (u.email ?? '').toLowerCase() === email.trim().toLowerCase()
  );
  return found ? mapAuthUser(found) : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(id);
  if (error || !data.user) return null;
  return mapAuthUser(data.user);
}

export async function createUser(input: {
  email: string;
  password: string;
  role?: Role;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  studentName?: string | null;
  studentPhone?: string | null;
}): Promise<UserRecord> {
  const supabase = createAdminClient();
  const role: Role = input.role ?? 'PARENT';

  // Supabase Auth에 계정 생성
  // - app_metadata.role: 서버 전용, 사용자 수정 불가 (보안용 RBAC)
  // - user_metadata: profiles 트리거(handle_new_user)에서 읽어 profiles 테이블 자동 생성
  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { name: input.name ?? '', role },
  });

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('already')) {
      throw new Error('이미 존재하는 이메일입니다.');
    }
    throw new Error(error?.message ?? '회원가입 처리 중 오류가 발생했습니다.');
  }

  const user = data.user;
  const now = new Date().toISOString();

  // PARENT인 경우 parent_profiles 레코드 생성
  if (role === 'PARENT') {
    await restInsert('parent_profiles', [
      {
        user_id: user.id,
        address: input.address ?? null,
        admin_user_id: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  }

  return mapAuthUser(user);
}

export async function getParentProfile(userId: string): Promise<ParentProfileRecord | null> {
  const rows = await restSelect<any>('parent_profiles', { user_id: userId }, { limit: 1 });
  const r = rows[0];
  if (!r) return null;
  return {
    userId: r.user_id,
    address: r.address ?? null,
    studentName: null,
    studentPhone: null,
    studentIds: [],
    adminUserId: r.admin_user_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? r.created_at,
  };
}

export async function setParentAdminUser(userId: string, adminUserId: string | null) {
  await restPatch(
    'parent_profiles',
    { user_id: userId },
    { admin_user_id: adminUserId, updated_at: new Date().toISOString() }
  );
  return getParentProfile(userId);
}

export async function updateParentProfileStudents(userId: string, _studentIds: string[]) {
  return getParentProfile(userId);
}

// verifyPassword는 Supabase Auth가 처리하므로 더 이상 필요 없음
// LoginClient에서 supabase.auth.signInWithPassword 사용
