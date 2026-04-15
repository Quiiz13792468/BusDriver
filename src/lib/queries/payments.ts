import { createClient } from '@/lib/supabase/server'
import type { Payment, PaymentWithStudent } from '@/types/database'

/** DRIVER: 전체 입금 내역 (월별 필터) */
export async function getPaymentsByDriver(year: number, month?: number): Promise<PaymentWithStudent[]> {
  const supabase = await createClient()

  const from = `${year}-${String(month ?? 1).padStart(2, '0')}-01`
  const to = month
    ? `${year}-${String(month).padStart(2, '0')}-31`
    : `${year}-12-31`

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      student:students(id, name)
    `)
    .gte('paid_at', from)
    .lte('paid_at', to)
    .order('paid_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PaymentWithStudent[]
}

/** DRIVER: 학생별 입금 내역 */
export async function getPaymentsByStudent(studentId: string): Promise<Payment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', studentId)
    .order('paid_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/** DRIVER: PENDING 상태 입금 목록 (입금확인 요청) */
export async function getPendingPayments(): Promise<PaymentWithStudent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      student:students(id, name)
    `)
    .eq('status', 'PENDING')
    .eq('created_by_role', 'PARENT')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PaymentWithStudent[]
}

/** 이번달 총 입금액 */
export async function getMonthlyTotal(year: number, month: number): Promise<number> {
  const supabase = await createClient()

  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-31`

  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'CONFIRMED')
    .gte('paid_at', from)
    .lte('paid_at', to)

  if (error) throw error
  return (data ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0)
}

/** PARENT: 자녀 입금 내역 (연도별) */
export async function getChildPaymentsByYear(studentId: string, year: number): Promise<Payment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', studentId)
    .gte('paid_at', `${year}-01-01`)
    .lte('paid_at', `${year}-12-31`)
    .order('paid_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
