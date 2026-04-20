import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import SchoolsManager from './SchoolsManager'
import SchoolRegisterButton from '@/app/(app)/schools/SchoolRegisterButton'

export default async function SettingsSchoolsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DRIVER') redirect('/settings')

  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, default_fee')
    .eq('owner_driver_id', user.id)
    .order('name')

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/settings" className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-black">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </a>
          <h1 className="text-2xl font-bold text-black">학교 관리</h1>
        </div>
        <SchoolRegisterButton />
      </div>
      <SchoolsManager schools={schools ?? []} />
    </div>
  )
}
