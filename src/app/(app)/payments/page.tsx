import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PaymentsPage() {
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
        <h1 className="text-2xl font-bold text-black">장부</h1>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">이번달 매출</h2>
          <p className="text-3xl font-bold text-black">0원</p>
        </section>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">입금 내역</h2>
          <p className="text-[#6C6C70] text-sm">입금 내역이 없습니다.</p>
        </section>

        <section className="bg-white rounded-2xl p-4">
          <h2 className="text-lg font-semibold mb-3">주유 내역</h2>
          <p className="text-[#6C6C70] text-sm">주유 내역이 없습니다.</p>
        </section>
      </div>
    )
  }

  // PARENT: 납부내역
  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="text-2xl font-bold text-black">납부내역</h1>

      <div className="flex items-center gap-2">
        <button className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-[#C6C6C8]">
          ‹
        </button>
        <span className="text-base font-semibold">2026년</span>
        <button className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-[#C6C6C8]">
          ›
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F2F2F7]">
              <tr>
                <th className="sticky left-0 bg-[#F2F2F7] px-3 py-3 text-left font-semibold text-[#6C6C70]">
                  월
                </th>
                <th className="px-3 py-3 text-center font-semibold text-[#6C6C70] whitespace-nowrap">
                  첫째
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#F2F2F7]">
                <td className="sticky left-0 bg-white px-3 py-4 font-medium">1월</td>
                <td className="px-3 py-4 text-center text-[#6C6C70]">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
