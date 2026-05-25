import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import StudentMgmtClient from './StudentMgmtClient'

export default async function SchoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') redirect('/dashboard')

  const { data: schools } = await adminClient
    .from('schools')
    .select('id, name, default_fee')
    .eq('owner_driver_id', user.id)
    .order('name')

  const { data: studentsRaw } = await adminClient
    .from('students')
    .select('id, name, grade, ride_type, payment_day, custom_fee, school_id, phone, parent_name, parent_phone, start_date, end_date, is_active, schools(id, name, default_fee)')
    .eq('driver_id', user.id)
    .order('name')

  const students = (studentsRaw ?? []).map(s => ({
    ...s,
    schools: s.schools as unknown as { id: string; name: string; default_fee: number | null } | null,
  }))

  return <StudentMgmtClient students={students} schools={schools ?? []} />
}
