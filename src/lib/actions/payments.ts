'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function registerPaymentAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const studentId = formData.get('student_id') as string
  const amount = parseInt(formData.get('amount') as string, 10)
  const paidAt = formData.get('paid_at') as string
  const memo = (formData.get('memo') as string)?.trim() || null

  if (!studentId) return { error: '학생을 선택해주세요.' }
  if (!amount || amount <= 0) return { error: '금액을 올바르게 입력해주세요.' }
  if (!paidAt) return { error: '입금일을 선택해주세요.' }

  const { error } = await supabase.from('payments').insert({
    student_id: studentId,
    amount,
    paid_at: paidAt,
    memo,
    // driver_id, created_by, created_by_role은 트리거에서 자동 세팅
  })

  if (error) return { error: '입금 등록에 실패했습니다: ' + error.message }

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function registerFuelAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const amount = parseInt(formData.get('amount') as string, 10)
  const fueledAt = formData.get('fueled_at') as string
  const memo = (formData.get('memo') as string)?.trim() || null

  if (!amount || amount <= 0) return { error: '금액을 올바르게 입력해주세요.' }
  if (!fueledAt) return { error: '날짜를 선택해주세요.' }

  const { error } = await supabase.from('fuel_records').insert({
    driver_id: user.id,
    fueled_at: fueledAt,
    amount,
    memo,
  })

  if (error) return { error: '주유 등록에 실패했습니다.' }

  revalidatePath('/payments')
  return { error: null }
}

export async function confirmPaymentAction(paymentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('payments')
    .update({ status: 'CONFIRMED' })
    .eq('id', paymentId)

  if (error) return { error: '확정 처리에 실패했습니다.' }

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function disputePaymentAction(paymentId: string, memo: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('payments')
    .update({ status: 'DISPUTED', memo })
    .eq('id', paymentId)

  if (error) return { error: '수정 요청에 실패했습니다.' }

  revalidatePath('/payments')
  revalidatePath('/dashboard')
  return { error: null }
}
