import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  userId: string
}

export default async function ParentBoard({ userId }: Props) {
  const supabase = await createClient()

  // 내 자녀의 driver_id 조회
  const { data: childLinks } = await supabase
    .from('student_parents')
    .select('students(driver_id, schools(id))')
    .eq('parent_profile_id', userId)

  const driverIds = [...new Set(
    (childLinks ?? [])
      .map((r) => (r.students as unknown as { driver_id: string } | null)?.driver_id)
      .filter(Boolean) as string[]
  )]

  const schoolIds = [...new Set(
    (childLinks ?? [])
      .flatMap((r) => {
        const s = r.students as unknown as { schools: { id: string } | null } | null
        return s?.schools?.id ? [s.schools.id] : []
      })
  )]

  // 공지 조회
  const { data: notices } = await supabase
    .from('board_posts')
    .select('id, title, content, created_at, driver_id')
    .in('driver_id', driverIds.length ? driverIds : [''])
    .order('created_at', { ascending: false })
    .limit(5)

  // 내 메시지 대화 목록
  const { data: msgs } = await supabase
    .from('board_messages')
    .select('id, driver_id, content, created_at, is_read, profiles!board_messages_driver_id_fkey(full_name)')
    .eq('parent_id', userId)
    .order('created_at', { ascending: false })

  const seen = new Set<string>()
  const conversations = (msgs ?? []).filter((m) => {
    if (seen.has(m.driver_id)) return false
    seen.add(m.driver_id)
    return true
  })

  return (
    <div className="px-4 py-5 space-y-3">
      <h1 className="text-2xl font-bold text-black">게시판</h1>

      {/* 공지 배너 */}
      {(notices ?? []).length > 0 && (
        <section className="bg-white rounded-2xl overflow-hidden">
          <div className="bg-[#F5A400]/10 px-4 py-2 border-b border-[#F5A400]/20">
            <p className="text-sm font-semibold text-[#F5A400]">📢 공지사항</p>
          </div>
          <ul className="divide-y divide-[#F2F2F7]">
            {notices!.map((n) => (
              <li key={n.id} className="px-4 py-3">
                <p className="text-base font-medium text-black">{n.title}</p>
                <p className="text-sm text-[#6C6C70] mt-0.5 line-clamp-2">{n.content}</p>
                <p className="text-xs text-[#6C6C70] mt-1">
                  {new Date(n.created_at).toLocaleDateString('ko-KR')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 1:1 메시지 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">메시지</h2>
        </div>
        {!conversations.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">메시지가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {conversations.map((c) => {
              const profile = c.profiles as unknown as { full_name?: string } | null
              return (
                <li key={c.driver_id}>
                  <Link
                    href={`/board/chat/${c.driver_id}`}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F5A400]/20 flex items-center justify-center text-base font-bold text-[#F5A400] flex-none">
                      {profile?.full_name?.[0] ?? '기'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-black truncate">
                          {profile?.full_name ?? '버스기사'}
                        </p>
                        <p className="text-xs text-[#6C6C70] flex-none ml-2">
                          {new Date(c.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <p className="text-sm text-[#6C6C70] truncate mt-0.5">{c.content}</p>
                    </div>
                    {!c.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F5A400] flex-none" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
