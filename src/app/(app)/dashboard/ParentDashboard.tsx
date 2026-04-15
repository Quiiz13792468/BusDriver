import { createClient } from '@/lib/supabase/server'

function formatKRW(amount: number) {
  return amount.toLocaleString('ko-KR') + '원'
}

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`
  const toDate = `${year}-${String(month).padStart(2, '0')}-31`

  // 내 자녀 목록
  const { data: childLinks } = await supabase
    .from('student_parents')
    .select('students(id, name, custom_fee, payment_day, schools(default_fee))')
    .eq('parent_profile_id', user.id)

  const children = (childLinks ?? [])
    .map((r) => r.students as unknown as { id: string; name: string; custom_fee: number | null; payment_day: number | null; schools: { default_fee: number } | null } | null)
    .filter(Boolean)

  // 이번달 납부 현황
  const { data: payments } = await supabase
    .from('payments')
    .select('student_id, amount, status')
    .in('student_id', children.map((c) => c!.id))
    .gte('paid_at', fromDate)
    .lte('paid_at', toDate)

  // 알림
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, kind, is_read, created_at')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const totalConfirmed = (payments ?? [])
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((s, p) => s + p.amount, 0)

  const kindLabel: Record<string, string> = {
    PAYMENT_CONFIRM_REQUEST: '입금 등록 알림',
    PAYMENT_DISPUTE: '수정 요청',
    PAYMENT_CONFIRMED: '입금 확정',
    BOARD_REPLY: '게시판 답글',
    BOARD_NOTICE: '공지사항',
  }

  return (
    <div className="px-4 py-5 space-y-3">
      <h1 className="text-2xl font-bold text-black">홈</h1>

      {/* 자녀 현황 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">자녀 현황</h2>
        </div>
        {!children.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">연결된 자녀가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {children.map((c) => {
              if (!c) return null
              const fee = c.schools?.default_fee || c.custom_fee || 0
              const childPayments = (payments ?? []).filter((p) => p.student_id === c.id)
              const confirmed = childPayments.filter((p) => p.status === 'CONFIRMED').reduce((s, p) => s + p.amount, 0)
              const pending = childPayments.some((p) => p.status === 'PENDING')
              return (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-black">{c.name}</span>
                    <span className={`text-sm font-semibold ${confirmed >= fee ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                      {confirmed >= fee ? '납부완료' : `미납 ${formatKRW(fee - confirmed)}`}
                    </span>
                  </div>
                  {pending && (
                    <p className="text-xs text-[#FF6B00] mt-0.5">확인 대기 중인 입금이 있습니다</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 이번달 납부 현황 */}
      <section className="bg-white rounded-2xl px-4 py-4">
        <h2 className="text-base font-semibold text-black mb-2">이번달 납부 현황</h2>
        <p className="text-3xl font-bold text-black">{formatKRW(totalConfirmed)}</p>
        <p className="text-sm text-[#6C6C70] mt-1">{year}년 {month}월 확정 납부 합계</p>
      </section>

      {/* 알림 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">알림</h2>
        </div>
        {!notifications?.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">새로운 알림이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {notifications.map((n) => (
              <li key={n.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#F5A400] flex-none" />
                <span className="text-sm text-black">{kindLabel[n.kind] ?? n.kind}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
