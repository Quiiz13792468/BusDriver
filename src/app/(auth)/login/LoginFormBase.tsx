'use client'

// role prop을 받아 역할별 로그인 폼과 비밀번호 찾기 화면을 렌더링하는 공유 컴포넌트

import { useState, useTransition } from 'react'
import { loginAction } from '@/lib/actions/auth'
import ForgotPassword from './ForgotPassword'

type Role = 'DRIVER' | 'PARENT'

const CONFIG: Record<Role, { title: string; sub: string; icon: string; accent: string }> = {
  DRIVER: { title: '셔틀 콕!', sub: '통학버스 운영 관리', icon: '🚌', accent: '#F5A400' },
  PARENT: { title: '셔틀 콕!', sub: '자녀 통학 알림 · 입금 관리', icon: '🎒', accent: '#007AFF' },
}

export default function LoginFormBase({ role }: { role: Role }) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showForgot, setShowForgot] = useState(false)

  const { title, sub, icon, accent } = CONFIG[role]

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} accent={accent} />
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!loginId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }

    startTransition(async () => {
      const result = await loginAction(loginId, role, password)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      window.location.href = '/dashboard'
    })
  }

  const inputCls =
    'w-full bg-[#F2F2F7] rounded-xl px-4 text-lg border-[1.5px] border-[#E5E5EA] text-[#111] outline-none focus:border-[#aaa] h-14 box-border'

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F2F7] px-6 pb-7">
      {/* 로고 */}
      <div className="pt-[60px] pb-9 text-center">
        <div className="text-[76px] leading-none mb-3">{icon}</div>
        <div className="text-[28px] font-black text-[#111] tracking-tight mb-1">{title}</div>
        <div className="text-sm text-[#8E8E93] font-medium">{sub}</div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="flex-1">
          {/* 아이디 */}
          <div className="mb-4">
            <label className="block text-[15px] font-semibold text-[#333] mb-2" htmlFor="login_id">
              아이디
            </label>
            <input
              id="login_id"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디 또는 전화번호 (- 제외)"
              className={inputCls}
            />
          </div>

          {/* 비밀번호 */}
          <div className="mb-[10px]">
            <label className="block text-[15px] font-semibold text-[#333] mb-2" htmlFor="password">
              비밀번호
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className={`${inputCls} pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#8E8E93] min-h-[44px] px-3"
              >
                {showPw ? '숨김' : '표시'}
              </button>
            </div>
          </div>

          {/* 비밀번호 찾기 */}
          <div className="text-right mb-6">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-[#8E8E93] underline py-1.5"
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
              <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20">
              <p className="text-sm font-medium text-[#34C759]">로그인 성공! 정보를 불러오고 있습니다...</p>
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isPending || success}
            style={{ background: accent, boxShadow: `0 3px 10px ${accent}50` }}
            className="w-full h-[60px] text-white rounded-[14px] text-[19px] font-black disabled:opacity-60"
          >
            {success ? '로그인 성공!' : isPending ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {/* 푸터 */}
        <div className="mt-7 pt-[18px] border-t border-[#E5E5EA]">
          <div className="text-center text-sm text-[#8E8E93] leading-relaxed">
            <span style={{ color: accent }} className="font-bold">
              초대 링크
            </span>
            를 통해 가입해주세요
          </div>
          <div className="mt-[18px] text-center text-xs text-[#8E8E93]">
            <span>이용약관</span>
            <span className="mx-2 text-[#E5E5EA]">|</span>
            <span>개인정보 처리방침</span>
          </div>
        </div>
      </form>
    </div>
  )
}
