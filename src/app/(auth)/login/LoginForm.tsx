'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/lib/actions/auth'

type Role = 'DRIVER' | 'PARENT'

const ROLE_KEY = 'busdriver_last_role'
const SAVED_CREDS_KEY = 'busdriver_saved_creds'

export default function LoginForm() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('DRIVER')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [saveCredentials, setSaveCredentials] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  // 마지막 로그인 역할 + 저장된 자격증명 복원
  useEffect(() => {
    const lastRole = localStorage.getItem(ROLE_KEY) as Role | null
    if (lastRole) setRole(lastRole)

    const saved = localStorage.getItem(SAVED_CREDS_KEY)
    if (saved) {
      try {
        const { id, pw } = JSON.parse(saved)
        setLoginId(id ?? '')
        setPassword(pw ?? '')
        setSaveCredentials(true)
      } catch {}
    }
  }, [])

  const handleRoleChange = (r: Role) => {
    setRole(r)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!loginId.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }

    // 자격증명 저장/삭제
    if (saveCredentials) {
      localStorage.setItem(SAVED_CREDS_KEY, JSON.stringify({ id: loginId, pw: password }))
    } else {
      localStorage.removeItem(SAVED_CREDS_KEY)
    }
    localStorage.setItem(ROLE_KEY, role)

    startTransition(async () => {
      const result = await loginAction(loginId, role, password)
      if (result?.error) {
        setError(result.error)
        return
      }

      setSuccess(true)
      router.push('/dashboard')
      router.refresh()
    })
  }

  const tagline = role === 'DRIVER'
    ? { title: '셔틀콕!', sub: '내 버스를 콕! 집어 관리하자' }
    : { title: '셔틀콕!', sub: '우리 아이 셔틀버스를 콕! 집어타자' }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 타이틀 */}
      <div className="text-center pb-1">
        <h1 className="text-2xl font-bold text-black">{tagline.title}</h1>
        <p className="text-sm text-[#6C6C70] mt-1">{tagline.sub}</p>
      </div>

      {/* 역할 선택 탭 */}
      <div className="flex rounded-2xl bg-[#F2F2F7] p-1 gap-1">
        {(['DRIVER', 'PARENT'] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRoleChange(r)}
            className={`flex-1 h-11 rounded-xl text-base font-semibold transition-colors ${
              role === r
                ? 'bg-[#F5A400] text-black shadow-sm'
                : 'text-[#6C6C70]'
            }`}
          >
            {r === 'DRIVER' ? '버스기사' : '학부모'}
          </button>
        ))}
      </div>

      {/* 아이디 */}
      <div className="space-y-2">
        <label className="text-base font-medium text-black" htmlFor="login_id">
          아이디
        </label>
        <input
          id="login_id"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="아이디를 입력하세요"
          className="w-full h-14 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20"
        />
      </div>

      {/* 비밀번호 */}
      <div className="space-y-2">
        <label className="text-base font-medium text-black" htmlFor="password">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className="w-full h-14 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20"
        />
      </div>

      {/* 아이디·비밀번호 저장 */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={saveCredentials}
          onChange={(e) => setSaveCredentials(e.target.checked)}
          className="w-5 h-5 rounded accent-[#F5A400]"
        />
        <span className="text-base text-[#6C6C70]">아이디·비밀번호 저장</span>
      </label>

      {/* 성공 메시지 */}
      {success && (
        <div className="px-4 py-3 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20">
          <p className="text-sm font-medium text-[#34C759]">로그인 성공! 정보를 불러오고 있습니다...</p>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
          <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
        </div>
      )}

      {/* 로그인 버튼 */}
      <button
        type="submit"
        disabled={isPending || success}
        className="w-full h-14 rounded-full bg-[#F5A400] text-black text-lg font-bold disabled:opacity-60 transition-opacity"
      >
        {success ? '로그인 성공!' : isPending ? '로그인 중...' : '로그인'}
      </button>

      {/* 하단 링크 */}
      <div className="flex justify-center gap-4 pt-1">
        <button type="button" className="text-sm text-[#6C6C70]">
          아이디 찾기
        </button>
        <span className="text-[#C6C6C8]">|</span>
        <button type="button" className="text-sm text-[#6C6C70]">
          비밀번호 찾기
        </button>
      </div>
    </form>
  )
}
