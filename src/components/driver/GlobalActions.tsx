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
type FuelType = 'GASOLINE' | 'DIESEL'

export default function GlobalActions({ students }: Props) {
  const [modal, setModal] = useState<ModalType>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const [fuelType, setFuelType] = useState<FuelType>('GASOLINE')

  useEffect(() => { setMounted(true) }, [])

  const today = new Date().toISOString().split('T')[0]

  const close = () => {
    setModal(null)
    setError(null)
    setFuelType('GASOLINE')
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    // 주유 모달: fuelType 상태값을 formData에 주입
    if (modal === 'fuel') {
      formData.set('fuel_type', fuelType)
    }
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
          className="h-9 px-3 rounded-full bg-transparent text-sm font-bold text-[#F5A400]"
          style={{ border: '1.5px solid #F5A400' }}
        >
          입금
        </button>
        <button
          onClick={() => { setModal('fuel'); setError(null) }}
          className="h-9 px-3 rounded-full bg-transparent text-sm font-bold text-[#F5A400]"
          style={{ border: '1.5px solid #F5A400' }}
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

              {/* 주유: 유종 선택 */}
              {modal === 'fuel' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#6C6C70]">유종</label>
                  <div className="flex gap-2">
                    {(['GASOLINE', 'DIESEL'] as FuelType[]).map((ft) => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setFuelType(ft)}
                        className={`flex-1 h-12 rounded-2xl border text-base font-medium transition-colors ${
                          fuelType === ft
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
                        }`}
                      >
                        {ft === 'GASOLINE' ? '휘발유' : '경유'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">
                  {modal === 'fuel' ? '주유 금액' : '금액'} <span className="text-[#FF3B30]">*</span>
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

              {/* 주유: 리터당 가격 */}
              {modal === 'fuel' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#6C6C70]">리터당 가격 (선택)</label>
                  <input
                    name="price_per_liter"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder="예: 1650"
                    className={inputClass}
                  />
                </div>
              )}

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
