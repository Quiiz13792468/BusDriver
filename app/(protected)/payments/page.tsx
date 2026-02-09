import Link from 'next/link';

import { requireSession } from '@/lib/auth/session';
import { getAllPayments, getMonthlyPaymentSummary, getPaymentsBySchoolAndMonth } from '@/lib/data/payment';
import { getSchoolById, getSchools } from '@/lib/data/school';
import { getAllStudents, getStudentById, getStudentsBySchool } from '@/lib/data/student';
import { PageHeader } from '@/components/layout/page-header';
import { RecordPaymentModal } from '@/app/(protected)/payments/_components/record-payment-modal';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';

type PaymentsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  await requireSession('ADMIN');
  const schools = await getSchools();

  const allStudents = await getAllStudents();

    if (schools.length === 0) {
      return (
        <div className="space-y-4">
          <PageHeader title="입금 현황" description="월별·학교별 입금 현황을 확인할 수 있습니다." />
          <p className="ui-empty">
            등록된 학교가 없습니다.{' '}
            <Link href="/schools" className="font-semibold text-primary-600 hover:text-primary-700">학교 관리</Link>에서 먼저 학교를 추가해주세요.
          </p>
        </div>
    );
  }

  const selectedSchoolId = (Array.isArray(searchParams?.schoolId) ? searchParams?.schoolId[0] : searchParams?.schoolId) ?? 'ALL';
  const yearParam = Array.isArray(searchParams?.year) ? searchParams?.year[0] : searchParams?.year;
  const monthParam = Array.isArray(searchParams?.month) ? searchParams?.month[0] : searchParams?.month;

  const today = new Date();
  const selectedYear = yearParam ? Number(yearParam) : today.getFullYear();
  const selectedMonth = monthParam ? Number(monthParam) : today.getMonth() + 1;

  const now = new Date();
  const activeStudents = selectedSchoolId === 'ALL'
    ? allStudents.filter((s) => !s.suspendedAt || new Date(s.suspendedAt) > now)
    : (await getStudentsBySchool(selectedSchoolId)).filter((s) => !s.suspendedAt || new Date(s.suspendedAt) > now);
  const totalExpected = activeStudents.reduce((sum, s) => sum + (s.feeAmount ?? 0), 0);
  const studentCount = activeStudents.length;

  // 월별 요약 집계
  const yearlySummary = await (async () => {
    if (selectedSchoolId === 'ALL') {
      const perSchool = await Promise.all(
        schools.map(async (s) => ({ id: s.id, summary: await getMonthlyPaymentSummary({ schoolId: s.id, year: selectedYear }) }))
      );
      const merged: Record<number, { paid: number; partial: number; missing: number; totalAmount: number; studentCount: number }> = {} as any;
      for (let m = 1; m <= 12; m += 1) merged[m] = { paid: 0, partial: 0, missing: 0, totalAmount: totalExpected, studentCount };
      for (const s of perSchool) {
        for (let m = 1; m <= 12; m += 1) {
          const row = (s.summary as any)[m] as { paid: number; partial: number; missing: number };
          if (!row) continue;
          merged[m].paid += row.paid;
          merged[m].partial += row.partial;
          merged[m].missing += row.missing;
        }
      }
      return merged;
    }
    const summary = await getMonthlyPaymentSummary({ schoolId: selectedSchoolId, year: selectedYear });
    const withMeta: Record<number, { paid: number; partial: number; missing: number; totalAmount: number; studentCount: number }> = {} as any;
    for (let m = 1; m <= 12; m += 1) {
      const row = (summary as any)[m] as { paid: number; partial: number; missing: number };
      withMeta[m] = { paid: row?.paid ?? 0, partial: row?.partial ?? 0, missing: row?.missing ?? 0, totalAmount: totalExpected, studentCount };
    }
    return withMeta;
  })();

  // 선택 월 결제 내역
  const payments = await (async () => {
    if (selectedSchoolId === 'ALL') {
      const all = await getAllPayments();
      return all.filter((p) => p.targetYear === selectedYear && p.targetMonth === selectedMonth);
    }
    return getPaymentsBySchoolAndMonth({ schoolId: selectedSchoolId, year: selectedYear, month: selectedMonth });
  })();

  // 학생 정보 포함하여 확장
  const enriched = await Promise.all(
    payments.map(async (p) => {
      const student = await getStudentById(p.studentId);
      return {
        ...p,
        studentName: student?.name ?? '학생',
        studentFee: student?.feeAmount ?? 0
      };
    })
  );
  enriched.sort((a, b) => a.studentName.localeCompare(b.studentName, 'ko'));

  // 학생별 합계 산출(상태/부족금액 계산)
  const aggregatedRows = (() => {
    const map = new Map<string, { id: string; name: string; schoolId: string; fee: number; paid: number; partial: number; memo: string | null }>();
    for (const p of enriched) {
      const cur = map.get(p.studentId) ?? { id: p.studentId, name: p.studentName, schoolId: p.schoolId, fee: p.studentFee, paid: 0, partial: 0, memo: null };
      cur.name = p.studentName;
      cur.fee = p.studentFee ?? cur.fee;
      if (p.status === 'PAID') cur.paid += p.amount;
      if (p.status === 'PARTIAL') cur.partial += p.amount;
      if (p.memo) cur.memo = p.memo;
      map.set(p.studentId, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  })();

  const selectedSchool = selectedSchoolId === 'ALL' ? null : await getSchoolById(selectedSchoolId);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="입금 현황"
        description={`${selectedSchool ? `${selectedSchool.name} 기준` : '전체 학교 기준'} · 연도와 학교를 선택해 세부 내역을 확인하세요.`}
      />
      <RecordPaymentModal
        schools={schools.map((school) => ({
          id: school.id,
          name: school.name,
          defaultMonthlyFee: school.defaultMonthlyFee
        }))}
        students={allStudents.map((student) => ({
          id: student.id,
          name: student.name,
          feeAmount: student.feeAmount,
          schoolId: student.schoolId
        }))}
      />

      {/* 컨트롤 바 */}
      <section className="ui-control">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">학교</label>
          <select name="schoolId" defaultValue={selectedSchoolId} className="ui-select w-auto">
            <option value="ALL">전체</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <label className="ml-2 text-sm font-semibold text-slate-700">연도</label>
          <select name="year" defaultValue={String(selectedYear)} className="ui-select w-auto">
            {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map((yy) => (
              <option key={yy} value={yy}>{yy}</option>
            ))}
          </select>
          <button className="ui-btn-outline border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100">조회</button>
        </form>
      </section>

      {/* 월별 요약 */}
      <section className="space-y-2">
          <details open={selectedSchoolId === 'ALL'} className="ui-collapse">
            <summary className="ui-collapse-summary">
              <span className="px-1">
                월별 입금 요약 {selectedSchool ? `- ${selectedSchool.name}` : '(전체)'}
              </span>
            </summary>
            <div className="ui-collapse-panel ui-table-wrap">
            <UiTable className="text-sm">
            <UiThead>
              <UiTr>
                <UiTh>월</UiTh>
                <UiTh>총 입금액</UiTh>
                <UiTh>부분 입금</UiTh>
                <UiTh>총 금액</UiTh>
                <UiTh>학생수</UiTh>
                <UiTh>미입금</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const row = (yearlySummary as any)[m] as { paid: number; partial: number; missing: number; totalAmount: number; studentCount: number };
                const isActive = m === selectedMonth;
                return (
                  <UiTr key={m} className={`border-b border-slate-100 last:border-b-0 ${isActive ? 'bg-amber-50/60' : ''}`}>
                    <UiTd className="font-medium text-slate-700">
                      <Link href={`/payments?schoolId=${selectedSchoolId}&year=${selectedYear}&month=${m}`} className="text-primary-600 hover:text-primary-700">{m}월</Link>
                    </UiTd>
                    <UiTd className="text-right text-emerald-600">{(row?.paid ?? 0).toLocaleString()}원</UiTd>
                    <UiTd className="text-right text-amber-600">{(row?.partial ?? 0).toLocaleString()}원</UiTd>
                    <UiTd className="text-right font-semibold text-slate-800">
                      <Link href={`/payments?schoolId=${selectedSchoolId}&year=${selectedYear}&month=${m}`} className="text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-primary-700">
                        {(row?.totalAmount ?? 0).toLocaleString()}원
                      </Link>
                    </UiTd>
                    <UiTd className="text-center text-slate-700">{row?.studentCount ?? 0}</UiTd>
                    <UiTd className="text-right text-rose-600">
                      <Link href={`/payments?schoolId=${selectedSchoolId}&year=${selectedYear}&month=${m}`} className="underline decoration-rose-300 underline-offset-2 hover:text-rose-700">
                        {(row?.missing ?? 0).toLocaleString()}원
                      </Link>
                    </UiTd>
                  </UiTr>
                );
              })}
            </UiTbody>
            </UiTable>
            </div>
          </details>
      </section>

      {/* 선택 월 결제 내역 */}
      <section className="ui-card ui-card-pad">
        <h2 className="mb-3 text-base font-semibold text-slate-900">{selectedYear}년 {selectedMonth}월 결제 내역</h2>
        <div className="ui-table-wrap">
          <UiTable>
            <UiThead className="sticky top-0 z-10">
              <UiTr>
                <UiTh>학생</UiTh>
                <UiTh>금액</UiTh>
                <UiTh>상태</UiTh>
                <UiTh>메모</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {enriched.map((p) => (
                <UiTr key={p.id} className="border-b border-slate-100 last:border-b-0">
                  <UiTd className="font-medium text-slate-700">{p.studentName}</UiTd>
                  <UiTd className="text-right text-slate-700">{p.amount.toLocaleString()}원</UiTd>
                  <UiTd className="text-left text-slate-700">{p.status === 'PAID' ? '완납' : p.status === 'PARTIAL' ? '부분 입금' : '미입금'}</UiTd>
                  <UiTd className="text-left text-slate-700">{p.memo ?? '-'}</UiTd>
                </UiTr>
              ))}
              {enriched.length === 0 ? (
                <UiTr>
                  <UiTd colSpan={4} className="text-center text-base text-slate-700">표시할 데이터가 없습니다.</UiTd>
                </UiTr>
              ) : null}
            </UiTbody>
          </UiTable>
        </div>
      </section>

      {/* 학생별 합계 (상태/부족금액 포함) */}
      <section className="ui-card ui-card-pad">
        <h2 className="mb-3 text-base font-semibold text-slate-900">학생별 합계 ({selectedYear}년 {selectedMonth}월)</h2>
        <div className="ui-table-wrap">
          <UiTable>
            <UiThead className="sticky top-0 z-10">
              <UiTr>
                <UiTh>학생</UiTh>
                <UiTh>총 입금액</UiTh>
                <UiTh>상태</UiTh>
                <UiTh>부족금액</UiTh>
                <UiTh>메모</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {aggregatedRows.map((r) => {
                const total = r.paid + r.partial;
                const shortage = Math.max(0, r.fee - total);
                const status = shortage === 0 ? '입금완료' : '금액부족';
                return (
                  <UiTr key={r.id} className="border-b border-slate-100 last:border-b-0">
                    <UiTd className="text-slate-800">{r.name}</UiTd>
                    <UiTd className="text-right text-emerald-700">{total.toLocaleString()}원</UiTd>
                    <UiTd className={`font-semibold ${status === '입금완료' ? 'text-emerald-700' : 'text-rose-700'}`}>{status}</UiTd>
                    <UiTd className="text-right font-semibold text-slate-800">{shortage.toLocaleString()}원</UiTd>
                    <UiTd className="text-slate-700">{r.memo ?? '-'}</UiTd>
                  </UiTr>
                );
              })}
              {aggregatedRows.length === 0 ? (
                <UiTr>
                  <UiTd colSpan={5} className="text-center text-base text-slate-700">표시할 데이터가 없습니다.</UiTd>
                </UiTr>
              ) : null}
            </UiTbody>
          </UiTable>
        </div>
      </section>
    </div>
  );
}
