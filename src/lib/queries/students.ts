import { createClient } from '@/lib/supabase/server'
import type { StudentWithSchool } from '@/types/database'

/** DRIVER: 내 학생 목록 조회 (inactive 제외) */
export async function getMyStudents(schoolId?: string): Promise<StudentWithSchool[]> {
  const supabase = await createClient()

  let query = supabase
    .from('students')
    .select(`
      *,
      school:schools(id, name, default_fee)
    `)
    .eq('is_active', true)
    .order('name')

  if (schoolId) {
    query = query.eq('school_id', schoolId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as StudentWithSchool[]
}

/** DRIVER: 학생 상세 조회 */
export async function getStudentById(studentId: string): Promise<StudentWithSchool | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      school:schools(id, name, default_fee)
    `)
    .eq('id', studentId)
    .single()

  if (error) return null
  return data as StudentWithSchool
}

/** PARENT: 내 자녀 목록 조회 */
export async function getMyChildren(): Promise<StudentWithSchool[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('student_parents')
    .select(`
      student:students(
        *,
        school:schools(id, name, default_fee)
      )
    `)
    .order('linked_at')

  if (error) throw error
  return (data?.map((r: { student: unknown }) => r.student).filter(Boolean) ?? []) as StudentWithSchool[]
}

/** 오늘 입금 예정 학생 (payment_day = 오늘 날짜) */
export async function getTodayPaymentStudents(): Promise<StudentWithSchool[]> {
  const supabase = await createClient()
  const today = new Date().getDate()

  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      school:schools(id, name, default_fee)
    `)
    .eq('is_active', true)
    .eq('payment_day', today)
    .order('name')

  if (error) throw error
  return (data ?? []) as StudentWithSchool[]
}
