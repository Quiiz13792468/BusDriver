'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createSchoolAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') return { error: '권한이 없습니다.' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: '학교명을 입력해주세요.' }

  const defaultFeeRaw = formData.get('default_fee') as string
  const defaultFee = defaultFeeRaw ? parseInt(defaultFeeRaw, 10) : 0
  if (Number.isNaN(defaultFee) || defaultFee < 0) {
    return { error: '기본 이용금액을 올바르게 입력해주세요.' }
  }

  const { error } = await supabase.from('schools').insert({
    owner_driver_id: user.id,
    name,
    default_fee: defaultFee,
  })

  if (error) return { error: '학교 등록에 실패했습니다.' }

  revalidatePath('/schools')
  return { error: null }
}

export async function updateSchoolAction(schoolId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: '학교명을 입력해주세요.' }

  const defaultFeeRaw = formData.get('default_fee') as string
  const defaultFee = defaultFeeRaw ? parseInt(defaultFeeRaw, 10) : 0
  if (Number.isNaN(defaultFee) || defaultFee < 0) {
    return { error: '기본 이용금액을 올바르게 입력해주세요.' }
  }

  const { error } = await supabase
    .from('schools')
    .update({ name, default_fee: defaultFee })
    .eq('id', schoolId)
    .eq('owner_driver_id', user.id)

  if (error) return { error: '학교 수정에 실패했습니다.' }

  revalidatePath('/schools')
  return { error: null }
}

export async function deleteSchoolAction(schoolId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: activeStudents } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .eq('is_active', true)
    .limit(1)

  if (activeStudents && activeStudents.length > 0) {
    return { error: '재학 중인 학생이 있어 삭제할 수 없습니다.' }
  }

  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', schoolId)
    .eq('owner_driver_id', user.id)

  if (error) return { error: '학교 삭제에 실패했습니다.' }

  revalidatePath('/settings/schools')
  revalidatePath('/schools')
  return { error: null }
}
