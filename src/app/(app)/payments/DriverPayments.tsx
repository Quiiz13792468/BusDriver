import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  year: number
  month: number
  studentFilter?: string
}

const statusLabel: Record<string, string> = {
  CONFIRMED: '확정',
  PENDING: '확인 중',
  DISPUTED: '수정 요청',
}
const statusColor: Record<string, string> = {
  CONFIRMED: 'text-[#34C759]',
  PENDING: 'text-[#FF6B00]',
  DISPUTED: 'text-[#FF3B30]',
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default async function DriverPayments({ year, month, studentFilter }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`
  const toDate = `${year}-${String(month).padStart(2, '0')}-31`

  // 월별 이동 계산
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  // 학생 목록 (필터용)
  const { data: students } = await supabase
    .from('students')
    .select('id, name')
    .eq('driver_id', user.id)
    .eq('is_active', true)
    .order('name')

  // 입금 내역
  let payQuery = supabase
    .from('payments')
    .select('id, amount, paid_at, status, memo, created_by_role, students(id, name)')
    .eq('driver_id', user.id)
    .gte('paid_at', fromDate)
    .lte('paid_at', toDate)
    .order('paid_at', { ascending: false })

  if (studentFilter) {
    payQuery = payQuery.eq('student_id', studentFilter)
  }

  const { data: payments } = await payQuery

  // 이번달 확정 합계
  const monthlySum = (payments ?? [])
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((s, p) => s + p.amount, 0)

  // 주유 내역
  const { data: fuelRecords } = await supabase
    .from('fuel_records')
    .select('id, amount, fueled_at, memo')
    .eq('driver_id', user.id)
    .gte('fueled_at', fromDate)
    .lte('fueled_at', toDate)
    .order('fueled_at', { ascending: false })

  const fuelSum = (fuelRecords ?? []).reduce((s, r) => s + r.amount, 0)

  return (
    <div className="px-4 py-5 space-y-3">
      <h1 className="text-2xl font-bold text-black">장부</h1>

      {/* 월 선택 */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3">
        <Link
          href={`/payments?year=${prevYear}&month=${prevMonth}${studentFilter ? `&student=${studentFilter}` : ''}`}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F2F2F7] text-lg"
        >
          ‹
        </Link>
        <span className="text-base font-semibold">{year}년 {MONTHS[month - 1]}</span>
        <Link
          href={`/payments?year=${nextYear}&month=${nextMonth}${studentFilter ? `&student=${studentFilter}` : ''}`}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F2F2F7] text-lg"
        >
          ›
        </Link>
      </div>

      {/* 이번달 요약 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-2xl px-4 py-3">
          <p className="text-xs text-[#6C6C70]">확정 입금</p>
          <p className="text-xl font-bold text-[#34C759] mt-1">{formatKRW(monthlySum)}</p>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3">
          <p className="text-xs text-[#6C6C70]">주유 비용</p>
          <p className="text-xl font-bold text-[#FF3B30] mt-1">{formatKRW(fuelSum)}</p>
        </div>
      </div>

      {/* 학생 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        <Link
          href={`/payments?year=${year}&month=${month}`}
          className={`flex-none h-9 px-4 rounded-full text-sm font-medium border whitespace-nowrap ${
            !studentFilter ? 'bg-black text-white border-black' : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
          }`}
        >
          전체
        </Link>
        {(students ?? []).map((s) => (
          <Link
            key={s.id}
            href={`/payments?year=${year}&month=${month}&student=${s.id}`}
            className={`flex-none h-9 px-4 rounded-full text-sm font-medium border whitespace-nowrap ${
              studentFilter === s.id ? 'bg-black text-white border-black' : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
            }`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {/* 입금 내역 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">입금 내역</h2>
        </div>
        {!payments?.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">입금 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {payments.map((p) => {
              const student = p.students as unknown as { id: string; name: string } | null
              return (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-base font-medium text-black">{student?.name ?? '—'}</p>
                    <p className="text-xs text-[#6C6C70] mt-0.5">
                      {p.paid_at}
                      {p.created_by_role === 'PARENT' && (
                        <span className="ml-1 text-[#5856D6]">학부모 등록</span>
                      )}
                    </p>
                    {p.memo && <p className="text-xs text-[#6C6C70]">{p.memo}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold">{formatKRW(p.amount)}</p>
                    <p className={`text-xs font-medium ${statusColor[p.status] ?? ''}`}>
                      {statusLabel[p.status] ?? p.status}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 주유 내역 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">주유 내역</h2>
        </div>
        {!fuelRecords?.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">주유 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {fuelRecords.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-base font-medium text-black">{formatKRW(r.amount)}</p>
                  {r.memo && <p className="text-xs text-[#6C6C70] mt-0.5">{r.memo}</p>}
                </div>
                <p className="text-sm text-[#6C6C70]">{r.fueled_at}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
