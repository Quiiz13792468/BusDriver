import Link from 'next/link';

import { requireSession } from '@/lib/auth/session';
import { getPaymentsByYear, getEffectiveFee } from '@/lib/data/payment';
import { getSchools } from '@/lib/data/school';
import { getAllStudents, getStudentsBySchool } from '@/lib/data/student';
import { RecordPaymentModal } from '@/app/(protected)/payments/_components/record-payment-modal';
import { CollapsibleSummary } from '@/app/(protected)/payments/_components/collapsible-summary';
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
    ? allStudents.filter((s) => s.isActive && (!s.suspendedAt || new Date(s.suspendedAt) > now))
    : (await getStudentsBySchool(selectedSchoolId)).filter((s) => s.isActive && (!s.suspendedAt || new Date(s.suspendedAt) > now));
  const totalExpected = activeStudents.reduce((sum, s) => sum + (s.feeAmount ?? 0), 0);
  const studentCount = activeStudents.length;

  // 연도 전체 결제 한 번 조회 (ALL/단일 학교 공용)
  const schoolObjMap = new Map(schools.map((s) => [s.id, s]));
  const allYearPayments = await getPaymentsByYear(selectedYear);
  const yearPayments = selectedSchoolId === 'ALL'
    ? allYearPayments
    : allYearPayments.filter((p) => p.schoolId === selectedSchoolId);

  // 월별 요약 집계 — 이미 로드된 데이터에서 인메모리 계산 (DB 쿼리 N→0 추가)
  const summaryStudents = selectedSchoolId === 'ALL' ? allStudents : activeStudents;
  const yearlySummary = (() => {
    const result: Record<number, { paid: number; partial: number; missing: number; totalAmount: number; studentCount: number }> = {} as any;
    for (let m = 1; m <= 12; m += 1) result[m] = { paid: 0, partial: 0, missing: 0, totalAmount: totalExpected, studentCount };
    for (const p of yearPayments) {
      const row = result[p.targetMonth];
      if (!row) continue;
      if (p.status === 'PAID') row.paid += p.amount;
      if (p.status === 'PARTIAL') row.partial += p.amount;
    }
    for (let m = 1; m <= 12; m += 1) {
      const endOfMonth = new Date(selectedYear, m, 0);
      const monthStudents = summaryStudents.filter(
        (s) => s.isActive && (!s.suspendedAt || new Date(s.suspendedAt) > endOfMonth)
      );
      const expected = monthStudents.reduce((sum, s) => sum + getEffectiveFee(s, schoolObjMap.get(s.schoolId ?? '') ?? null), 0);
      result[m].missing = Math.max(0, expected - (result[m].paid + result[m].partial));
      result[m].studentCount = monthStudents.length;
      result[m].totalAmount = expected;
    }
    return result;
  })();

  // 선택 월 결제 내역
  const payments = yearPayments.filter((p) => p.targetMonth === selectedMonth);

  // 학생 정보 포함하여 확장 (allStudents Map으로 N+1 제거)
  const studentMap = new Map(allStudents.map((s) => [s.id, s]));
  const enriched = payments.map((p) => {
    const student = studentMap.get(p.studentId);
    return {
      ...p,
      studentName: student?.name ?? '학생',
      studentFee: student?.feeAmount ?? 0
    };
  });
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

  const selectedSchool = selectedSchoolId === 'ALL' ? null : (schools.find((s) => s.id === selectedSchoolId) ?? null);

  return (
    <div className="space-y-3">
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
      <section className="ui-control overflow-x-hidden">
        <form method="get" className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 w-full min-w-0">
            <div className="flex items-center gap-2">
              <label className="shrink-0 text-sm font-semibold text-slate-700" htmlFor="schoolId">학교</label>
              <select id="schoolId" name="schoolId" defaultValue={selectedSchoolId} className="ui-select w-auto">
                <option value="ALL">전체</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="shrink-0 text-sm font-semibold text-slate-700" htmlFor="year">연도</label>
              <select id="year" name="year" defaultValue={String(selectedYear)} className="ui-select w-auto">
                {Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i).map((yy) => (
                  <option key={yy} value={yy}>{yy}</option>
                ))}
              </select>
            </div>
            <button className="ui-btn-outline border-amber-300 bg-amber-50 py-1.5 text-amber-700 hover:bg-amber-100">
              조회
            </button>
          </div>
        </form>
      </section>

      {/* 선택 월 입금 내역 */}
      <section className="ui-card ui-card-pad">
        <h2 className="mb-3 text-base font-semibold text-slate-900">{selectedYear}년 {selectedMonth}월 입금 내역</h2>
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
                  <UiTd className="whitespace-nowrap font-medium text-slate-700">{p.studentName}</UiTd>
                  <UiTd className="text-right text-slate-700">{p.amount.toLocaleString()}원</UiTd>
                  <UiTd className={`whitespace-nowrap text-left font-semibold ${p.status === 'PAID' ? 'text-emerald-700' : p.status === 'PARTIAL' ? 'text-amber-700' : 'text-rose-700'}`}>
                    {p.status === 'PAID' ? '완납' : p.status === 'PARTIAL' ? '부분입금' : '미입금'}
                  </UiTd>
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
                const isPaid = shortage === 0 && total > 0;
                const isPartial = shortage > 0 && total > 0;
                const statusLabel = isPaid ? '완납' : isPartial ? '부분입금' : '미입금';
                return (
                  <UiTr key={r.id} className="border-b border-slate-100 last:border-b-0">
                    <UiTd className="whitespace-nowrap text-slate-800">{r.name}</UiTd>
                    <UiTd className="text-right text-emerald-700">{total.toLocaleString()}원</UiTd>
                    <UiTd className={`whitespace-nowrap font-semibold ${isPaid ? 'text-emerald-700' : isPartial ? 'text-amber-700' : 'text-rose-700'}`}>{statusLabel}</UiTd>
                    <UiTd className={`text-right font-semibold ${shortage > 0 ? 'text-rose-700' : 'text-slate-800'}`}>{shortage.toLocaleString()}원</UiTd>
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

      {/* 월별 입금 요약 (전체) */}
      <section className="space-y-2">
          <CollapsibleSummary
            title={`월별 입금 요약 ${selectedSchool ? `- ${selectedSchool.name}` : '(전체)'}`}
            defaultOpen={selectedSchoolId === 'ALL'}
          >
            <div>
              {/* 모바일 카드 */}
              <div className="md:hidden space-y-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const row = (yearlySummary as any)[m] as { paid: number; partial: number; missing: number; totalAmount: number; studentCount: number };
                  const isActive = m === selectedMonth;
                  return (
                    <Link
                      key={m}
                      href={`/payments?schoolId=${selectedSchoolId}&year=${selectedYear}&month=${m}`}
                      className={`block rounded-xl border p-3 transition ${isActive ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-slate-800">{m}월</span>
                        <span className="text-sm text-slate-500">{row?.studentCount ?? 0}명</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                        <span className="text-emerald-600">입금 {(row?.paid ?? 0).toLocaleString()}원</span>
                        {(row?.partial ?? 0) > 0 && <span className="text-amber-600">부분 {(row?.partial ?? 0).toLocaleString()}원</span>}
                        {(row?.missing ?? 0) > 0 && <span className="font-semibold text-rose-600">미입금 {(row?.missing ?? 0).toLocaleString()}원</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {/* 데스크톱 테이블 */}
              <div className="ui-table-wrap hidden md:block">
            <UiTable className="text-sm">
            <UiThead>
              <UiTr>
                <UiTh>월</UiTh>
                <UiTh>총 입금액</UiTh>
                <UiTh>부분 입금</UiTh>
                <UiTh>학생수</UiTh>
                <UiTh>미입금</UiTh>
                <UiTh>총 금액</UiTh>
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
                    <UiTd className="text-center text-slate-700">{row?.studentCount ?? 0}</UiTd>
                    <UiTd className="text-right text-rose-600">
                      <Link href={`/payments?schoolId=${selectedSchoolId}&year=${selectedYear}&month=${m}`} className="underline decoration-rose-300 underline-offset-2 hover:text-rose-700">
                        {(row?.missing ?? 0).toLocaleString()}원
                      </Link>
                    </UiTd>
                    <UiTd className="text-right font-semibold text-slate-800">
                      <Link href={`/payments?schoolId=${selectedSchoolId}&year=${selectedYear}&month=${m}`} className="text-slate-800 underline decoration-slate-300 underline-offset-2 hover:text-primary-700">
                        {(row?.totalAmount ?? 0).toLocaleString()}원
                      </Link>
                    </UiTd>
                  </UiTr>
                );
              })}
            </UiTbody>
            </UiTable>
            </div>
            </div>
          </CollapsibleSummary>
      </section>
    </div>
  );
}
