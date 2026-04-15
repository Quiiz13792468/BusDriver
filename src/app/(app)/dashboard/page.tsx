import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.role === 'DRIVER') {
    return (
      <div className="px-4 py-5 space-y-4">
        <h1 className="text-2xl font-bold text-black">홈</h1>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">오늘 입금 예정</h2>
          <p className="text-[#6C6C70] text-sm">오늘 입금 예정 학생이 없습니다.</p>
        </section>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">미납 알림</h2>
          <p className="text-[#6C6C70] text-sm">미납 학생이 없습니다.</p>
        </section>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">입금확인 요청</h2>
          <p className="text-[#6C6C70] text-sm">새로운 요청이 없습니다.</p>
        </section>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">이번달 입금 요약</h2>
          <p className="text-[#6C6C70] text-sm">이번달 입금 내역이 없습니다.</p>
        </section>
      </div>
    )
  }

  // PARENT
  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="text-2xl font-bold text-black">홈</h1>

      <section className="bg-white rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-3">자녀 현황</h2>
        <p className="text-[#6C6C70] text-sm">연결된 자녀가 없습니다.</p>
      </section>

      <section className="bg-white rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-3">이번달 납부 현황</h2>
        <p className="text-[#6C6C70] text-sm">납부 내역이 없습니다.</p>
      </section>

      <section className="bg-white rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-3">알림</h2>
        <p className="text-[#6C6C70] text-sm">새로운 알림이 없습니다.</p>
      </section>
    </div>
  )
}
