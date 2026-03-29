import 'server-only';
import crypto from 'node:crypto';

import type { PaymentRecord, PaymentStatus, PaymentSummary } from '@/lib/data/types';
import { getStudentsBySchool } from '@/lib/data/student';
import { supaEnabled, restSelect, restSelectIn, restInsert, restDelete, restCount } from '@/lib/supabase/rest';

export { getEffectiveFee, getCumulativePayments, getShortage, buildPaymentSummary } from '@/lib/data/payment-utils';
import { getEffectiveFee } from '@/lib/data/payment-utils';

function ensureSupabase() {
  if (!supaEnabled()) {
    throw new Error('Supabase is not configured.');
  }
}

function mapRowToPayment(r: any): PaymentRecord {
  return {
    id: r.id,
    studentId: r.student_id,
    schoolId: r.school_id,
    amount: r.amount,
    targetYear: r.target_year,
    targetMonth: r.target_month,
    status: r.status,
    paidAt: r.paid_at ?? null,
    memo: r.memo ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export async function recordPayment(input: {
  studentId: string;
  schoolId: string;
  amount: number;
  targetYear: number;
  targetMonth: number;
  status?: PaymentStatus;
  paidAt?: Date | string | null;
  memo?: string | null;
}) {
  ensureSupabase();
  // Always use unique IDs — no deterministic IDs that could collide on upsert
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const paidAt =
    typeof input.paidAt === 'string'
      ? input.paidAt
      : input.paidAt instanceof Date
      ? input.paidAt.toISOString()
      : input.status === 'PAID'
      ? now
      : null;

  await restInsert(
    'payments',
    [
      {
        id,
        student_id: input.studentId,
        school_id: input.schoolId,
        amount: input.amount,
        target_year: input.targetYear,
        target_month: input.targetMonth,
        status: input.status ?? 'PAID',
        paid_at: paidAt,
        memo: input.memo ?? null,
        created_at: now,
        updated_at: now
      }
    ],
  );
  const list = await getPaymentsByStudent(input.studentId);
  const result = list.find((p) => p.id === id);
  if (!result) throw new Error(`Payment ${id} not found after insert`);
  return result;
}

export async function getPaymentsByStudent(studentId: string): Promise<PaymentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('payments', { student_id: studentId }, { next: { tags: ['payments'] } });
  return rows.map(mapRowToPayment).sort((a, b) => (a.targetYear === b.targetYear ? b.targetMonth - a.targetMonth : b.targetYear - a.targetYear));
}

export async function getPaymentsByStudentIds(studentIds: string[]): Promise<PaymentRecord[]> {
  ensureSupabase();
  if (studentIds.length === 0) return [];
  const rows = await restSelectIn<any>('payments', 'student_id', studentIds, { next: { tags: ['payments'] } });
  return rows.map(mapRowToPayment).sort((a, b) => (a.targetYear === b.targetYear ? b.targetMonth - a.targetMonth : b.targetYear - a.targetYear));
}

export async function getPaymentsBySchool(schoolId: string): Promise<PaymentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('payments', { school_id: schoolId }, { next: { tags: ['payments'] } });
  return rows.map(mapRowToPayment).sort((a, b) => (a.targetYear === b.targetYear ? b.targetMonth - a.targetMonth : b.targetYear - a.targetYear));
}

export async function getPaymentsBySchoolAndMonth(params: { schoolId: string; year: number; month: number }) {
  const payments = await getPaymentsBySchool(params.schoolId);
  return payments.filter((p) => p.targetYear === params.year && p.targetMonth === params.month).sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export async function getMonthlyPaymentSummary(params: { schoolId: string; year: number }) {
  const [payments, students, schoolRows] = await Promise.all([
    getPaymentsBySchool(params.schoolId),
    getStudentsBySchool(params.schoolId),
    restSelect<any>('schools', { id: params.schoolId }, { limit: 1 })
  ]);
  const schoolRow = schoolRows[0] ?? null;
  const school = schoolRow ? { defaultMonthlyFee: schoolRow.default_monthly_fee ?? 0 } : null;

  const summary: Record<number, { paid: number; partial: number; missing: number }> = {};
  for (let m = 1; m <= 12; m += 1) summary[m] = { paid: 0, partial: 0, missing: 0 };

  // Count payments per month (only for year-matching records)
  for (const p of payments) {
    if (p.targetYear !== params.year) continue;
    const b = summary[p.targetMonth];
    if (p.status === 'PAID') b.paid += p.amount;
    else if (p.status === 'PARTIAL') b.partial += p.amount;
  }

  // Per-month expected: a student is active in month M if not suspended before end of that month
  for (let m = 1; m <= 12; m += 1) {
    const endOfMonth = new Date(params.year, m, 0); // last day of month m
    const monthlyExpected = students
      .filter((s) => !s.suspendedAt || new Date(s.suspendedAt) > endOfMonth)
      .reduce((acc, s) => acc + getEffectiveFee(s, school), 0);
    const b = summary[m];
    b.missing = Math.max(0, monthlyExpected - (b.paid + b.partial));
  }

  return summary;
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('payments', {}, { next: { tags: ['payments'] } });
  return rows.map(mapRowToPayment).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getPaymentsByYear(year: number): Promise<PaymentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('payments', { target_year: year }, { next: { tags: ['payments'] } });
  return rows.map(mapRowToPayment);
}

export async function countPaymentsByStatus(statuses: PaymentStatus[]) {
  ensureSupabase();
  const counts = await Promise.all(
    statuses.map((status) => restCount('payments', { status }))
  );
  return counts.reduce((sum, c) => sum + c, 0);
}

export async function deletePaymentsBySchool(schoolId: string) {
  ensureSupabase();
  await restDelete('payments', { school_id: schoolId });
}
