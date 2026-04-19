import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function formatKRW(amount: number) {
  return amount.toLocaleString('ko-KR') + '원'
}

function getTodayDate() {
  return new Date().getDate()
}

function getCurrentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export default async function DriverDashboard() {
  const supabase = await createClient()
  const today = getTodayDate()
  const { year, month } = getCurrentYearMonth()
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`
  const toDate = `${year}-${String(month).padStart(2, '0')}-31`

  // 병렬 조회
  const [todayStudents, overduePayments, pendingPayments, monthlyTotal] = await Promise.all([
    // 오늘 입금 예정 (payment_day = 오늘)
    supabase
      .from('students')
      .select('id, name, school_id, custom_fee, schools(default_fee)')
      .eq('is_active', true)
      .eq('payment_day', today),

    // 미납: 이번달 입금일 지났으나 CONFIRMED 없는 학생
    supabase
      .from('students')
      .select('id, name, payment_day, custom_fee, schools(default_fee)')
      .eq('is_active', true)
      .not('payment_day', 'is', null)
      .lt('payment_day', today),

    // 입금확인 요청: PARENT가 등록한 PENDING
    supabase
      .from('payments')
      .select('id, amount, paid_at, students(name)')
      .eq('status', 'PENDING')
      .eq('created_by_role', 'PARENT')
      .order('created_at', { ascending: false })
      .limit(10),

    // 이번달 확정 입금 합계
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'CONFIRMED')
      .gte('paid_at', fromDate)
      .lte('paid_at', toDate),
  ])

  const monthlySum = (monthlyTotal.data ?? []).reduce((s, r) => s + r.amount, 0)

  // 미납 학생 필터: 이번달 CONFIRMED 없는 경우
  const { data: confirmedThisMonth } = await supabase
    .from('payments')
    .select('student_id')
    .eq('status', 'CONFIRMED')
    .gte('paid_at', fromDate)
    .lte('paid_at', toDate)

  const confirmedIds = new Set((confirmedThisMonth ?? []).map((r) => r.student_id))
  const overdueList = (overduePayments.data ?? []).filter(
    (s) => !confirmedIds.has(s.id)
  )

  return (
    <div className="px-4 py-5 space-y-3">
      {/* 헤더: 홈 + 이번달 입금 요약 */}
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-black">홈</h1>
        <Link
          href="/payments"
          className="flex flex-col items-end leading-tight"
          aria-label={`${year}년 ${month}월 확정 입금 합계 ${formatKRW(monthlySum)}`}
        >
          <span className="text-[11px] text-[#6C6C70]">{month}월 확정 입금</span>
          <span className="text-xl font-bold text-[#34C759]">{formatKRW(monthlySum)}</span>
        </Link>
      </div>

      {/* 오늘 입금 예정 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">오늘 입금 예정</h2>
          <span className="text-sm font-bold text-[#F5A400]">
            {todayStudents.data?.length ?? 0}명
          </span>
        </div>
        {!todayStudents.data?.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">오늘 입금 예정 학생이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {todayStudents.data.map((s) => {
              const fee = (s.schools as unknown as { default_fee: number } | null)?.default_fee || s.custom_fee || 0
              return (
                <li key={s.id}>
                  <Link
                    href={`/schools/${s.id}`}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-base text-black">{s.name}</span>
                    <span className="text-base font-semibold text-[#34C759]">
                      {formatKRW(fee)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 미납 알림 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">미납 알림</h2>
          {overdueList.length > 0 && (
            <span className="text-sm font-bold text-[#FF3B30]">{overdueList.length}명</span>
          )}
        </div>
        {!overdueList.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">미납 학생이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {overdueList.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/schools/${s.id}`}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-base text-black">{s.name}</span>
                  <span className="text-sm text-[#FF3B30] font-medium">
                    {s.payment_day}일 미납
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 입금확인 요청 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">입금확인 요청</h2>
          {(pendingPayments.data?.length ?? 0) > 0 && (
            <span className="text-sm font-bold text-[#5856D6]">
              {pendingPayments.data!.length}건
            </span>
          )}
        </div>
        {!pendingPayments.data?.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">새로운 요청이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {pendingPayments.data.map((p) => {
              const student = p.students as unknown as { name: string } | null
              return (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-base text-black">{student?.name ?? '—'}</span>
                  <div className="text-right">
                    <p className="text-base font-semibold">{formatKRW(p.amount)}</p>
                    <p className="text-xs text-[#6C6C70]">{p.paid_at}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

    </div>
  )
}
