import crypto from 'node:crypto';

import type { SchoolRecord } from '@/lib/data/types';
import { supaEnabled, restSelect, restInsert, restPatch, restDelete } from '@/lib/supabase/rest';
import { getStudentsBySchool } from '@/lib/data/student';
import { getPaymentsBySchool } from '@/lib/data/payment';

function ensureSupabase() {
  if (!supaEnabled()) {
    throw new Error('Supabase is not configured.');
  }
}

export async function getSchools(): Promise<SchoolRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('schools', {}, { order: 'name.asc' });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address ?? null,
    defaultMonthlyFee: r.default_monthly_fee ?? 0,
    note: r.note ?? null,
    adminUserId: r.admin_user_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }));
}

export async function getSchoolById(id: string) {
  ensureSupabase();
  const rows = await restSelect<any>('schools', { id }, { limit: 1 });
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    address: r.address ?? null,
    defaultMonthlyFee: r.default_monthly_fee ?? 0,
    note: r.note ?? null,
    adminUserId: r.admin_user_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  } as SchoolRecord;
}

export async function getSchoolWithStudents(id: string) {
  const school = await getSchoolById(id);
  if (!school) return null;
  const [students, payments] = await Promise.all([getStudentsBySchool(id), getPaymentsBySchool(id)]);
  return { ...school, students, payments };
}

export async function createSchool(input: {
  name: string;
  address?: string | null;
  defaultMonthlyFee?: number;
  note?: string | null;
  adminUserId?: string | null;
}) {
  ensureSupabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await restInsert('schools', [
    {
      id,
      name: input.name,
      address: input.address ?? null,
      default_monthly_fee: input.defaultMonthlyFee ?? 0,
      note: input.note ?? null,
      admin_user_id: input.adminUserId ?? null,
      created_at: now,
      updated_at: now
    }
  ]);
  return (await getSchoolById(id))!;
}

export async function updateSchool(
  id: string,
  data: Partial<{ name: string; address: string | null; defaultMonthlyFee: number; note: string | null; adminUserId: string | null }>
) {
  ensureSupabase();
  const current = await getSchoolById(id);
  if (!current) throw new Error('학교 정보를 찾을 수 없습니다.');
  const now = new Date().toISOString();
  await restPatch('schools', { id }, {
    name: data.name ?? current.name,
    address: data.address ?? current.address,
    default_monthly_fee: data.defaultMonthlyFee ?? current.defaultMonthlyFee,
    note: data.note ?? current.note,
    admin_user_id: data.adminUserId ?? current.adminUserId,
    updated_at: now
  });
  return (await getSchoolById(id))!;
}

export async function deleteSchool(id: string) {
  ensureSupabase();
  const current = await getSchoolById(id);
  if (!current) return;
  await restDelete('schools', { id });
}
