import 'server-only';

import crypto from 'node:crypto';

import type { StudentRecord } from '@/lib/data/types';
import { getPaymentsByStudent } from '@/lib/data/payment';
import { supaEnabled, restSelect, restSelectIn, restInsert, restPatch, restCount } from '@/lib/supabase/rest';

function ensureSupabase() {
  if (!supaEnabled()) {
    throw new Error('Supabase is not configured.');
  }
}

function mapRowToStudent(r: any): StudentRecord {
  return {
    id: r.id,
    schoolId: r.school_id ?? null,
    parentUserId: r.parent_user_id ?? null,
    name: r.name,
    guardianName: r.guardian_name,
    phone: r.phone ?? null,
    homeAddress: r.home_address ?? null,
    pickupPoint: r.pickup_point ?? null,
    routeId: r.route_id ?? null,
    emergencyContact: r.emergency_contact ?? null,
    feeAmount: r.fee_amount ?? 0,
    depositDay: r.deposit_day ?? null,
    isActive: Boolean(r.is_active ?? true),
    suspendedAt: r.suspended_at ?? null,
    notes: r.notes ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function getStudentById(id: string) {
  ensureSupabase();
  const rows = await restSelect<any>('students', { id }, { limit: 1 });
  return rows[0] ? mapRowToStudent(rows[0]) : null;
}

export async function getStudentsByIds(ids: string[]): Promise<StudentRecord[]> {
  ensureSupabase();
  if (ids.length === 0) return [];
  const rows = await restSelectIn<any>('students', 'id', ids);
  return rows.map(mapRowToStudent);
}

export async function getStudentsBySchool(schoolId: string): Promise<StudentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('students', { school_id: schoolId }, { next: { tags: ['students'] } });
  const list = rows.map(mapRowToStudent);
  return list.sort((a, b) => (a.isActive === b.isActive ? a.name.localeCompare(b.name, 'ko') : a.isActive ? -1 : 1));
}

export async function getStudentsByParent(parentUserId: string): Promise<StudentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('students', { parent_user_id: parentUserId }, { next: { tags: ['students'] } });
  const list = rows.map(mapRowToStudent);
  return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export async function getAllStudents(): Promise<StudentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('students', {}, { next: { tags: ['students'] } });
  return rows.map(mapRowToStudent).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export async function getUnassignedStudents(): Promise<StudentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('students', { school_id: null });
  return rows.map(mapRowToStudent).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export async function getStudentDetail(id: string) {
  const student = await getStudentById(id);
  if (!student) return null;
  const payments = await getPaymentsByStudent(id);
  return { ...student, payments };
}

export async function createStudent(input: {
  schoolId?: string | null;
  name: string;
  guardianName: string;
  parentUserId?: string | null;
  phone?: string | null;
  homeAddress?: string | null;
  pickupPoint?: string | null;
  routeId?: string | null;
  emergencyContact?: string | null;
  feeAmount?: number;
  depositDay?: number | null;
  notes?: string | null;
}) {
  ensureSupabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const row = {
    id,
    school_id: input.schoolId ?? null,
    parent_user_id: input.parentUserId ?? null,
    name: input.name,
    guardian_name: input.guardianName,
    phone: input.phone ?? null,
    home_address: input.homeAddress ?? null,
    pickup_point: input.pickupPoint ?? null,
    route_id: input.routeId ?? null,
    emergency_contact: input.emergencyContact ?? null,
    fee_amount: input.feeAmount ?? 0,
    deposit_day: input.depositDay ?? null,
    is_active: true,
    suspended_at: null,
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now
  };
  await restInsert('students', [row]);
  return mapRowToStudent(row);
}

export async function updateStudent(
  id: string,
  input: {
    schoolId?: string | null;
    parentUserId?: string | null;
    name?: string;
    guardianName?: string;
    phone?: string | null;
    homeAddress?: string | null;
    pickupPoint?: string | null;
    routeId?: string | null;
    emergencyContact?: string | null;
    feeAmount?: number;
    depositDay?: number | null;
    notes?: string | null;
    isActive?: boolean;
    suspendedAt?: Date | null;
  }
): Promise<StudentRecord> {
  ensureSupabase();
  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.schoolId !== undefined)        patch.school_id = input.schoolId;
  if (input.parentUserId !== undefined)    patch.parent_user_id = input.parentUserId;
  if (input.name !== undefined)            patch.name = input.name;
  if (input.guardianName !== undefined)    patch.guardian_name = input.guardianName;
  if (input.phone !== undefined)           patch.phone = input.phone;
  if (input.homeAddress !== undefined)     patch.home_address = input.homeAddress;
  if (input.pickupPoint !== undefined)     patch.pickup_point = input.pickupPoint;
  if (input.routeId !== undefined)         patch.route_id = input.routeId;
  if (input.emergencyContact !== undefined) patch.emergency_contact = input.emergencyContact;
  if (input.feeAmount !== undefined)       patch.fee_amount = input.feeAmount;
  if (input.depositDay !== undefined)      patch.deposit_day = input.depositDay;
  if (input.notes !== undefined)           patch.notes = input.notes;
  if (input.isActive !== undefined)        patch.is_active = input.isActive;
  if (input.suspendedAt !== undefined) {
    patch.suspended_at = input.suspendedAt
      ? input.suspendedAt instanceof Date
        ? input.suspendedAt.toISOString()
        : (input.suspendedAt as any)
      : null;
  }
  const rows = await restPatch('students', { id }, patch);
  if (!rows[0]) throw new Error('Student not found.');
  return mapRowToStudent(rows[0]);
}

export async function countStudents() {
  ensureSupabase();
  return restCount('students', {});
}
