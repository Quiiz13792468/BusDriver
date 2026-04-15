import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DriverBoard from './DriverBoard'
import ParentBoard from './ParentBoard'

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; school?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const params = await searchParams

  if (profile.role === 'DRIVER') {
    return <DriverBoard userId={user.id} tab={params.tab ?? 'notices'} schoolFilter={params.school} />
  }

  return <ParentBoard userId={user.id} />
}
