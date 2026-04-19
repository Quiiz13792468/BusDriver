'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerPaymentAction } from '@/lib/actions/payments'

interface ModalData {
  studentId: string
  studentName: string
  month: number
  year: number
  defaultAmount: number
}

interface Props {
  data: ModalData
  onClose: () => void
}

export default function MatrixRegisterModal({ data, onClose }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 해당 월의 기본 날짜: year-month-01
  const defaultDate = `${data.year}-${String(data.month).padStart(2, '0')}-01`

  const inputClass =
    'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('student_id', data.studentId)
    startTransition(async () => {
      const result = await registerPaymentAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
          <div>
            <h2 className="text-lg font-bold text-black">입금 등록</h2>
            <p className="text-sm text-[#6C6C70] mt-0.5">
              {data.studentName} · {data.year}년 {data.month}월
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
          {/* 금액 (프리필) */}
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
              defaultValue={data.defaultAmount || ''}
              placeholder="0"
              className={inputClass}
            />
          </div>

          {/* 입금일 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6C6C70]">
              입금일 <span className="text-[#FF3B30]">*</span>
            </label>
            <input
              name="paid_at"
              type="date"
              required
              defaultValue={defaultDate}
              className={inputClass}
            />
          </div>

          {/* 메모 */}
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
    </div>
  )
}
