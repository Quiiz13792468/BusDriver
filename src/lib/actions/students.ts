'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function registerStudentAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') return { error: '권한이 없습니다.' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: '학생 이름을 입력해주세요.' }

  const schoolId = formData.get('school_id') as string || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const parentName = (formData.get('parent_name') as string)?.trim() || null
  const parentPhone = (formData.get('parent_phone') as string)?.trim() || null
  const rideType = (formData.get('ride_type') as string) || 'BOTH'
  const paymentDayRaw = formData.get('payment_day') as string
  const paymentDay = paymentDayRaw ? parseInt(paymentDayRaw, 10) : null
  const customFeeRaw = formData.get('custom_fee') as string
  const customFee = customFeeRaw ? parseInt(customFeeRaw, 10) : null
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null

  const { error } = await supabase.from('students').insert({
    driver_id: user.id,
    school_id: schoolId || null,
    name,
    phone,
    parent_name: parentName,
    parent_phone: parentPhone,
    ride_type: rideType,
    payment_day: paymentDay,
    custom_fee: customFee,
    start_date: startDate,
    end_date: endDate,
    is_active: true,
  })

  if (error) return { error: '학생 등록에 실패했습니다.' }

  revalidatePath('/schools')
  return { error: null }
}

export async function updateStudentAction(studentId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: '학생 이름을 입력해주세요.' }

  const schoolId = formData.get('school_id') as string || null
  const phone = (formData.get('phone') as string)?.trim() || null
  const parentName = (formData.get('parent_name') as string)?.trim() || null
  const parentPhone = (formData.get('parent_phone') as string)?.trim() || null
  const rideType = (formData.get('ride_type') as string) || 'BOTH'
  const paymentDayRaw = formData.get('payment_day') as string
  const paymentDay = paymentDayRaw ? parseInt(paymentDayRaw, 10) : null
  const customFeeRaw = formData.get('custom_fee') as string
  const customFee = customFeeRaw ? parseInt(customFeeRaw, 10) : null
  const startDate = (formData.get('start_date') as string) || null
  const endDate = (formData.get('end_date') as string) || null

  const { error } = await supabase
    .from('students')
    .update({
      school_id: schoolId || null,
      name,
      phone,
      parent_name: parentName,
      parent_phone: parentPhone,
      ride_type: rideType,
      payment_day: paymentDay,
      custom_fee: customFee,
      start_date: startDate,
      end_date: endDate,
    })
    .eq('id', studentId)
    .eq('driver_id', user.id)

  if (error) return { error: '학생 정보 수정에 실패했습니다.' }

  revalidatePath(`/schools/${studentId}`)
  revalidatePath('/schools')
  return { error: null }
}

export async function deactivateStudentAction(studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('students')
    .update({ is_active: false })
    .eq('id', studentId)
    .eq('driver_id', user.id)

  if (error) return { error: '이용 정지 처리에 실패했습니다.' }

  revalidatePath('/schools')
  return { error: null }
}
