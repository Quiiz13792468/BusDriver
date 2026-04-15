import { createClient } from '@/lib/supabase/server'
import InviteForm from './InviteForm'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // 토큰 유효성 서버 사전 검증
  const { data: tokenRow, error } = await supabase
    .from('invite_tokens')
    .select('id, role, expires_at, used_at, target_student_id')
    .eq('token', token)
    .single()

  if (error || !tokenRow) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-bold text-black">초대 링크를 찾을 수 없습니다</h1>
          <p className="text-sm text-[#6C6C70]">링크가 올바른지 확인하거나 버스기사에게 새 링크를 요청하세요.</p>
        </div>
      </div>
    )
  }

  if (tokenRow.used_at) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-bold text-black">이미 사용된 초대 링크입니다</h1>
          <p className="text-sm text-[#6C6C70]">이 링크는 1회만 사용 가능합니다. 버스기사에게 새 링크를 요청하세요.</p>
        </div>
      </div>
    )
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="text-5xl">⏰</div>
          <h1 className="text-xl font-bold text-black">만료된 초대 링크입니다</h1>
          <p className="text-sm text-[#6C6C70]">유효기간이 지났습니다. 버스기사에게 새 링크를 요청하세요.</p>
        </div>
      </div>
    )
  }

  const roleLabel = tokenRow.role === 'DRIVER' ? '버스기사' : '학부모'

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🚌</div>
        <h1 className="text-2xl font-bold text-black">버스드라이버</h1>
        <p className="text-sm text-[#6C6C70] mt-1">
          <span className="font-semibold text-[#F5A400]">{roleLabel}</span>로 가입합니다
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <InviteForm token={token} role={tokenRow.role as 'DRIVER' | 'PARENT'} />
      </div>
    </div>
  )
}
