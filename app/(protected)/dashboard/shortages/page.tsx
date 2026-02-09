import Link from 'next/link';

import { requireSession } from '@/lib/auth/session';
import { getAllPayments } from '@/lib/data/payment';
import { getAllStudents } from '@/lib/data/student';
import { getSchools } from '@/lib/data/school';
import { getUserById } from '@/lib/data/user';
import { MonthControls } from '@/app/(protected)/dashboard/_components/month-controls';
import { ShortageRequestForm } from '@/app/(protected)/dashboard/_components/shortage-request-form';

type Props = { searchParams?: Record<string, string | string[] | undefined> };

function arrayFirst(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ShortagePage({ searchParams }: Props) {
  await requireSession('ADMIN');

  const [payments, students, schools] = await Promise.all([
    getAllPayments(),
    getAllStudents(),
    getSchools()
  ]);

  const today = new Date();
  const yParam = arrayFirst(searchParams?.year);
  const mParam = arrayFirst(searchParams?.month);
  const year = yParam ? Number(yParam) : today.getFullYear();
  const month = mParam ? Number(mParam) : today.getMonth() + 1;

  const fixedMinYear = 2024;
  const fixedMaxYear = today.getFullYear() + 1;

  const schoolMap = new Map(schools.map((s) => [s.id, s.name]));
  const monthPayments = payments.filter((p) => p.targetYear === year && p.targetMonth === month);
  const byStudent = new Map<string, { paid: number; partial: number }>();
  for (const p of monthPayments) {
    const entry = byStudent.get(p.studentId) ?? { paid: 0, partial: 0 };
    if (p.status === 'PAID') entry.paid += p.amount;
    if (p.status === 'PARTIAL') entry.partial += p.amount;
    byStudent.set(p.studentId, entry);
  }

  const parentIds = Array.from(new Set(students.map((s) => s.parentUserId).filter(Boolean))) as string[];
  const parentUsers = await Promise.all(parentIds.map((id) => getUserById(id)));
  const parentMap = new Map<string, { name: string | null; phone: string | null }>();
  parentUsers.forEach((u) => {
    if (u) parentMap.set(u.id, { name: u.name ?? null, phone: u.phone ?? null });
  });

  const rows = students
    .map((st) => {
      const agg = byStudent.get(st.id) ?? { paid: 0, partial: 0 };
      const paidAmount = agg.paid + agg.partial;
      const shortageAmount = Math.max(0, (st.feeAmount ?? 0) - paidAmount);
      if (shortageAmount <= 0) return null;
      const parent = st.parentUserId ? parentMap.get(st.parentUserId) : null;
      return {
        studentId: st.id,
        studentName: st.name,
        schoolName: st.schoolId ? schoolMap.get(st.schoolId) ?? '학교 정보 없음' : '미배정',
        parentName: parent?.name ?? st.guardianName ?? '-',
        parentPhone: parent?.phone ?? st.phone ?? '-',
        feeAmount: st.feeAmount ?? 0,
        paidAmount,
        shortageAmount
      };
    })
    .filter(Boolean) as Array<{
    studentId: string;
    studentName: string;
    schoolName: string;
    parentName: string;
    parentPhone: string;
    feeAmount: number;
    paidAmount: number;
    shortageAmount: number;
  }>;

  return (
    <div className="space-y-6">
      <header className="ui-card ui-card-pad">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">부족 인원 관리</h1>
            <p className="text-base text-slate-700">{year}년 {month}월 부족 인원을 확인하고 입금 확인 요청을 보낼 수 있습니다.</p>
          </div>
          <Link href="/dashboard" className="ui-btn-outline px-3 py-1.5 text-sm hover:border-amber-300 hover:bg-amber-50/60">
            대시보드로
          </Link>
        </div>
      </header>

      <section className="ui-card ui-card-pad space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">조회 조건</h2>
          <MonthControls
            year={year}
            month={month}
            minYear={fixedMinYear}
            minMonth={1}
            maxYear={fixedMaxYear}
            maxMonth={12}
            typeParam="ALL"
            basePath="/dashboard/shortages"
          />
        </div>
      </section>

      <section className="ui-card ui-card-pad space-y-2">
        <ShortageRequestForm rows={rows} year={year} month={month} />
      </section>
    </div>
  );
}
