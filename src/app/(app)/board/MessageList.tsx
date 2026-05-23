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

function formatRelativeTime(isoStr: string) {
  const d = new Date(isoStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000)
  if (diffDays === 0) {
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`
  }
  if (diffDays === 1) return '어제'
  return `${d.getMonth() + 1}/${d.getDate()}`
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
          return (
            <li key={c.parent_id} style={{ borderBottom: '1px solid #F2F2F7' }}>
              <Link
                href={`/board/chat/${c.parent_id}`}
                style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', background: unread ? '#FFF7E5' : '#fff', textDecoration: 'none', gap: 12 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>
                      {profile?.full_name ?? '학부모'}
                    </span>
                    <span style={{ fontSize: 13, color: '#8E8E93', flexShrink: 0 }}>{formatRelativeTime(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 15, color: unread ? '#111' : '#666', fontWeight: unread ? 700 : 400, margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
