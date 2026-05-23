'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withActionLog } from '@/lib/dev-logger/server-logger'

export const loginAction = withActionLog('loginAction', async (
  loginId: string,
  role: 'DRIVER' | 'PARENT',
  password: string,
) => {
  try {
    const adminClient = createAdminClient()

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('login_id', loginId)
      .eq('role', role)
      .single()

    if (profileError || !profile) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }

    const { data: userData } = await adminClient.auth.admin.getUserById(profile.id)
    if (!userData?.user?.email) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    })

    if (signInError) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }
  } catch (e) {
    console.error('[loginAction] error:', e)
    return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }

  return {}
})

// redirect()를 사용하므로 withActionLog 제외
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export const consumeInviteTokenAction = withActionLog('consumeInviteTokenAction', async (
  token: string,
  email: string,
  password: string,
  loginId: string,
  fullName: string,
  phone?: string,
) => {
  const supabase = await createClient()

  const { error: signUpError } = await supabase.auth.signUp({ email, password })
  if (signUpError) {
    return { error: '계정 생성에 실패했습니다: ' + signUpError.message }
  }

  const { error: rpcError } = await supabase.rpc('consume_invite_token', {
    p_token: token,
    p_login_id: loginId,
    p_full_name: fullName,
    p_phone: phone ?? null,
  })

  if (rpcError) {
    if (rpcError.code === '23505') {
      return { error: '이미 사용 중인 아이디입니다.' }
    }
    if (rpcError.message?.includes('token_expired')) {
      return { error: '초대 링크가 만료되었습니다.' }
    }
    if (rpcError.message?.includes('token_already_used')) {
      return { error: '이미 사용된 초대 링크입니다.' }
    }
    return { error: '가입 처리 중 오류가 발생했습니다.' }
  }

  return {}
})
