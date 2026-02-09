import type { PaymentRecord, PaymentStatus } from '@/lib/data/types';
import { getStudentsBySchool } from '@/lib/data/student';
import { supaEnabled, restSelect, restInsert, restDelete } from '@/lib/supabase/rest';

function ensureSupabase() {
  if (!supaEnabled()) {
    throw new Error('Supabase is not configured.');
  }
}

function makePaymentId(studentId: string, year: number, month: number) {
  return `${studentId}:${year}:${month}`;
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
  let id = makePaymentId(input.studentId, input.targetYear, input.targetMonth);
  if (input.status === 'PARTIAL') id = id + ':' + Math.random().toString(36).slice(2, 8);
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
    { upsert: true, onConflict: 'id' }
  );
  const list = await getPaymentsByStudent(input.studentId);
  return list.find((p) => p.id === id)!;
}

export async function getPaymentsByStudent(studentId: string): Promise<PaymentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('payments', { student_id: studentId });
  const payments: PaymentRecord[] = rows.map((r) => ({
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
  }));
  return payments.sort((a, b) => (a.targetYear === b.targetYear ? b.targetMonth - a.targetMonth : b.targetYear - a.targetYear));
}

export async function getPaymentsBySchool(schoolId: string): Promise<PaymentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('payments', { school_id: schoolId });
  const payments: PaymentRecord[] = rows.map((r) => ({
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
  }));
  return payments.sort((a, b) => (a.targetYear === b.targetYear ? b.targetMonth - a.targetMonth : b.targetYear - a.targetYear));
}

export async function getPaymentsBySchoolAndMonth(params: { schoolId: string; year: number; month: number }) {
  const payments = await getPaymentsBySchool(params.schoolId);
  return payments.filter((p) => p.targetYear === params.year && p.targetMonth === params.month).sort((a, b) => a.studentId.localeCompare(b.studentId));
}

export async function getMonthlyPaymentSummary(params: { schoolId: string; year: number }) {
  const [payments, students] = await Promise.all([getPaymentsBySchool(params.schoolId), getStudentsBySchool(params.schoolId)]);
  const now = new Date();
  const activeIds = new Set(students.filter((s) => !s.suspendedAt || new Date(s.suspendedAt) > now).map((s) => s.id));
  const summary: Record<number, { paid: number; partial: number; missing: number }> = {};
  for (let m = 1; m <= 12; m += 1) summary[m] = { paid: 0, partial: 0, missing: 0 };
  for (const p of payments) {
    if (p.targetYear !== params.year) continue;
    if (!activeIds.has(p.studentId)) continue;
    const b = summary[p.targetMonth];
    if (p.status === 'PAID') b.paid += p.amount;
    else if (p.status === 'PARTIAL') b.partial += p.amount;
  }
  const monthlyExpected = students.filter((s) => !s.suspendedAt || new Date(s.suspendedAt) > now).reduce((acc, s) => acc + s.feeAmount, 0);
  for (let m = 1; m <= 12; m += 1) {
    const b = summary[m];
    b.missing = Math.max(0, monthlyExpected - (b.paid + b.partial));
  }
  return summary;
}

export async function getAllPayments(): Promise<PaymentRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('payments', {});
  const payments: PaymentRecord[] = rows.map((r) => ({
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
  }));
  return payments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function countPaymentsByStatus(statuses: PaymentStatus[]) {
  const payments = await getAllPayments();
  return payments.filter((p) => statuses.includes(p.status)).length;
}

export async function deletePaymentsBySchool(schoolId: string) {
  ensureSupabase();
  await restDelete('payments', { school_id: schoolId });
}
