import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/lib/actions/auth'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const driverItems = [
    { label: '프로필 수정', href: '#' },
    { label: '비밀번호 변경', href: '#' },
    { label: '학교 관리', href: '#' },
    { label: '초대 링크 생성', href: '#' },
    { label: '알림 설정', href: '#' },
    { label: '나의 포인트', href: '#' },
  ]

  const parentItems = [
    { label: '프로필 수정', href: '#' },
    { label: '비밀번호 변경', href: '#' },
    { label: '버스기사 전화', href: '#' },
    { label: '알림 설정', href: '#' },
    { label: '나의 포인트', href: '#' },
  ]

  const items = profile.role === 'DRIVER' ? driverItems : parentItems

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="text-2xl font-bold text-black">설정</h1>

      <div className="bg-white rounded-2xl divide-y divide-[#F2F2F7]">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center justify-between px-4 py-4 text-base text-black"
          >
            {item.label}
            <span className="text-[#C6C6C8]">›</span>
          </a>
        ))}
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full h-14 rounded-full bg-white border border-[#FF3B30] text-[#FF3B30] text-base font-semibold"
        >
          로그아웃
        </button>
      </form>
    </div>
  )
}
