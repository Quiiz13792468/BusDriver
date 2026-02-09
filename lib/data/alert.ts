import crypto from 'node:crypto';

import type { AlertRecord, AlertType } from '@/lib/data/types';
import { supaEnabled, restSelect, restInsert, restDelete } from '@/lib/supabase/rest';

function ensureSupabase() {
  if (!supaEnabled()) {
    throw new Error('Supabase is not configured.');
  }
}

export async function createAlert(input: {
  studentId: string;
  schoolId: string;
  year: number;
  month: number;
  createdBy: string;
  type: AlertType;
  memo?: string | null;
}) {
  ensureSupabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await restInsert('alerts', [{ id, student_id: input.studentId, school_id: input.schoolId, year: input.year, month: input.month, type: input.type, status: 'PENDING', created_by: input.createdBy, memo: input.memo ?? null, created_at: now }]);
  const rows = await restSelect<any>('alerts', { id }, { limit: 1 });
  const r = rows[0];
  return { id: r.id, studentId: r.student_id, schoolId: r.school_id, year: r.year, month: r.month, type: r.type, status: r.status, createdBy: r.created_by, memo: r.memo ?? null, createdAt: r.created_at } as AlertRecord;
}

export async function createRouteChangeAlert(params: {
  studentId: string;
  schoolId: string;
  createdBy: string;
  before: string | null;
  after: string | null;
}) {
  const now = new Date();
  const message = `변경전: ${params.before ?? '-'}, 변경후: ${params.after ?? '-'}`;
  return createAlert({
    studentId: params.studentId,
    schoolId: params.schoolId,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    type: 'ROUTE_CHANGE',
    createdBy: params.createdBy,
    memo: message
  });
}

export async function getAlerts(): Promise<AlertRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('alerts', {}, { order: 'created_at.desc' });
  return rows.map((r) => ({ id: r.id, studentId: r.student_id, schoolId: r.school_id, year: r.year, month: r.month, type: r.type, status: r.status, createdBy: r.created_by, memo: r.memo ?? null, createdAt: r.created_at } as AlertRecord));
}

export async function countAlerts() {
  ensureSupabase();
  const rows = await restSelect<any>('alerts', {});
  return rows.length;
}

export async function resolveAlert(id: string) {
  ensureSupabase();
  await restDelete('alerts', { id });
}
