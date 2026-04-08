import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { getAlerts } from '@/lib/data/alert';
import { getSchools } from '@/lib/data/school';
import { getAllPayments, getPaymentsByYear, getPaymentsByStudentIds, getEffectiveFee } from '@/lib/data/payment';
import { getAllStudents, getStudentsByParent } from '@/lib/data/student';
import { RouteIcon, BoardIcon, MapIcon } from '@/components/layout/nav-icons';
import { RequestPaymentButton } from '@/components/request-payment-button';
import { MonthControls } from '@/app/(protected)/dashboard/_components/month-controls';
import { LinkWithLoading } from '@/components/link-with-loading';
import { AlertPanel } from '@/app/(protected)/dashboard/_components/alert-panel';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';
import { AdSlot } from '@/components/ads/ad-slot';
import { InviteLinkGenerator } from '@/components/invite-link-generator';
import { QuickPaymentDialog } from '@/app/(protected)/dashboard/_components/quick-payment-dialog';

type Props = { searchParams?: Record<string, string | string[] | undefined> };

export default async function DashboardPage({ searchParams }: Props) {
  const session = await requireSession();
  const role = session.role;
  const name = session.name ?? '사용자';

  if (role === 'ADMIN') {
    return AdminDashboard({ name, searchParams });
  }

  return ParentDashboard({ name, userId: session.id, searchParams });
}

async function AdminDashboard({ name, searchParams }: { name: string; searchParams?: Record<string, string | string[] | undefined> }) {
  const today = new Date();
  const yParam = arrayFirst(searchParams?.year);
  const mParam = arrayFirst(searchParams?.month);
  const typeParam = (arrayFirst(searchParams?.atype) || 'ALL') as 'ALL' | 'PAYMENT' | 'INQUIRY' | 'ROUTE_CHANGE';
  const y = yParam ? Number(yParam) : today.getFullYear();
  const m = mParam ? Number(mParam) : today.getMonth() + 1;

  const [alerts, schools, students, payments] = await Promise.all([
    getAlerts(),
    getSchools(),
    getAllStudents(),
    getPaymentsByYear(y)
  ]);

  const schoolMap = new Map(schools.map((s) => [s.id, s.name]));
  const schoolObjMap = new Map(schools.map((s) => [s.id, s]));
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const thisMonth = payments.filter((p) => p.targetYear === y && p.targetMonth === m);
  const fixedMinYear = 2024;
  const fixedMaxYear = today.getFullYear() + 1;

  const byStudent = new Map<string, { paid: number; partial: number; memo: string | null; lastAt: number; schoolId: string }>();
  for (const p of thisMonth) {
    const entry = byStudent.get(p.studentId) ?? { paid: 0, partial: 0, memo: null, lastAt: 0, schoolId: p.schoolId };
    if (p.status === 'PAID') entry.paid += p.amount;
    if (p.status === 'PARTIAL') entry.partial += p.amount;
    const ts = new Date(p.createdAt).getTime();
    if (p.memo && (entry.memo == null || ts >= entry.lastAt)) entry.memo = p.memo;
    if (ts > entry.lastAt) entry.lastAt = ts;
    entry.schoolId = p.schoolId;
    byStudent.set(p.studentId, entry);
  }

  type Row = { school: string; student: string; paid: number; partial: number; memo: string | null; status: '입금완료' | '금액부족'; shortage: number; lastAt: number };
  const rows: Row[] = [];
  for (const [studentId, agg] of byStudent) {
    const st = studentMap.get(studentId);
    if (!st) continue;
    const total = agg.paid + agg.partial;
    const school = schoolObjMap.get(agg.schoolId) ?? null;
    const effectiveFee = getEffectiveFee(st, school);
    const status = total >= effectiveFee && effectiveFee > 0 ? '입금완료' : '금액부족';
    const shortage = Math.max(0, effectiveFee - total);
    rows.push({
      school: schoolMap.get(agg.schoolId) ?? '-',
      student: st.name,
      paid: agg.paid,
      partial: agg.partial,
      memo: agg.memo,
      status,
      shortage,
      lastAt: agg.lastAt
    });
  }
  rows.sort((a, b) => b.lastAt - a.lastAt);

  const schoolLookup = Object.fromEntries(schools.map((s) => [s.id, s.name]));
  const studentLookup = Object.fromEntries(students.map((s) => [s.id, s.name]));

  const yearlyPayments = payments.filter((p) => p.targetYear === y);
  const now = new Date();
  const monthlyStats = Array.from({ length: 12 }, (_, idx) => {
    const month = idx + 1;
    const monthPayments = yearlyPayments.filter((p) => p.targetMonth === month);
    const byStudent = new Map<string, { paid: number; partial: number }>();
    let totalPaid = 0;
    let totalPartial = 0;
    for (const p of monthPayments) {
      const entry = byStudent.get(p.studentId) ?? { paid: 0, partial: 0 };
      if (p.status === 'PAID') entry.paid += p.amount;
      if (p.status === 'PARTIAL') entry.partial += p.amount;
      byStudent.set(p.studentId, entry);
      if (p.status === 'PAID') totalPaid += p.amount;
      if (p.status === 'PARTIAL') totalPartial += p.amount;
    }
    const endOfMonth = new Date(y, month, 0); // 해당 월 마지막 날
    const monthActiveStudents = students.filter(
      (s) => s.isActive && (!s.suspendedAt || new Date(s.suspendedAt) > endOfMonth)
    );
    let shortage = 0;
    let count = 0;
    for (const st of monthActiveStudents) {
      const agg = byStudent.get(st.id) ?? { paid: 0, partial: 0 };
      const total = agg.paid + agg.partial;
      const stSchool = schoolObjMap.get(st.schoolId ?? '') ?? null;
      const diff = Math.max(0, getEffectiveFee(st, stSchool) - total);
      shortage += diff;
      if (diff > 0) count += 1;
    }
    const monthExpected = monthActiveStudents.reduce((sum, st) => {
      const stSchool = schoolObjMap.get(st.schoolId ?? '') ?? null;
      return sum + getEffectiveFee(st, stSchool);
    }, 0);
    const totalAmount = Math.max(0, monthExpected - (totalPaid + totalPartial));
    return { month, paid: totalPaid, partial: totalPartial, shortage, count, totalAmount };
  });

  return (
    <div className="space-y-3">
      {/* 학부모 초대 링크 */}
      <section>
        <InviteLinkGenerator />
      </section>

      {/* 알림 리스트 */}
      <section className="space-y-2">
        <AlertPanel
          alerts={alerts}
          typeParam={typeParam}
          year={y}
          month={m}
          schoolMap={schoolLookup}
          studentMap={studentLookup}
        />
      </section>

      {/* 이번 달 입금자 명단 */}
      <section className="ui-card ui-card-pad space-y-2">
        <h2 className="text-xl font-bold text-sp-text">입금자 명단</h2>
        <MonthControls
          year={y}
          month={m}
          minYear={fixedMinYear}
          minMonth={1}
          maxYear={fixedMaxYear}
          maxMonth={12}
          typeParam={typeParam}
        />

        {/* 모바일: 카드 */}
        <div className="space-y-2 md:hidden">
          {rows.length === 0 ? (
            <p className="ui-empty">이번 달 입금 기록이 없습니다.</p>
          ) : rows.map((r, idx) => (
            <div key={idx} className={`rounded-xl border p-[10px] ${r.status === '입금완료' ? 'border-emerald-900 bg-emerald-900/20' : 'border-rose-900 bg-rose-900/20'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-sp-text">{r.student}</span>
                  <span className="rounded-full bg-sp-raised px-2.5 py-0.5 text-sm font-medium text-sp-muted">{r.school}</span>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${r.status === '입금완료' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
                  {r.status}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {r.paid > 0 && (
                  <span className="text-base">입금 <strong className="text-emerald-400">{r.paid.toLocaleString()}원</strong></span>
                )}
                {r.partial > 0 && (
                  <span className="text-base">부분 <strong className="text-amber-400">{r.partial.toLocaleString()}원</strong></span>
                )}
                {r.shortage > 0 && (
                  <span className="text-base">부족 <strong className="text-rose-400">{r.shortage.toLocaleString()}원</strong></span>
                )}
                {r.memo && (
                  <span className="w-full text-sm text-sp-faint">메모: {r.memo}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 데스크톱: 테이블 */}
        <div className="ui-table-wrap hidden md:block">
          <UiTable>
            <UiThead>
              <UiTr>
                <UiTh>학교</UiTh>
                <UiTh>학생 이름</UiTh>
                <UiTh>입금액</UiTh>
                <UiTh>부분입금액</UiTh>
                <UiTh>메모</UiTh>
                <UiTh>상태</UiTh>
                <UiTh>부족금액</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {rows.map((r, idx) => (
                <UiTr key={idx}>
                  <UiTd>{r.school}</UiTd>
                  <UiTd className="whitespace-nowrap">{r.student}</UiTd>
                  <UiTd className="text-right text-emerald-400">{r.paid.toLocaleString()}원</UiTd>
                  <UiTd className="text-right text-amber-400">{r.partial.toLocaleString()}원</UiTd>
                  <UiTd className="text-sp-muted">{r.memo ?? '-'}</UiTd>
                  <UiTd className={`whitespace-nowrap font-semibold ${r.status === '입금완료' ? 'text-emerald-400' : 'text-rose-400'}`}>{r.status}</UiTd>
                  <UiTd className={`text-right font-semibold ${r.shortage > 0 ? 'text-rose-400' : 'text-sp-muted'}`}>{r.shortage.toLocaleString()}원</UiTd>
                </UiTr>
              ))}
              {rows.length === 0 ? (
                <UiTr>
                  <UiTd colSpan={7} className="text-center text-base text-sp-muted">이번 달 입금 기록이 없습니다.</UiTd>
                </UiTr>
              ) : null}
            </UiTbody>
          </UiTable>
        </div>
      </section>

      {/* 연간 실적 */}
      <section className="ui-card ui-card-pad space-y-2">
        <h2 className="text-xl font-bold text-sp-text">{y}년 실적</h2>

        {/* 모바일: 컴팩트 목록 */}
        <div className="space-y-1.5 md:hidden">
          {monthlyStats.map((stat) => {
            const total = stat.paid + stat.partial;
            const isEmpty = total === 0;
            const isComplete = !isEmpty && stat.shortage === 0;
            const hasShortage = stat.shortage > 0;
            return (
              <div
                key={stat.month}
                className={`flex items-center gap-[5px] rounded-xl border p-[10px] ${isEmpty ? 'border-sp-border bg-sp-raised/30' : isComplete ? 'border-emerald-900 bg-emerald-900/20' : 'border-rose-900 bg-rose-900/20'}`}
              >
                <span className={`w-9 shrink-0 text-base font-bold ${isEmpty ? 'text-sp-faint' : 'text-sp-text'}`}>{stat.month}월</span>
                <div className="flex flex-1 items-center justify-end gap-x-3 gap-y-0.5 flex-wrap">
                  {total > 0 ? (
                    <span className="text-base text-emerald-400">{total.toLocaleString()}원</span>
                  ) : (
                    <span className="text-base text-sp-faint">기록 없음</span>
                  )}
                  {hasShortage ? (
                    <LinkWithLoading
                      href={`/dashboard/shortages?year=${y}&month=${stat.month}`}
                      className="rounded-full bg-rose-900/30 px-2.5 py-0.5 text-base font-bold text-rose-400"
                    >
                      부족 {stat.shortage.toLocaleString()}원
                    </LinkWithLoading>
                  ) : isComplete ? (
                    <span className="rounded-full bg-emerald-900/30 px-2.5 py-0.5 text-base font-bold text-emerald-400">완납</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* 데스크톱: 테이블 */}
        <div className="ui-table-wrap hidden md:block">
          <UiTable>
            <UiThead>
              <UiTr>
                <UiTh>월</UiTh>
                <UiTh>입금액</UiTh>
                <UiTh>부분입금액</UiTh>
                <UiTh>미입금액</UiTh>
                <UiTh>학생수</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {monthlyStats.map((stat) => (
                <UiTr key={stat.month}>
                  <UiTd className="text-center">{stat.month}월</UiTd>
                  <UiTd className="text-right text-emerald-400">{stat.paid.toLocaleString()}원</UiTd>
                  <UiTd className="text-right text-amber-400">{stat.partial.toLocaleString()}원</UiTd>
                  <UiTd className={`text-right font-semibold ${stat.shortage > 0 ? 'text-rose-400' : 'text-sp-muted'}`}>
                    {stat.shortage > 0 ? (
                      <LinkWithLoading
                        href={`/dashboard/shortages?year=${y}&month=${stat.month}`}
                        className="underline decoration-rose-700 underline-offset-2 hover:text-rose-400"
                      >
                        {stat.shortage.toLocaleString()}원
                      </LinkWithLoading>
                    ) : (
                      `${stat.shortage.toLocaleString()}원`
                    )}
                  </UiTd>
                  <UiTd className="text-center text-sp-muted">{stat.count}</UiTd>
                </UiTr>
              ))}
            </UiTbody>
          </UiTable>
        </div>
      </section>

      <AdSlot placement="대시보드 하단" format="horizontal" />

      <QuickPaymentDialog
        students={students
          .filter(s => s.isActive && (!s.suspendedAt || new Date(s.suspendedAt) > now))
          .map(s => ({ ...s, schoolName: schoolMap.get(s.schoolId ?? '') ?? '-' }))}
        schools={schools}
        currentYear={y}
        currentMonth={m}
      />
    </div>
  );
}

function arrayFirst(v?: string | string[]) {
  return Array.isArray(v) ? v[0] : v;
}

async function ParentDashboard({ name, userId, searchParams }: { name: string; userId: string; searchParams?: Record<string, string | string[] | undefined> }) {
  const [students, schools] = await Promise.all([
    getStudentsByParent(userId),
    getSchools()
  ]);
  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));
  const allStudentPayments = await getPaymentsByStudentIds(students.map((s) => s.id));
  const paymentsByStudent = students.map((student) => ({
    student,
    payments: allStudentPayments.filter((p) => p.studentId === student.id)
  }));
  const today = new Date();
  const yearParam = arrayFirst(searchParams?.year);
  const selectedYear = yearParam ? Number(yearParam) : today.getFullYear();
  const yearSet = new Set<number>([today.getFullYear()]);
  paymentsByStudent.forEach(({ payments }) => payments.forEach((p) => yearSet.add(p.targetYear)));
  const yearOptions = Array.from(yearSet).sort((a, b) => b - a);
  const year = Number.isInteger(selectedYear) ? selectedYear : today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  return (
    <div className="space-y-3">
      <section className="ui-card ui-card-pad">
        <h2 className="mb-3 text-xl font-bold text-sp-text">학생 정보</h2>
        {students.length === 0 ? (
          <p className="ui-empty">등록된 학생이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {students.map((s) => (
              <li key={s.id} className="rounded-xl border border-sp-border bg-sp-raised p-4">
                {/* 이름 + 학교 헤더 */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xl font-bold text-sp-text">{s.name}</span>
                  <span className="rounded-full bg-primary-900/30 px-3 py-0.5 text-sm font-semibold text-primary-400">
                    {s.schoolId ? schoolMap.get(s.schoolId) ?? '학교 정보 없음' : '미배정'}
                  </span>
                </div>
                {/* 정보 그리드 */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-sm font-medium text-sp-faint">전화번호</span>
                    <span className="text-base font-semibold text-sp-text">{s.phone ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-sm font-medium text-sp-faint">기본요금</span>
                    <span className="text-base font-bold text-primary-400">{s.feeAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                    <span className="w-16 shrink-0 text-sm font-medium text-sp-faint">탑승위치</span>
                    {s.pickupPoint ? (
                      s.routeId ? (
                        <Link
                          href={`/dashboard/route?highlight=${encodeURIComponent(s.pickupPoint)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-900/20 px-3 py-1.5 text-base font-semibold text-amber-300 transition hover:bg-amber-900/40 active:scale-95"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor"/>
                          </svg>
                          {s.pickupPoint}
                        </Link>
                      ) : (
                        <span className="text-base font-semibold text-sp-text">{s.pickupPoint}</span>
                      )
                    ) : (
                      <span className="text-base text-sp-faint">미설정</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ui-card ui-card-pad space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-sp-text">입금 내역</h2>
          <form method="get" className="flex items-center gap-2">
            <select id="year" name="year" defaultValue={String(year)} className="ui-select w-auto py-1.5">
              {yearOptions.map((yy) => (
                <option key={yy} value={yy}>{yy}년</option>
              ))}
            </select>
            <button className="ui-btn-outline border-amber-600 bg-amber-900/20 py-1.5 text-base text-amber-400">조회</button>
          </form>
        </div>

        {paymentsByStudent.length === 0 ? (
          <p className="ui-empty">입금 내역이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {paymentsByStudent.map(({ student, payments }) => {
              const studentSchool = schools.find((sc) => sc.id === student.schoolId) ?? null;
              const effectiveFee = getEffectiveFee(student, studentSchool);
              const list = payments.filter((p) => p.targetYear === year);
              return (
                <div key={student.id} className="rounded-xl border border-sp-border bg-sp-raised p-4">
                  {/* 학생 헤더 */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-sp-text">{student.name}</h3>
                    {effectiveFee > 0 && (
                      <span className="rounded-full bg-primary-900/30 px-3 py-0.5 text-sm font-semibold text-primary-400">
                        월 {effectiveFee.toLocaleString()}원
                      </span>
                    )}
                  </div>
                  {/* 월별 입금 목록 */}
                  <div className="space-y-1.5">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const isFuture = month > currentMonth && year === today.getFullYear();
                      const monthPayments = list.filter((p) => p.targetMonth === month);
                      const paid = monthPayments
                        .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
                        .reduce((sum, p) => sum + p.amount, 0);
                      const status = effectiveFee > 0 && paid >= effectiveFee ? '완납' : paid > 0 ? '부분입금' : '미입금';
                      const isCurrent = month === currentMonth && year === today.getFullYear();

                      if (isFuture) return null;

                      return (
                        <div
                          key={`${student.id}-${month}`}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                            isCurrent
                              ? 'border-amber-600 bg-amber-900/20'
                              : status === '완납'
                              ? 'border-emerald-900 bg-emerald-900/20'
                              : paid > 0
                              ? 'border-amber-900 bg-amber-900/20'
                              : 'border-sp-border bg-sp-raised'
                          }`}
                        >
                          <span className={`w-8 shrink-0 text-base font-bold ${isCurrent ? 'text-amber-400' : 'text-sp-muted'}`}>
                            {month}월
                          </span>
                          <span className={`flex-1 text-base font-semibold ${
                            status === '완납' ? 'text-emerald-400' : paid > 0 ? 'text-amber-400' : 'text-sp-faint'
                          }`}>
                            {status}
                          </span>
                          {paid > 0 && (
                            <span className="text-base font-bold text-sp-text">{paid.toLocaleString()}원</span>
                          )}
                          {student.schoolId && status !== '완납' && (
                            <RequestPaymentButton studentId={student.id} schoolId={student.schoolId} year={year} month={month} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!student.schoolId && (
                    <p className="mt-3 rounded-lg bg-sp-raised/50 p-3 text-sm text-sp-faint">학교 배정 후 입금 확인 요청이 가능합니다.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AdSlot placement="대시보드 하단" format="horizontal" />
    </div>
  );
}
