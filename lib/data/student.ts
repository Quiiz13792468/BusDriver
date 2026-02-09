import crypto from 'node:crypto';

import type { StudentRecord } from '@/lib/data/types';
import { getPaymentsByStudent } from '@/lib/data/payment';
import { supaEnabled, restSelect, restInsert, restPatch } from '@/lib/supabase/rest';

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

export async function getStudentsBySchool(schoolId: string): Promise<StudentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('students', { school_id: schoolId });
  const list = rows.map(mapRowToStudent);
  return list.sort((a, b) => (a.isActive === b.isActive ? a.name.localeCompare(b.name, 'ko') : a.isActive ? -1 : 1));
}

export async function getStudentsByParent(parentUserId: string): Promise<StudentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('students', { parent_user_id: parentUserId });
  const list = rows.map(mapRowToStudent);
  return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export async function getAllStudents(): Promise<StudentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('students', {});
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
  await restInsert('students', [
    {
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
    }
  ]);
  return (await getStudentById(id))!;
}

export async function updateStudent(
  id: string,
  input: Partial<{
    schoolId: string | null;
    parentUserId: string | null;
    name: string;
    guardianName: string;
    phone: string | null;
    homeAddress: string | null;
    pickupPoint: string | null;
    routeId: string | null;
    emergencyContact: string | null;
    feeAmount: number;
    depositDay: number | null;
    notes: string | null;
    isActive: boolean;
    suspendedAt: Date | null;
  }>
) {
  ensureSupabase();
  const current = await getStudentById(id);
  if (!current) throw new Error('Student not found.');
  const now = new Date().toISOString();
  await restPatch('students', { id }, {
    school_id: input.schoolId !== undefined ? input.schoolId : current.schoolId,
    parent_user_id: input.parentUserId ?? current.parentUserId,
    name: input.name ?? current.name,
    guardian_name: input.guardianName ?? current.guardianName,
    phone: input.phone ?? current.phone,
    home_address: input.homeAddress ?? current.homeAddress,
    pickup_point: input.pickupPoint ?? current.pickupPoint,
    route_id: input.routeId ?? current.routeId,
    emergency_contact: input.emergencyContact ?? current.emergencyContact,
    fee_amount: input.feeAmount ?? current.feeAmount,
    deposit_day: (input as any).depositDay !== undefined ? (input as any).depositDay : current.depositDay,
    notes: input.notes ?? current.notes,
    is_active: (input as any).isActive !== undefined ? (input as any).isActive : current.isActive,
    suspended_at: input.suspendedAt
      ? input.suspendedAt instanceof Date
        ? input.suspendedAt.toISOString()
        : (input.suspendedAt as any)
      : input.suspendedAt === null
      ? null
      : current.suspendedAt,
    updated_at: now
  });
  return (await getStudentById(id))!;
}

export async function countStudents() {
  ensureSupabase();
  const rows = await restSelect<any>('students', {});
  return rows.length;
}
