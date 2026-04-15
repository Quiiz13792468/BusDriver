import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DriverDashboard from './DriverDashboard'
import ParentDashboard from './ParentDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.role === 'DRIVER') {
    return <DriverDashboard />
  }

  return <ParentDashboard />
}
