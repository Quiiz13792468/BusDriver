'use client'

import { useState, useTransition } from 'react'
import { updatePasswordAction } from '@/lib/actions/settings'

export default function PasswordDrawer() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const inputClass = 'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400]'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePasswordAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setOpen(false), 1200)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(false); setError(null) }}
        className="flex items-center justify-between w-full px-4 py-4 text-base text-black"
      >
        비밀번호 변경
        <span className="text-[#C6C6C8]">›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold">비밀번호 변경</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">새 비밀번호 *</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="8자 이상"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">비밀번호 확인 *</label>
                <input
                  name="confirm"
                  type="password"
                  required
                  placeholder="비밀번호 재입력"
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                  <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
                </div>
              )}
              {success && (
                <div className="px-4 py-3 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20">
                  <p className="text-sm font-medium text-[#34C759]">비밀번호가 변경되었습니다.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-14 rounded-full bg-[#F5A400] text-black text-base font-bold disabled:opacity-60"
              >
                {isPending ? '변경 중...' : '변경'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
