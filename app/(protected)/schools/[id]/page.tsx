import { notFound } from 'next/navigation';

import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { AssignStudentForm } from '@/app/(protected)/schools/_components/assign-student-form';
import { StudentCard } from '@/app/(protected)/schools/_components/student-card';
import { requireSession } from '@/lib/auth/session';
import { getRoutesBySchool } from '@/lib/data/route';
import { getSchoolWithStudents } from '@/lib/data/school';
import { getUnassignedStudents } from '@/lib/data/student';
import type { PaymentStatus } from '@/lib/data/types';
import { ShortageReportButton } from '@/components/shortage-report-button';
import { PageHeader } from '@/components/layout/page-header';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';

type SchoolDetailPageProps = {
  params: {
    id: string;
  };
};

type StudentMonthlySummary = {
  expected: number;
  paid: number;
  status: PaymentStatus;
};

type MonthlyAggregate = {
  paid: number;
  partial: number;
  pending: number;
  shortage: number;
};

export default async function SchoolDetailPage({ params }: SchoolDetailPageProps) {
  await requireSession('ADMIN');
  const school = await getSchoolWithStudents(params.id);

  if (!school) {
    notFound();
  }

  const students = school.students;
  const [routes, unassignedStudents] = await Promise.all([
    getRoutesBySchool(params.id),
    getUnassignedStudents()
  ]);
  const payments = school.payments;

  const studentsById = new Map(students.map((student) => [student.id, student]));
  const monthlyByStudent = new Map<string, Map<string, StudentMonthlySummary>>();

  payments.forEach((payment) => {
    const student = studentsById.get(payment.studentId);
    if (!student) return;

    const key = `${payment.targetYear}-${payment.targetMonth}`;
    let monthMap = monthlyByStudent.get(key);
    if (!monthMap) {
      monthMap = new Map();
      monthlyByStudent.set(key, monthMap);
    }

    const existing = monthMap.get(payment.studentId);
    if (existing) {
      existing.paid += payment.amount;
      existing.status = payment.status;
    } else {
      monthMap.set(payment.studentId, {
        expected: student.feeAmount,
        paid: payment.amount,
        status: payment.status
      });
    }
  });

  const monthlySummary = new Map<string, MonthlyAggregate>();

  monthlyByStudent.forEach((studentMap, key) => {
    const aggregate: MonthlyAggregate = {
      paid: 0,
      partial: 0,
      pending: 0,
      shortage: 0
    };

    studentMap.forEach((entry) => {
      const shortage = Math.max(entry.expected - entry.paid, 0);
      aggregate.shortage += shortage;

      if (entry.status === 'PAID' && shortage === 0) {
        aggregate.paid += entry.paid;
      } else if (entry.status === 'PARTIAL') {
        aggregate.partial += entry.paid;
      } else {
        aggregate.pending += shortage;
      }
    });

    monthlySummary.set(key, aggregate);
  });

  const monthlyEntries = Array.from(monthlySummary.entries()).sort((a, b) => {
    const [aYear, aMonth] = a[0].split('-').map(Number);
    const [bYear, bMonth] = b[0].split('-').map(Number);
    return bYear * 12 + bMonth - (aYear * 12 + aMonth);
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={school.name}
        description={
          <>
            <div>기본 요금 {school.defaultMonthlyFee.toLocaleString()}원 · 등록 학생 {students.length}명</div>
            {school.address ? <div className="text-sm text-slate-600">주소: {school.address}</div> : null}
          </>
        }
      />

      <div className="space-y-3">
        <CollapsibleCard title="학생 배정" description="미배정 학생을 선택해 학교에 연결합니다." buttonLabel="학생 배정">
          <AssignStudentForm
            schoolId={school.id}
            students={unassignedStudents.map((student) => ({
              id: student.id,
              name: student.name,
              guardianName: student.guardianName
            }))}
          />
        </CollapsibleCard>

      </div>

      <section className="ui-card ui-card-pad space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">학생 정보</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} schoolId={school.id} routes={routes} />
          ))}
          {students.length === 0 ? (
            <p className="ui-empty sm:col-span-2 lg:col-span-3">
              등록된 학생이 없습니다. 학생 배정에서 학생을 연결해주세요.
            </p>
          ) : null}
        </div>
      </section>

      <section className="ui-card ui-card-pad space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">월별 입금 요약</h2>
        <div className="ui-table-wrap">
          <UiTable>
            <UiThead className="sticky top-0 z-10">
              <UiTr>
                <UiTh className="text-left">월</UiTh>
                <UiTh className="text-right">입금액</UiTh>
                <UiTh className="text-right">부분 입금</UiTh>
                <UiTh className="text-right">미입금</UiTh>
                <UiTh className="text-right">부족금액</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {monthlyEntries.map(([key, summary]) => {
                const [year, month] = key.split('-');
                const items = Array.from((monthlyByStudent.get(key) ?? new Map()).entries())
                  .map(([sid, entry]) => {
                    const st = studentsById.get(sid)!;
                    const needed = Math.max(entry.expected - entry.paid, 0);
                    return needed > 0 ? { name: st.name, paid: entry.paid, needed } : null;
                  })
                  .filter((v): v is { name: string; paid: number; needed: number } => Boolean(v));
                return (
                  <UiTr key={key} className="border-b border-slate-100 last:border-b-0">
                    <UiTd className="font-medium text-slate-700">{year}년 {month}월</UiTd>
                    <UiTd className="text-right text-emerald-600">{summary.paid.toLocaleString()}원</UiTd>
                    <UiTd className="text-right text-amber-600">{summary.partial.toLocaleString()}원</UiTd>
                    <UiTd className="text-right text-rose-600">{summary.pending.toLocaleString()}원</UiTd>
                    <UiTd className="text-right text-slate-700">
                      {summary.shortage > 0 ? (
                        <ShortageReportButton label={`${summary.shortage.toLocaleString()}원`} items={items} />
                      ) : (
                        <span>0원</span>
                      )}
                    </UiTd>
                  </UiTr>
                );
              })}
              {monthlyEntries.length === 0 ? (
                <UiTr>
                  <UiTd colSpan={5} className="text-center text-base text-slate-700">아직 집계된 입금 요약이 없습니다.</UiTd>
                </UiTr>
              ) : null}
            </UiTbody>
          </UiTable>
        </div>
      </section>
    </div>
  );
}
