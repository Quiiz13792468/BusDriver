import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logoutAction } from '@/lib/actions/auth'
import Link from 'next/link'
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
    <div style={{ padding: '20px 0 24px', background: '#F2F2F7', minHeight: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111', margin: '0 16px 18px' }}>설정</h1>

      {/* 프로필 카드 */}
      <div style={{ margin: '0 14px 18px', background: '#fff', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: '#F5A400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {profile.full_name?.[0] ?? '?'}
        </div>
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>{profile.full_name}</p>
          <p style={{ fontSize: 14, color: '#6C6C70', margin: '0 0 2px' }}>{profile.login_id}</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#F5A400', margin: 0 }}>
            {isDriver ? '버스기사' : '학부모'}
          </p>
        </div>
      </div>

      {/* 계정 설정 */}
      <div style={{ margin: '0 14px 14px', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <ProfileEditDrawer
          fullName={profile.full_name ?? ''}
          phone={profile.phone ?? null}
        />
        <div style={{ height: 1, background: '#F2F2F7', margin: '0 16px' }} />
        <PasswordDrawer />
      </div>

      {/* DRIVER 전용 */}
      {isDriver && (
        <div style={{ margin: '0 14px 14px', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
          <Link
            href="/settings/schools"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 16px', minHeight: 56, fontSize: 18, fontWeight: 500, color: '#111', textDecoration: 'none' }}
          >
            학교 관리
            <span style={{ color: '#C6C6C8', fontSize: 20 }}>›</span>
          </Link>
          <div style={{ height: 1, background: '#F2F2F7', margin: '0 16px' }} />
          <InviteDrawer />
        </div>
      )}

      {/* 로그아웃 */}
      <form action={logoutAction} style={{ margin: '0 14px 0' }}>
        <button
          type="submit"
          style={{ width: '100%', minHeight: 54, borderRadius: 14, background: 'transparent', border: '1.5px solid #FF3B30', color: '#FF3B30', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
        >
          로그아웃
        </button>
      </form>

      {/* 앱 버전 */}
      <p style={{ textAlign: 'center', fontSize: 12, color: '#C6C6C8', marginTop: 18 }}>BusDriver v2.0</p>
    </div>
  )
}
