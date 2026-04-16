import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PaymentCell from './PaymentCell'

interface Props {
  year: number
}

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default async function ParentPayments({ year }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const prevYear = year - 1
  const nextYear = year + 1

  // 내 자녀 목록
  const { data: childLinks } = await supabase
    .from('student_parents')
    .select('students(id, name)')
    .eq('parent_profile_id', user.id)

  const children = (childLinks ?? [])
    .map((r) => r.students as unknown as { id: string; name: string } | null)
    .filter(Boolean) as { id: string; name: string }[]

  // 연도 전체 입금 내역
  const { data: payments } = await supabase
    .from('payments')
    .select('id, student_id, amount, paid_at, status, memo, created_by_role')
    .in('student_id', children.map((c) => c.id))
    .gte('paid_at', `${year}-01-01`)
    .lte('paid_at', `${year}-12-31`)
    .order('paid_at', { ascending: false })

  // 월별 x 자녀별 맵
  const paymentMap: Record<string, Record<string, typeof payments>> = {}
  for (let m = 1; m <= 12; m++) {
    const monthKey = String(m)
    paymentMap[monthKey] = {}
    for (const child of children) {
      paymentMap[monthKey][child.id] = []
    }
  }

  for (const p of payments ?? []) {
    const m = parseInt(p.paid_at.split('-')[1], 10)
    const monthKey = String(m)
    if (paymentMap[monthKey]?.[p.student_id]) {
      paymentMap[monthKey][p.student_id]!.push(p)
    }
  }

  return (
    <div className="px-4 py-5 space-y-3">
      <h1 className="text-2xl font-bold text-black">납부내역</h1>

      {/* 연도 선택 */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3">
        <Link
          href={`/payments?year=${prevYear}`}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F2F2F7] text-lg"
        >
          ‹
        </Link>
        <span className="text-base font-semibold">{year}년</span>
        <Link
          href={`/payments?year=${nextYear}`}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F2F2F7] text-lg"
        >
          ›
        </Link>
      </div>

      {!children.length ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-sm text-[#6C6C70]">연결된 자녀가 없습니다.</p>
        </div>
      ) : (
        /* 납부 테이블 (가로 스크롤) */
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-sm" style={{ minWidth: `${120 + children.length * 120}px` }}>
              <thead className="bg-[#F2F2F7]">
                <tr>
                  <th className="sticky left-0 bg-[#F2F2F7] px-3 py-3 text-left font-semibold text-[#6C6C70] w-[80px]">
                    월
                  </th>
                  {children.map((c) => (
                    <th key={c.id} className="px-3 py-3 text-center font-semibold text-[#6C6C70] whitespace-nowrap">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((label, idx) => {
                  const monthKey = String(idx + 1)
                  return (
                    <tr key={monthKey} className="border-t border-[#F2F2F7]">
                      <td className="sticky left-0 bg-white px-3 py-3 font-medium text-black whitespace-nowrap">
                        {label}
                      </td>
                      {children.map((c) => {
                        const ps = paymentMap[monthKey]?.[c.id] ?? []
                        const confirmed = ps.find((p) => p.status === 'CONFIRMED')
                        const pending = ps.find((p) => p.status === 'PENDING')
                        const disputed = ps.find((p) => p.status === 'DISPUTED')
                        const displayP = confirmed ?? pending ?? disputed ?? ps[0]

                        if (!displayP) {
                          return (
                            <td key={c.id} className="px-3 py-3 text-center text-[#C6C6C8]">
                              —
                            </td>
                          )
                        }

                        return (
                          <td key={c.id} className="px-3 py-3 text-center">
                            <PaymentCell
                              payment={{
                                id: displayP.id,
                                amount: displayP.amount,
                                paidAt: displayP.paid_at,
                                status: displayP.status,
                                memo: displayP.memo ?? null,
                              }}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
