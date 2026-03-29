import type { PaymentRecord, PaymentSummary } from '@/lib/data/types';

/**
 * Fee hierarchy: school.defaultMonthlyFee > 0 takes precedence over student.feeAmount
 * Per AGENTS.md: 학교별 고정금액(관리자가 등록했다면 우선순위에 우위를 가짐) > 학생별 고정값
 */
export function getEffectiveFee(
  student: { feeAmount: number },
  school: { defaultMonthlyFee: number } | null
): number {
  if (school && school.defaultMonthlyFee > 0) {
    return school.defaultMonthlyFee;
  }
  return student.feeAmount ?? 0;
}

/**
 * Get cumulative paid amount for a student in a specific month
 */
export function getCumulativePayments(
  payments: PaymentRecord[],
  studentId: string,
  year: number,
  month: number
): number {
  return payments
    .filter(p => p.studentId === studentId && p.targetYear === year && p.targetMonth === month)
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Calculate shortage amount
 */
export function getShortage(effectiveFee: number, cumulativePaid: number): number {
  return Math.max(0, effectiveFee - cumulativePaid);
}

/**
 * Build PaymentSummary for a student+month
 */
export function buildPaymentSummary(
  student: { id: string; feeAmount: number },
  school: { defaultMonthlyFee: number } | null,
  payments: PaymentRecord[],
  year: number,
  month: number
): PaymentSummary {
  const effectiveFee = getEffectiveFee(student, school);
  const monthPayments = payments.filter(
    p => p.studentId === student.id && p.targetYear === year && p.targetMonth === month
  );
  const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const shortage = getShortage(effectiveFee, totalPaid);
  const status: PaymentSummary['status'] =
    totalPaid >= effectiveFee && effectiveFee > 0 ? 'PAID'
    : totalPaid > 0 ? 'PARTIAL'
    : 'UNPAID';

  return {
    studentId: student.id,
    year,
    month,
    effectiveFee,
    totalPaid,
    shortage,
    status,
    payments: monthPayments
  };
}
