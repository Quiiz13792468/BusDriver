'use client'

import Link from 'next/link'

interface Conversation {
  id: string
  parent_id: string
  content: string
  created_at: string
  is_read: boolean
  profiles: unknown
}

interface Props {
  conversations: Conversation[]
  role: 'DRIVER' | 'PARENT'
}

export default function MessageList({ conversations, role }: Props) {
  if (!conversations.length) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <p className="text-sm text-[#6C6C70]">메시지가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <ul className="divide-y divide-[#F2F2F7]">
        {conversations.map((c) => {
          const profile = c.profiles as { full_name?: string } | null
          return (
            <li key={c.parent_id}>
              <Link
                href={`/board/chat/${c.parent_id}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#F2F2F7] flex items-center justify-center text-base font-bold text-[#6C6C70] flex-none">
                  {profile?.full_name?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-black truncate">
                      {profile?.full_name ?? '학부모'}
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
    </div>
  )
}
