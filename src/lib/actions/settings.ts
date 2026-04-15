'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null

  if (!fullName) return { error: '이름을 입력해주세요.' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone })
    .eq('id', user.id)

  if (error) return { error: '프로필 수정에 실패했습니다.' }

  revalidatePath('/settings')
  return { error: null }
}

export async function updatePasswordAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 8) return { error: '비밀번호는 8자 이상이어야 합니다.' }
  if (password !== confirm) return { error: '비밀번호가 일치하지 않습니다.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: '비밀번호 변경에 실패했습니다.' }

  return { error: null }
}

export async function createInviteTokenAction(
  role: 'DRIVER' | 'PARENT',
  expiresHours: number,
  targetStudentId?: string | null,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.', token: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') return { error: '권한이 없습니다.', token: null }

  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('invite_tokens')
    .insert({
      role,
      created_by: user.id,
      expires_at: expiresAt,
      target_student_id: targetStudentId ?? null,
    })
    .select('token')
    .single()

  if (error || !data) return { error: '초대 링크 생성에 실패했습니다.', token: null }

  return { error: null, token: data.token as string }
}
