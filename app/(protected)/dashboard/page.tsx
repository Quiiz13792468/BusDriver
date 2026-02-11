import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { getAlerts } from '@/lib/data/alert';
import { getSchools } from '@/lib/data/school';
import { getAllPayments, getPaymentsByStudent } from '@/lib/data/payment';
import { getAllStudents, getStudentsByParent } from '@/lib/data/student';
import { DashboardIcon, SchoolIcon, RouteIcon, WalletIcon, BoardIcon } from '@/components/layout/nav-icons';
import { PageHeader } from '@/components/layout/page-header';
import { RequestPaymentButton } from '@/components/request-payment-button';
import { MonthControls } from '@/app/(protected)/dashboard/_components/month-controls';
import { LinkWithLoading } from '@/components/link-with-loading';
import { AlertPanel } from '@/app/(protected)/dashboard/_components/alert-panel';
import { UiTable, UiTbody, UiTh, UiThead, UiTr, UiTd } from '@/components/ui/table';
import { AdSlot } from '@/components/ads/ad-slot';

type Props = { searchParams?: Record<string, string | string[] | undefined> };

export default async function DashboardPage({ searchParams }: Props) {
  const session = await requireSession();
  const role = session.user?.role;
  const name = session.user?.name ?? '사용자';

  if (role === 'ADMIN') {
    return AdminDashboard({ name, searchParams });
  }

  return ParentDashboard({ name, userId: session.user!.id, searchParams });
}

async function AdminDashboard({ name, searchParams }: { name: string; searchParams?: Record<string, string | string[] | undefined> }) {
  const [alerts, schools, students, payments] = await Promise.all([
    getAlerts(),
    getSchools(),
    getAllStudents(),
    getAllPayments()
  ]);

  const today = new Date();
  const yParam = arrayFirst(searchParams?.year);
  const mParam = arrayFirst(searchParams?.month);
  const typeParam = (arrayFirst(searchParams?.atype) || 'ALL') as 'ALL' | 'PAYMENT' | 'INQUIRY' | 'ROUTE_CHANGE';
  const y = yParam ? Number(yParam) : today.getFullYear();
  const m = mParam ? Number(mParam) : today.getMonth() + 1;

  const schoolMap = new Map(schools.map((s) => [s.id, s.name]));
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
    const status = total === st.feeAmount ? '입금완료' : '금액부족';
    const shortage = Math.max(0, (st.feeAmount ?? 0) - total);
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
  const totalExpectedAll = students.reduce((sum, st) => sum + (st.feeAmount ?? 0), 0);
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
    let shortage = 0;
    let count = 0;
    for (const st of students) {
      const agg = byStudent.get(st.id) ?? { paid: 0, partial: 0 };
      const total = agg.paid + agg.partial;
      const diff = Math.max(0, (st.feeAmount ?? 0) - total);
      shortage += diff;
      if (diff > 0) count += 1;
    }
    const totalAmount = Math.max(0, totalExpectedAll - (totalPaid + totalPartial));
    return { month, paid: totalPaid, partial: totalPartial, shortage, count, totalAmount };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={`${name}님 환영합니다. 빠른 이동, 최근 알림, 이번 달 입금 현황을 확인하세요.`}
      />

      {/* 빠른 이동 4카드 */}
      <section>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <DashLink href="/schools" title="학교/학생 관리" desc="학교, 학생 정보 관리" Icon={SchoolIcon} color="from-amber-400 via-yellow-400 to-amber-500" />
          <DashLink href="/routes" title="노선 관리" desc="노선/정차 지점 관리" Icon={RouteIcon} color="from-yellow-400 via-amber-400 to-yellow-500" />
          <DashLink href="/payments" title="입금 현황" desc="월별·학생별 입금 현황" Icon={WalletIcon} color="from-amber-300 via-yellow-400 to-amber-400" />
          <DashLink href="/board" title="문의 게시판" desc="문의 확인 및 답변" Icon={BoardIcon} color="from-yellow-300 via-amber-300 to-yellow-400" />
        </div>
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
        <div className="flex items-center justify-between">
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
        <div className="ui-table-wrap">
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{y} 실적</h2>
        </div>
        <div className="ui-table-wrap">
          <UiTable>
            <UiThead className="bg-slate-50">
              <UiTr>
                <UiTh className="px-[0.3rem]">월</UiTh>
                <UiTh className="px-[0.3rem]">입금액</UiTh>
                <UiTh className="px-[0.3rem]">부분입금액</UiTh>
                <UiTh className="px-[0.3rem]">총 금액</UiTh>
                <UiTh className="px-[0.3rem]">부족금액</UiTh>
                <UiTh className="px-[0.3rem]">학생수</UiTh>
              </UiTr>
            </UiThead>
            <UiTbody>
              {monthlyStats.map((stat) => (
                <UiTr key={stat.month}>
                  <UiTd className="px-[0.3rem] text-center text-slate-800">{stat.month}월</UiTd>
                  <UiTd className="px-[0.3rem] text-right text-emerald-600">{stat.paid.toLocaleString()}원</UiTd>
                  <UiTd className="px-[0.3rem] text-right text-amber-600">{stat.partial.toLocaleString()}원</UiTd>
                  <UiTd className="px-[0.3rem] text-right font-semibold text-slate-800">{stat.totalAmount.toLocaleString()}원</UiTd>
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
    </div>
  );
}

function DashLink({ href, title, desc, Icon, color = 'from-amber-400 to-yellow-400' }: { href: string; title: string; desc: string; Icon?: any; color?: string }) {
  return (
    <LinkWithLoading
      href={href}
      className="group ui-card ui-card-compact transition hover:border-amber-200 hover:bg-amber-50/70"
    >
      <div className={`mb-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${color} px-2 py-1 text-base font-semibold text-slate-900/90`}
      >
        {Icon ? <Icon className="h-4 w-4 text-slate-800/70" /> : null}
        <span>{title}</span>
      </div>
      <div className="text-base text-slate-700">{desc}</div>
    </LinkWithLoading>
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
  const paymentsByStudent = await Promise.all(
    students.map(async (student) => ({
      student,
      payments: await getPaymentsByStudent(student.id)
    }))
  );
  const today = new Date();
  const yearParam = arrayFirst(searchParams?.year);
  const selectedYear = yearParam ? Number(yearParam) : today.getFullYear();
  const yearSet = new Set<number>([today.getFullYear()]);
  paymentsByStudent.forEach(({ payments }) => payments.forEach((p) => yearSet.add(p.targetYear)));
  const yearOptions = Array.from(yearSet).sort((a, b) => b - a);
  const year = Number.isInteger(selectedYear) ? selectedYear : today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={`${name}님 환영합니다. 학생 정보 확인, 탑승지점 변경 요청, 문의 등록을 할 수 있습니다.`}
      />

      <section>
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/dashboard/pickup" className="ui-card ui-card-compact transition hover:border-amber-200 hover:bg-amber-50/60 md:flex md:h-[120px] md:flex-col md:justify-center">
            <div className="mb-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 px-2 py-1 text-base font-semibold text-slate-900/90">
              <RouteIcon className="h-4 w-4 text-slate-800/70" />
              <span>탑승지점 변경 요청</span>
            </div>
            <p className="text-base text-slate-700">학생의 탑승 위치 변경을 요청합니다.</p>
          </Link>

          <Link href="/board" className="ui-card ui-card-compact transition hover:border-amber-200 hover:bg-amber-50/60 md:flex md:h-[120px] md:flex-col md:justify-center">
            <div className="mb-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 px-2 py-1 text-base font-semibold text-slate-900/90">
              <BoardIcon className="h-4 w-4 text-slate-800/70" />
              <span>문의 게시판</span>
            </div>
            <p className="text-base text-slate-700">관리자에게 문의를 등록합니다.</p>
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
                  <span className="sm:col-span-2"><span className="text-slate-700">탑승위치</span> · {s.pickupPoint ?? '-'}</span>
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
              const list = payments.filter((p) => p.targetYear === year);
              return (
                <div key={student.id} className="ui-card ui-card-compact">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{student.name}</h3>
                      <p className="text-sm text-slate-700">
                        {student.schoolId ? schoolMap.get(student.schoolId) ?? '학교 정보 없음' : '미배정'} · 기본요금 {student.feeAmount.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-base">
                    <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-center font-semibold text-slate-700 flex items-center justify-center">월</div>
                    <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-center font-semibold text-slate-700 flex items-center justify-center">상태</div>
                    <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-center font-semibold text-slate-700 flex items-center justify-center">입금액</div>
                    <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-center font-semibold text-slate-700 flex items-center justify-center">입금 확인 요청</div>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const monthPayments = list.filter((p) => p.targetMonth === month);
                      const paid = monthPayments
                        .filter((p) => p.status === 'PAID' || p.status === 'PARTIAL')
                        .reduce((sum, p) => sum + p.amount, 0);
                      const status = paid >= student.feeAmount ? '완납' : paid > 0 ? '부분 입금' : '미입금';
                      const rowBg = month === currentMonth ? 'bg-amber-50/70' : 'bg-white';
                      return (
                        <div key={`${student.id}-${month}`} className="contents">
                          <div className={`rounded-lg border border-slate-200 px-3 py-1.5 text-center text-slate-700 flex items-center justify-center ${rowBg}`}>{month}월</div>
                          <div className={`rounded-lg border border-slate-200 px-3 py-1.5 text-center font-semibold flex items-center justify-center ${rowBg} ${status === '완납' ? 'text-emerald-700' : status === '부분 입금' ? 'text-amber-700' : 'text-rose-700'}`}>{status}</div>
                          <div className={`rounded-lg border border-slate-200 px-3 py-1.5 text-center text-slate-700 flex items-center justify-center ${rowBg}`}>{paid ? `${paid.toLocaleString()}원` : '-'}</div>
                          <div className={`rounded-lg border border-slate-200 px-3 py-1.5 text-center flex items-center justify-center ${rowBg}`}>
                            {student.schoolId ? (
                              <RequestPaymentButton studentId={student.id} schoolId={student.schoolId} year={year} month={month} />
                            ) : (
                              <span className="text-sm text-slate-600">배정 후 가능</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
