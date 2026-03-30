"use server";

import { requireSession } from '@/lib/auth/session';
import { getSchools } from '@/lib/data/school';
import { getAllStudents } from '@/lib/data/student';

export async function getPaymentFormDataAction() {
  await requireSession('ADMIN');
  const [schools, students] = await Promise.all([getSchools(), getAllStudents()]);
  return {
    schools: schools.map((s) => ({ id: s.id, name: s.name, defaultMonthlyFee: s.defaultMonthlyFee })),
    students: students
      .filter((s) => s.isActive)
      .map((s) => ({ id: s.id, name: s.name, feeAmount: s.feeAmount, schoolId: s.schoolId })),
  };
}
