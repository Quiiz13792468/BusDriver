import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NoticeWriteButton from './NoticeWriteButton'
import MessageList from './MessageList'

interface Props {
  userId: string
  tab: string
  schoolFilter?: string
}

export default async function DriverBoard({ userId, tab, schoolFilter }: Props) {
  const supabase = await createClient()

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .eq('owner_driver_id', userId)
    .order('name')

  let notices = null
  if (tab === 'notices') {
    let q = supabase
      .from('board_posts')
      .select('id, title, content, audience, created_at, schools(name)')
      .eq('driver_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (schoolFilter) q = q.eq('school_id', schoolFilter)
    const { data } = await q
    notices = data
  }

  // 1:1 채팅 상대방 목록 (최근 메시지 기준)
  let conversations = null
  if (tab === 'messages') {
    const { data: msgs } = await supabase
      .from('board_messages')
      .select('id, parent_id, content, created_at, is_read, profiles!board_messages_parent_id_fkey(full_name)')
      .eq('driver_id', userId)
      .order('created_at', { ascending: false })

    // 학부모별 최신 메시지만
    const seen = new Set<string>()
    conversations = (msgs ?? []).filter((m) => {
      if (seen.has(m.parent_id)) return false
      seen.add(m.parent_id)
      return true
    })
  }

  return (
    <div className="px-4 py-5 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">게시판</h1>
        {tab === 'notices' && (
          <NoticeWriteButton schools={schools ?? []} driverId={userId} />
        )}
      </div>

      {/* 탭 */}
      <div className="flex justify-start gap-2">
        <Link
          href="/board?tab=notices"
          className={`inline-flex items-center justify-center h-9 px-4 rounded-full text-sm font-medium border ${
            tab === 'notices' ? 'bg-black text-white border-black' : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
          }`}
        >
          공지
        </Link>
        <Link
          href="/board?tab=messages"
          className={`inline-flex items-center justify-center h-9 px-4 rounded-full text-sm font-medium border ${
            tab === 'messages' ? 'bg-black text-white border-black' : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
          }`}
        >
          1:1 메시지
        </Link>
      </div>

      {/* 공지 탭 */}
      {tab === 'notices' && (
        <>
          {(schools ?? []).length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              <Link
                href="/board?tab=notices"
                className={`flex-none h-9 px-4 rounded-full text-sm font-medium border whitespace-nowrap ${
                  !schoolFilter ? 'bg-black text-white border-black' : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
                }`}
              >
                전체
              </Link>
              {schools!.map((s) => (
                <Link
                  key={s.id}
                  href={`/board?tab=notices&school=${s.id}`}
                  className={`flex-none h-9 px-4 rounded-full text-sm font-medium border whitespace-nowrap ${
                    schoolFilter === s.id ? 'bg-black text-white border-black' : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
                  }`}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl overflow-hidden">
            {!notices?.length ? (
              <p className="px-4 py-8 text-center text-sm text-[#6C6C70]">작성된 공지가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-[#F2F2F7]">
                {notices.map((n) => {
                  const school = n.schools as unknown as { name: string } | null
                  return (
                    <li key={n.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-black truncate">{n.title}</p>
                          <p className="text-sm text-[#6C6C70] mt-0.5 line-clamp-2">{n.content}</p>
                        </div>
                        <div className="text-right flex-none">
                          {school && (
                            <p className="text-xs text-[#5856D6]">{school.name}</p>
                          )}
                          <p className="text-xs text-[#6C6C70] mt-0.5">
                            {new Date(n.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {/* 1:1 메시지 탭 */}
      {tab === 'messages' && (
        <MessageList conversations={conversations ?? []} role="DRIVER" />
      )}
    </div>
  )
}
