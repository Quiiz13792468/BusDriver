import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatView from './ChatView'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { userId: otherUserId } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isDriver = profile.role === 'DRIVER'
  const driverId = isDriver ? user.id : otherUserId
  const parentId = isDriver ? otherUserId : user.id

  // 상대방 이름 조회
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', otherUserId)
    .single()

  // 메시지 목록 (오름차순)
  const { data: messages } = await supabase
    .from('board_messages')
    .select(`
      id, sender_id, content, created_at, is_read, reply_to_id,
      tagged_student_id,
      students(name)
    `)
    .eq('driver_id', driverId)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true })

  // 상대방이 보낸 안 읽은 메시지 읽음 처리
  await supabase
    .from('board_messages')
    .update({ is_read: true })
    .eq('driver_id', driverId)
    .eq('parent_id', parentId)
    .eq('sender_id', otherUserId)
    .eq('is_read', false)

  // DRIVER인 경우 학부모의 학생 목록 조회 (메시지 태그용)
  let students: { id: string; name: string }[] = []
  if (isDriver) {
    const { data: sp } = await supabase
      .from('student_parents')
      .select('students(id, name)')
      .eq('parent_profile_id', parentId)
    students = (sp ?? [])
      .map((r) => (r.students as unknown as { id: string; name: string } | null))
      .filter(Boolean) as { id: string; name: string }[]
  }

  return (
    <ChatView
      currentUserId={user.id}
      otherName={otherProfile?.full_name ?? (isDriver ? '학부모' : '버스기사')}
      driverId={driverId}
      parentId={parentId}
      isDriver={isDriver}
      messages={(messages ?? []).map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
        isRead: m.is_read,
        replyToId: m.reply_to_id,
        taggedStudentName: (m.students as unknown as { name: string } | null)?.name ?? null,
      }))}
      students={students}
    />
  )
}
