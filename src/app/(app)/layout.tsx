import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DriverHeader from '@/components/driver/DriverHeader'
import DriverNav from '@/components/driver/DriverNav'
import ParentHeader from '@/components/parent/ParentHeader'
import ParentNav from '@/components/parent/ParentNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'ADMIN') {
    redirect('/login')
  }

  const isDriver = profile.role === 'DRIVER'

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7]">
      {isDriver
        ? <DriverHeader fullName={profile.full_name} userId={user.id} />
        : <ParentHeader fullName={profile.full_name} />
      }
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      {isDriver ? <DriverNav /> : <ParentNav />}
    </div>
  )
}
