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
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">입금자 명단</h2>
          <MonthControls
            year={y}
            month={m}
            minYear={fixedMinYear}
            minMonth={1}
            maxYear={fixedMaxYear}
            maxMonth={12}
            typeParam={typeParam}
          />
        </div>

        {/* 모바일: 카드 */}
        <div className="space-y-2 md:hidden">
          {rows.length === 0 ? (
            <p className="ui-empty">이번 달 입금 기록이 없습니다.</p>
          ) : rows.map((r, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900">{r.student}</span>
                  <span className="ml-2 text-xs text-slate-500">{r.school}</span>
                </div>
                <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === '입금완료' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {r.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {r.paid > 0 && <span>입금 <strong className="text-emerald-600">{r.paid.toLocaleString()}원</strong></span>}
                {r.partial > 0 && <span>부분 <strong className="text-amber-600">{r.partial.toLocaleString()}원</strong></span>}
                {r.shortage > 0 && <span>부족 <strong className="text-rose-600">{r.shortage.toLocaleString()}원</strong></span>}
                {r.memo && <span className="text-slate-500">메모: {r.memo}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* 데스크톱: 테이블 */}
        <div className="ui-table-wrap hidden md:block">
          <UiTable>
            <UiThead className="bg-slate-50">
              <UiTr>
                <UiTh className="px-[0.3rem]">학교</UiTh>
                <UiTh className="px-[0.3rem]">학생 이름</UiTh>
                <UiTh className="px-[0.3rem]">입금액</UiTh>
                <UiTh className="px-[0.3rem]">부분입금액</UiTh>
                <UiTh className="px-[0.3rem]">메모</UiTh>
                <UiTh className="px-[0.3rem]">상태</UiTh>
                <UiTh className="px-[0.3rem]">부족금액</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {rows.map((r, idx) => (
                <UiTr key={idx} className="border-b border-slate-100 last:border-b-0">
                  <UiTd className="px-[0.3rem] text-slate-800">{r.school}</UiTd>
                  <UiTd className="px-[0.3rem] text-slate-800">{r.student}</UiTd>
                  <UiTd className="px-[0.3rem] text-right text-emerald-600">{r.paid.toLocaleString()}원</UiTd>
                  <UiTd className="px-[0.3rem] text-right text-amber-600">{r.partial.toLocaleString()}원</UiTd>
                  <UiTd className="px-[0.3rem] text-slate-700">{r.memo ?? '-'}</UiTd>
                  <UiTd className={`px-[0.3rem] font-semibold ${r.status === '입금완료' ? 'text-emerald-700' : 'text-rose-700'}`}>{r.status}</UiTd>
                  <UiTd className="px-[0.3rem] text-right font-semibold text-slate-800">{r.shortage.toLocaleString()}원</UiTd>
                </UiTr>
              ))}
              {rows.length === 0 ? (
                <UiTr>
                  <UiTd colSpan={7} className="text-center text-base text-slate-700">이번 달 입금 기록이 없습니다.</UiTd>
                </UiTr>
              ) : null}
            </UiTbody>
          </UiTable>
        </div>
      </section>

      {/* 연간 실적 */}
      <section className="ui-card ui-card-pad space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">{y} 실적</h2>

        {/* 모바일: 컴팩트 목록 */}
        <div className="space-y-1 md:hidden">
          {monthlyStats.map((stat) => (
            <div
              key={stat.month}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${stat.paid + stat.partial === 0 ? 'border-slate-100 text-slate-400' : 'border-slate-200'}`}
            >
              <span className="w-7 shrink-0 font-medium text-slate-700">{stat.month}월</span>
              <div className="flex flex-1 flex-wrap justify-end gap-x-3 gap-y-0.5">
                {(stat.paid + stat.partial) > 0 ? (
                  <span className="text-emerald-600">{(stat.paid + stat.partial).toLocaleString()}원</span>
                ) : (
                  <span className="text-slate-400"> - </span>
                )}
                {stat.shortage > 0 ? (
                  <LinkWithLoading
                    href={`/dashboard/shortages?year=${y}&month=${stat.month}`}
                    className="font-semibold text-rose-600 underline decoration-rose-300 underline-offset-2"
                  >
                    부족 {stat.shortage.toLocaleString()}원
                  </LinkWithLoading>
                ) : (stat.paid + stat.partial) > 0 ? (
                  <span className="font-semibold text-emerald-500">완납</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* 데스크톱: 테이블 */}
        <div className="ui-table-wrap hidden md:block">
          <UiTable>
            <UiThead className="bg-slate-50">
              <UiTr>
                <UiTh className="px-[0.3rem]">월</UiTh>
                <UiTh className="px-[0.3rem]">입금액</UiTh>
                <UiTh className="px-[0.3rem]">부분입금액</UiTh>
                <UiTh className="px-[0.3rem]">미입금액</UiTh>
                <UiTh className="px-[0.3rem]">학생수</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {monthlyStats.map((stat) => (
                <UiTr key={stat.month}>
                  <UiTd className="px-[0.3rem] text-center text-slate-800">{stat.month}월</UiTd>
                  <UiTd className="px-[0.3rem] text-right text-emerald-600">{stat.paid.toLocaleString()}원</UiTd>
                  <UiTd className="px-[0.3rem] text-right text-amber-600">{stat.partial.toLocaleString()}원</UiTd>
                  <UiTd className={`px-[0.3rem] text-right font-semibold ${stat.shortage > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {stat.shortage > 0 ? (
                      <LinkWithLoading
                        href={`/dashboard/shortages?year=${y}&month=${stat.month}`}
                        className="underline decoration-rose-300 underline-offset-2 hover:text-rose-700"
                      >
                        {stat.shortage.toLocaleString()}원
                      </LinkWithLoading>
                    ) : (
                      `${stat.shortage.toLocaleString()}원`
                    )}
                  </UiTd>
                  <UiTd className="px-[0.3rem] text-center text-slate-700">{stat.count}</UiTd>
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
      <section>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/route" className="ui-card ui-card-compact flex items-center gap-4 transition hover:border-amber-200 hover:bg-amber-50/60 active:scale-[0.98]" style={{ minHeight: '60px' }}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500">
              <MapIcon className="h-6 w-6 text-white" />
            </span>
            <span className="text-lg font-semibold text-slate-900">노선 확인</span>
          </Link>

          <Link href="/dashboard/pickup" className="ui-card ui-card-compact flex items-center gap-4 transition hover:border-amber-200 hover:bg-amber-50/60 active:scale-[0.98]" style={{ minHeight: '60px' }}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500">
              <RouteIcon className="h-6 w-6 text-white" />
            </span>
            <span className="text-lg font-semibold text-slate-900">탑승지점 변경 요청</span>
          </Link>

          <Link href="/board" className="ui-card ui-card-compact flex items-center gap-4 transition hover:border-amber-200 hover:bg-amber-50/60 active:scale-[0.98]" style={{ minHeight: '60px' }}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 to-amber-400">
              <BoardIcon className="h-6 w-6 text-white" />
            </span>
            <span className="text-lg font-semibold text-slate-900">문의 게시판</span>
          </Link>
        </div>
      </section>

      <section className="ui-card ui-card-pad">
        <h2 className="mb-3 text-base font-semibold text-slate-900">학생 정보</h2>
        {students.length === 0 ? (
          <p className="ui-empty">등록된 학생이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {students.map((s) => (
              <li key={s.id} className="ui-card ui-card-compact">
                <div className="grid gap-1 text-base text-slate-700 sm:grid-cols-2">
                  <span><span className="text-slate-700">이름</span> · {s.name}</span>
                  <span><span className="text-slate-700">학교</span> · {s.schoolId ? schoolMap.get(s.schoolId) ?? '학교 정보 없음' : '미배정'}</span>
                  <span><span className="text-slate-700">전화번호</span> · {s.phone ?? '-'}</span>
                  <span><span className="text-slate-700">기본요금</span> · {s.feeAmount.toLocaleString()}원</span>
                  <span className="sm:col-span-2 flex flex-wrap items-center gap-2">
                    <span className="text-slate-700">탑승위치</span>
                    {s.pickupPoint ? (
                      s.routeId ? (
                        <Link
                          href={`/dashboard/route?highlight=${encodeURIComponent(s.pickupPoint)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 active:scale-95"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor"/>
                          </svg>
                          {s.pickupPoint}
                        </Link>
                      ) : (
                        <span>· {s.pickupPoint}</span>
                      )
                    ) : (
                      <span>· -</span>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ui-card ui-card-pad space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">연도별 입금 내역</h2>
          <form method="get" className="flex items-center gap-2">
            <label className="text-base text-slate-700" htmlFor="year">연도 선택</label>
            <select id="year" name="year" defaultValue={String(year)} className="ui-select w-auto py-1.5">
              {yearOptions.map((yy) => (
                <option key={yy} value={yy}>{yy}년</option>
              ))}
            </select>
            <button className="ui-btn-outline border-amber-300 bg-amber-50 py-1.5 text-base text-amber-700">조회</button>
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
                <div key={student.id} className="ui-card ui-card-compact">
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      {student.name}
                      {effectiveFee > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-500">(요금 {effectiveFee.toLocaleString()}원)</span>
                      )}
                    </h3>
                  </div>
                  {/* 모바일: 3열(월/상태/입금액) + 버튼은 별도 행 */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-1 text-sm">
                      <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center font-semibold text-slate-700">월</div>
                      <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center font-semibold text-slate-700">상태</div>
                      <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center font-semibold text-slate-700">입금액</div>
                    </div>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const monthPayments = list.filter((p) => p.targetMonth === month);
                      const paid = monthPayments
                        .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
                        .reduce((sum, p) => sum + p.amount, 0);
                      const status = effectiveFee > 0 && paid >= effectiveFee ? '완납' : paid > 0 ? '부분' : '미입금';
                      const rowBg = month === currentMonth ? 'bg-amber-50/70' : 'bg-white';
                      const statusColor = status === '완납' ? 'text-emerald-700' : status === '부분' ? 'text-amber-700' : 'text-rose-700';
                      return (
                        <div key={`${student.id}-${month}`} className="space-y-1">
                          <div className="grid grid-cols-3 gap-1 text-sm">
                            <div className={`rounded-lg border border-slate-200 px-2 py-1.5 text-center text-slate-700 ${rowBg}`}>{month}월</div>
                            <div className={`rounded-lg border border-slate-200 px-2 py-1.5 text-center font-semibold ${rowBg} ${statusColor}`}>{status}</div>
                            <div className={`rounded-lg border border-slate-200 px-2 py-1.5 text-center text-slate-700 ${rowBg}`}>{paid ? `${paid.toLocaleString()}원` : '-'}</div>
                          </div>
                          {student.schoolId && (
                            <div className={`rounded-lg border border-slate-200 px-2 py-1.5 text-center ${rowBg}`}>
                              <RequestPaymentButton studentId={student.id} schoolId={student.schoolId} year={year} month={month} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!student.schoolId && (
                    <p className="mt-2 text-sm text-slate-500">학교 배정 후 입금 확인 요청이 가능합니다.</p>
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
