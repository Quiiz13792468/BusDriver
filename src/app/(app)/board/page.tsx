import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function BoardPage() {
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">게시판</h1>
          <button className="h-10 px-4 rounded-full bg-[#F5A400] text-black text-sm font-semibold">
            공지 작성
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button className="flex-none h-9 px-4 rounded-full bg-black text-white text-sm font-medium">
            공지
          </button>
          <button className="flex-none h-9 px-4 rounded-full bg-white border border-[#C6C6C8] text-sm font-medium">
            1:1 메시지
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <p className="text-[#6C6C70] text-sm">게시물이 없습니다.</p>
        </div>
      </div>
    )
  }

  // PARENT
  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="text-2xl font-bold text-black">게시판</h1>

      <section className="bg-[#F5A400]/10 border border-[#F5A400] rounded-2xl p-4">
        <p className="text-sm font-medium text-[#F5A400]">공지사항</p>
        <p className="text-[#6C6C70] text-sm mt-1">등록된 공지가 없습니다.</p>
      </section>

      <section className="bg-white rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-3">메시지</h2>
        <p className="text-[#6C6C70] text-sm">메시지가 없습니다.</p>
      </section>
    </div>
  )
}
