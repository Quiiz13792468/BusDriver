import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logoutAction } from '@/lib/actions/auth'
import ProfileEditDrawer from './ProfileEditDrawer'
import PasswordDrawer from './PasswordDrawer'
import InviteDrawer from './InviteDrawer'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, full_name, phone, login_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isDriver = profile.role === 'DRIVER'


  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="text-2xl font-bold text-black">설정</h1>

      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl px-4 py-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#F5A400]/20 flex items-center justify-center text-xl font-bold text-[#F5A400] flex-none">
          {profile.full_name?.[0] ?? '?'}
        </div>
        <div>
          <p className="text-lg font-bold text-black">{profile.full_name}</p>
          <p className="text-sm text-[#6C6C70]">{profile.login_id}</p>
          <p className="text-xs text-[#C6C6C8] mt-0.5">
            {isDriver ? '버스기사' : '학부모'}
          </p>
        </div>
      </div>

      {/* 계정 설정 */}
      <div className="bg-white rounded-2xl divide-y divide-[#F2F2F7]">
        <ProfileEditDrawer
          fullName={profile.full_name ?? ''}
          phone={profile.phone ?? null}
        />
        <PasswordDrawer />
      </div>

      {/* DRIVER 전용 */}
      {isDriver && (
        <div className="bg-white rounded-2xl divide-y divide-[#F2F2F7]">
          <InviteDrawer />
        </div>
      )}

      {/* 로그아웃 */}
      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full h-14 rounded-full bg-white border border-[#FF3B30] text-[#FF3B30] text-base font-semibold"
        >
          로그아웃
        </button>
      </form>

      {/* 앱 버전 */}
      <p className="text-center text-xs text-[#C6C6C8]">BusDriver v2.0</p>
    </div>
  )
}
