import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DriverHeader from '@/components/driver/DriverHeader'
import DriverNav from '@/components/driver/DriverNav'
import ParentHeader from '@/components/parent/ParentHeader'
import ParentNav from '@/components/parent/ParentNav'
import AdBanner from '@/components/ads/AdBanner'
import AdSidebar from '@/components/ads/AdSidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
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
      {/* 데스크톱: 콘텐츠 + 우측 사이드바 / 모바일: 단일 열 */}
      <div className="flex flex-1">
        <main className="flex-1 pb-nav-safe min-w-0">
          {children}
        </main>
        <AdSidebar />
      </div>
      <AdBanner />
      {isDriver ? <DriverNav /> : <ParentNav />}
    </div>
  )
}
