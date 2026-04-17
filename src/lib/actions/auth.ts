'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * login_id + role + password → 서버에서 직접 signIn (쿠키 Set-Cookie로 확실히 설정)
 */
export async function loginAction(
  loginId: string,
  role: 'DRIVER' | 'PARENT',
  password: string,
): Promise<{ error?: string }> {
  try {
    // 1. admin client로 login_id + role → email 조회 (RLS 우회)
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

    // 2. 서버 클라이언트로 signIn → Set-Cookie 헤더로 세션 쿠키 설정
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password,
    })

    if (signInError) {
      return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }
    }

    return {}
  } catch (e) {
    console.error('[loginAction] error:', e)
    return { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function consumeInviteTokenAction(
  token: string,
  email: string,
  password: string,
  loginId: string,
  fullName: string,
  phone?: string,
) {
  const supabase = await createClient()

  // 1. Supabase Auth 계정 생성
  const { error: signUpError } = await supabase.auth.signUp({ email, password })
  if (signUpError) {
    return { error: '계정 생성에 실패했습니다: ' + signUpError.message }
  }

  // 2. 토큰 소비 + profiles 생성
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

  redirect('/dashboard')
}
