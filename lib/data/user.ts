import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

import type { ParentProfileRecord, Role, UserRecord } from '@/lib/data/types';
import { supaEnabled, restSelect, restInsert, restPatch } from '@/lib/supabase/rest';

function ensureSupabase() {
  if (!supaEnabled()) {
    throw new Error('Supabase is not configured.');
  }
}

function mapSupabaseUser(row: any): UserRecord | null {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    phone: row.phone ?? null,
    passwordHash: row.password_hash ?? row.passwordHash ?? '',
    role: row.role,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

export async function getUserByEmail(email: string) {
  ensureSupabase();
  const rows = await restSelect<any>('users', { email: email.toLowerCase() }, { limit: 1 });
  return mapSupabaseUser(rows[0]) ?? null;
}

export async function getUserById(id: string) {
  ensureSupabase();
  const rows = await restSelect<any>('users', { id }, { limit: 1 });
  return mapSupabaseUser(rows[0]) ?? null;
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
}) {
  ensureSupabase();
  const existing = await getUserByEmail(input.email);
  if (existing) throw new Error('이미 존재하는 이메일입니다.');

  const hash = await bcrypt.hash(input.password, 10);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const user: UserRecord = {
    id,
    email: input.email.toLowerCase(),
    name: input.name ?? null,
    phone: input.phone ?? null,
    passwordHash: hash,
    role: input.role ?? 'PARENT',
    createdAt: now,
    updatedAt: now
  };

  await restInsert('users', [
    {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      password_hash: user.passwordHash,
      role: user.role,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    }
  ]);
  if (user.role === 'PARENT') {
    await restInsert('parent_profiles', [
      {
        user_id: user.id,
        address: input.address ?? null,
        admin_user_id: null,
        student_name: input.studentName ?? null,
        student_phone: input.studentPhone ?? null,
        created_at: now,
        updated_at: now
      }
    ]);
  }
  return user;
}

export async function updateParentProfileStudents(userId: string, _studentIds: string[]) {
  ensureSupabase();
  const prof = await getParentProfile(userId);
  if (!prof) return null;
  return prof;
}

export async function getParentProfile(userId: string) {
  ensureSupabase();
  const rows = await restSelect<any>('parent_profiles', { user_id: userId }, { limit: 1 });
  const r = rows[0];
  if (!r) return null;
  const now = r.updated_at ?? r.created_at;
  const prof: ParentProfileRecord = {
    userId: r.user_id,
    address: r.address ?? null,
    studentName: r.student_name ?? null,
    studentPhone: r.student_phone ?? null,
    studentIds: [],
    adminUserId: r.admin_user_id ?? null,
    createdAt: r.created_at ?? now,
    updatedAt: r.updated_at ?? now
  };
  return prof;
}

export async function verifyPassword(userId: string, password: string) {
  const user = await getUserById(userId);
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function setParentAdminUser(userId: string, adminUserId: string | null) {
  ensureSupabase();
  await restPatch('parent_profiles', { user_id: userId }, { admin_user_id: adminUserId, updated_at: new Date().toISOString() });
  return getParentProfile(userId);
}
