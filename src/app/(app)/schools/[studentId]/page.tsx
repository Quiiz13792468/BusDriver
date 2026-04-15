import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentDetail from './StudentDetail'

interface Props {
  params: Promise<{ studentId: string }>
}

export default async function StudentDetailPage({ params }: Props) {
  const { studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') redirect('/dashboard')

  const { data: student } = await supabase
    .from('students')
    .select('*, schools(id, name, default_fee)')
    .eq('id', studentId)
    .eq('driver_id', user.id)
    .single()

  if (!student) notFound()

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, default_fee')
    .eq('owner_driver_id', user.id)
    .order('name')

  // 최근 입금 내역 (최신 6건)
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('id, amount, paid_at, status, memo')
    .eq('student_id', studentId)
    .order('paid_at', { ascending: false })
    .limit(6)

  return (
    <StudentDetail
      student={student}
      schools={schools ?? []}
      recentPayments={recentPayments ?? []}
    />
  )
}
