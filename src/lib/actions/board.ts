'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createNoticeAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') return { error: '권한이 없습니다.' }

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()
  const schoolId = (formData.get('school_id') as string) || null

  if (!title) return { error: '제목을 입력해주세요.' }
  if (!content) return { error: '내용을 입력해주세요.' }

  const { error } = await supabase.from('board_posts').insert({
    driver_id: user.id,
    school_id: schoolId,
    title,
    content,
    audience: schoolId ? 'SCHOOL' : 'ALL',
  })

  if (error) return { error: '공지 등록에 실패했습니다.' }

  revalidatePath('/board')
  return { error: null }
}

export async function sendMessageAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: '프로필을 찾을 수 없습니다.' }

  const content = (formData.get('content') as string)?.trim()
  const replyToId = (formData.get('reply_to_id') as string) || null
  const taggedStudentId = (formData.get('tagged_student_id') as string) || null

  if (!content) return { error: '메시지를 입력해주세요.' }

  let driverId: string
  let parentId: string

  if (profile.role === 'DRIVER') {
    driverId = user.id
    parentId = formData.get('parent_id') as string
  } else {
    parentId = user.id
    driverId = formData.get('driver_id') as string
  }

  if (!driverId || !parentId) return { error: '대화 상대를 찾을 수 없습니다.' }

  const { error } = await supabase.from('board_messages').insert({
    driver_id: driverId,
    parent_id: parentId,
    sender_id: user.id,
    content,
    reply_to_id: replyToId,
    tagged_student_id: taggedStudentId,
  })

  if (error) return { error: '메시지 전송에 실패했습니다.' }

  revalidatePath(`/board/chat/${profile.role === 'DRIVER' ? parentId : driverId}`)
  return { error: null }
}
