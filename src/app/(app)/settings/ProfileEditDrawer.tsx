'use client'

import { useState, useTransition } from 'react'
import { updateProfileAction } from '@/lib/actions/settings'

interface Props {
  fullName: string
  phone: string | null
}

export default function ProfileEditDrawer({ fullName, phone }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const inputClass = 'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400]'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfileAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full px-4 py-4 text-base text-black"
      >
        프로필 수정
        <span className="text-[#C6C6C8]">›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold">프로필 수정</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">이름 *</label>
                <input
                  name="full_name"
                  type="text"
                  required
                  defaultValue={fullName}
                  placeholder="이름"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">전화번호</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={phone ?? ''}
                  placeholder="010-0000-0000"
                  inputMode="tel"
                  className={inputClass}
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                  <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-14 rounded-full bg-[#F5A400] text-black text-base font-bold disabled:opacity-60"
              >
                {isPending ? '저장 중...' : '저장'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
