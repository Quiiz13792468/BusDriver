'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { registerPaymentAction, registerFuelAction } from '@/lib/actions/payments'

interface Student {
  id: string
  name: string
}

interface Props {
  students: Student[]
}

type ModalType = 'payment' | 'fuel' | null

export default function GlobalActions({ students }: Props) {
  const [modal, setModal] = useState<ModalType>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const today = new Date().toISOString().split('T')[0]

  const close = () => {
    setModal(null)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const action = modal === 'payment' ? registerPaymentAction : registerFuelAction
      const result = await action(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        close()
      }
    })
  }

  const inputClass =
    'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'

  return (
    <>
      {/* 글로벌 액션 버튼 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setModal('payment'); setError(null) }}
          className="h-9 px-3 rounded-full bg-[#F5A400] text-black text-sm font-semibold"
        >
          입금
        </button>
        <button
          onClick={() => { setModal('fuel'); setError(null) }}
          className="h-9 px-3 rounded-full bg-white border border-[#C6C6C8] text-sm font-semibold text-black"
        >
          주유
        </button>
      </div>

      {/* 모달 (portal로 body에 렌더링하여 stacking context 탈출) */}
      {modal && mounted && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold text-black">
                {modal === 'payment' ? '입금 등록' : '주유 등록'}
              </h2>
              <button
                onClick={close}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
              {modal === 'payment' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#6C6C70]">
                    학생 <span className="text-[#FF3B30]">*</span>
                  </label>
                  <select name="student_id" required
                    className="w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400]"
                  >
                    <option value="">학생 선택</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">
                  금액 <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  name="amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  required
                  placeholder="0"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">
                  {modal === 'payment' ? '입금일' : '날짜'} <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  name={modal === 'payment' ? 'paid_at' : 'fueled_at'}
                  type="date"
                  defaultValue={today}
                  required
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">메모</label>
                <input
                  name="memo"
                  type="text"
                  placeholder="메모 (선택사항)"
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
                {isPending ? '등록 중...' : '등록'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
