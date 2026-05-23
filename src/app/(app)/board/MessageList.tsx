'use client'
// 1:1 대화 목록 — 아바타 없음, 읽지 않은 메시지 노란 배경

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
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 16px', margin: '0 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: '#8E8E93' }}>메시지가 없습니다.</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff' }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {conversations.map((c, i) => {
          const profile = c.profiles as { full_name?: string } | null
          const unread = !c.is_read
          const d = new Date(c.created_at)
          const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일`
          return (
            <li key={c.parent_id} style={{ borderBottom: i < conversations.length - 1 ? '1px solid #F2F2F7' : 'none' }}>
              <Link
                href={`/board/chat/${c.parent_id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: unread ? '#FFF7E5' : '#fff', textDecoration: 'none' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#000' }}>
                      {profile?.full_name ?? '학부모'}
                    </span>
                    <span style={{ fontSize: 13, color: '#8E8E93', flexShrink: 0, marginLeft: 8 }}>{dateStr}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#6C6C70', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</p>
                </div>
                {unread && (
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: '#FF3B30', flexShrink: 0, marginLeft: 10 }} />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
