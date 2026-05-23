// 게시판 화면 — 1:1 대화 / 전체 공지 탭, 디자인 목업 기준

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NoticeWriteButton from './NoticeWriteButton'
import MessageList from './MessageList'

interface Props {
  userId: string
  tab: string
  schoolFilter?: string
}

function formatKoDate(isoStr: string) {
  const d = new Date(isoStr)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default async function DriverBoard({ userId, tab, schoolFilter }: Props) {
  const supabase = await createClient()

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .eq('owner_driver_id', userId)
    .order('name')

  // 읽지 않은 메시지 수 (탭 배지용)
  const { count: unreadCount } = await supabase
    .from('board_messages')
    .select('*', { count: 'exact', head: true })
    .eq('driver_id', userId)
    .eq('is_read', false)

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

  let conversations = null
  if (tab === 'messages') {
    const { data: msgs } = await supabase
      .from('board_messages')
      .select('id, parent_id, content, created_at, is_read, profiles!board_messages_parent_id_fkey(full_name)')
      .eq('driver_id', userId)
      .order('created_at', { ascending: false })

    const seen = new Set<string>()
    conversations = (msgs ?? []).filter((m) => {
      if (seen.has(m.parent_id)) return false
      seen.add(m.parent_id)
      return true
    })
  }

  return (
    <div>
      {/* 탭 바 — 항상 앰버 하단 선 */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1.5px solid #F5A400', position: 'sticky', top: 56, zIndex: 40 }}>
        {[
          { key: 'messages', label: '1:1 대화', badge: unreadCount ?? 0 },
          { key: 'notices', label: '전체 공지', badge: 0 },
        ].map(t => (
          <Link key={t.key} href={`/board?tab=${t.key}`}
            style={{
              flex: 1, textAlign: 'center', padding: '13px 0', fontSize: 17,
              fontWeight: tab === t.key ? 800 : 500,
              textDecoration: 'none',
              color: tab === t.key ? '#F5A400' : '#8E8E93',
              borderBottom: tab === t.key ? '2.5px solid #F5A400' : '2.5px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              position: 'relative',
            }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: '#FF3B30', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {t.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* 1:1 대화 탭 */}
      {tab === 'messages' && (
        <div style={{ padding: '8px 0' }}>
          <MessageList conversations={conversations ?? []} role="DRIVER" />
        </div>
      )}

      {/* 전체 공지 탭 */}
      {tab === 'notices' && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ marginBottom: 10 }}>
            <NoticeWriteButton schools={schools ?? []} driverId={userId} />
          </div>

          {(schools ?? []).length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10, paddingBottom: 2 }}>
              <Link href="/board?tab=notices"
                style={{ flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 18, border: `1.5px solid ${!schoolFilter ? '#000' : '#C6C6C8'}`, background: !schoolFilter ? '#000' : '#fff', color: !schoolFilter ? '#fff' : '#6C6C70', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                전체
              </Link>
              {schools!.map(s => (
                <Link key={s.id} href={`/board?tab=notices&school=${s.id}`}
                  style={{ flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 18, border: `1.5px solid ${schoolFilter === s.id ? '#000' : '#C6C6C8'}`, background: schoolFilter === s.id ? '#000' : '#fff', color: schoolFilter === s.id ? '#fff' : '#6C6C70', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  {s.name}
                </Link>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {!notices?.length ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: '32px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: '#8E8E93' }}>작성된 공지가 없습니다.</p>
              </div>
            ) : (
              notices.map(n => (
                <div key={n.id} style={{ background: '#F5A40015', borderRadius: 14, padding: '16px 16px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#8E8E93', fontWeight: 600 }}>{formatKoDate(n.created_at)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#F5A400', borderRadius: 6, padding: '2px 8px' }}>전체공지</span>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                  <p style={{ fontSize: 15, color: '#444', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
