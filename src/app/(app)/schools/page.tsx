import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SchoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') redirect('/dashboard')

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">학생관리</h1>
        <button className="h-10 px-4 rounded-full bg-[#F5A400] text-black text-sm font-semibold">
          + 학생 등록
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button className="flex-none h-9 px-4 rounded-full bg-black text-white text-sm font-medium">
          전체
        </button>
        <button className="flex-none h-9 px-4 rounded-full bg-white border border-[#C6C6C8] text-sm font-medium">
          학교별
        </button>
      </div>

      <div className="bg-white rounded-2xl divide-y divide-[#F2F2F7]">
        <p className="p-4 text-[#6C6C70] text-sm">등록된 학생이 없습니다.</p>
      </div>
    </div>
  )
}
