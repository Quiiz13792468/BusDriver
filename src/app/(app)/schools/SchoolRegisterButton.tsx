'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { createSchoolAction } from '@/lib/actions/schools'

export default function SchoolRegisterButton() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createSchoolAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  const inputClass =
    'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null) }}
        className="h-10 px-4 rounded-full bg-white border border-[#F5A400] text-[#F5A400] text-sm font-semibold"
      >
        + 학교
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold text-black">학교 등록</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">
                  학교명 <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="예: 중앙초등학교"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">
                  기본 이용금액
                  <span className="text-xs text-[#6C6C70] ml-1">(학생 개별금액보다 우선)</span>
                </label>
                <input
                  name="default_fee"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={0}
                  placeholder="0"
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
                {isPending ? '등록 중...' : '학교 등록'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
