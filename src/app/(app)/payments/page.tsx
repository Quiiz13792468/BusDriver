import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DriverPayments from './DriverPayments'
import ParentPayments from './ParentPayments'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; student?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()), 10)
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10)

  if (profile.role === 'DRIVER') {
    return <DriverPayments year={year} month={month} studentFilter={params.student} />
  }

  return <ParentPayments year={year} />
}
