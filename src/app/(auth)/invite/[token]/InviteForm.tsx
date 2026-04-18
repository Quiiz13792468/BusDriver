'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { consumeInviteTokenAction } from '@/lib/actions/auth'

interface Props {
  token: string
  role: 'DRIVER' | 'PARENT'
}

export default function InviteForm({ token, role }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !loginId.trim() || !password || !fullName.trim()) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (loginId.length < 4) {
      setError('아이디는 4자 이상이어야 합니다.')
      return
    }

    startTransition(async () => {
      const result = await consumeInviteTokenAction(
        token,
        email.trim(),
        password,
        loginId.trim(),
        fullName.trim(),
        phone.trim() || undefined,
      )
      if (result?.error) {
        setError(result.error)
        return
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

  const inputClass =
    'w-full h-14 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-base font-semibold text-black mb-2">가입 정보 입력</p>

      {/* 이름 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#6C6C70]" htmlFor="full_name">
          이름 <span className="text-[#FF3B30]">*</span>
        </label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="실명을 입력하세요"
          className={inputClass}
        />
      </div>

      {/* 이메일 (비밀번호 찾기용) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#6C6C70]" htmlFor="email">
          이메일 <span className="text-[#FF3B30]">*</span>
          <span className="text-xs text-[#6C6C70] ml-1">(비밀번호 찾기용)</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className={inputClass}
        />
      </div>

      {/* 로그인 아이디 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#6C6C70]" htmlFor="login_id">
          로그인 아이디 <span className="text-[#FF3B30]">*</span>
          <span className="text-xs text-[#6C6C70] ml-1">(4자 이상)</span>
        </label>
        <input
          id="login_id"
          type="text"
          autoCapitalize="none"
          autoComplete="username"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value.toLowerCase().replace(/\s/g, ''))}
          placeholder="영문, 숫자 조합"
          className={inputClass}
        />
      </div>

      {/* 비밀번호 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#6C6C70]" htmlFor="password">
          비밀번호 <span className="text-[#FF3B30]">*</span>
          <span className="text-xs text-[#6C6C70] ml-1">(8자 이상)</span>
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className={inputClass}
        />
      </div>

      {/* 비밀번호 확인 */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#6C6C70]" htmlFor="password_confirm">
          비밀번호 확인 <span className="text-[#FF3B30]">*</span>
        </label>
        <input
          id="password_confirm"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호를 다시 입력하세요"
          className={`${inputClass} ${
            passwordConfirm && password !== passwordConfirm
              ? 'border-[#FF3B30] focus:border-[#FF3B30] focus:ring-[#FF3B30]/20'
              : ''
          }`}
        />
      </div>

      {/* 전화번호 (선택) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#6C6C70]" htmlFor="phone">
          전화번호 <span className="text-xs">(선택)</span>
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-0000-0000"
          className={inputClass}
        />
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
          <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
        </div>
      )}

      {/* 가입 버튼 */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-14 rounded-full bg-[#F5A400] text-black text-lg font-bold disabled:opacity-60 transition-opacity mt-2"
      >
        {isPending ? '가입 중...' : '가입하기'}
      </button>
    </form>
  )
}
