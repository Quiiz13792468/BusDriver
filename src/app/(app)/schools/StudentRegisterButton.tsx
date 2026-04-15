'use client'

import { useState, useTransition } from 'react'
import { registerStudentAction } from '@/lib/actions/students'

interface School {
  id: string
  name: string
}

interface Props {
  schools: School[]
  driverId: string
}

export default function StudentRegisterButton({ schools, driverId }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await registerStudentAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  const inputClass =
    'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'
  const selectClass =
    'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400]'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 rounded-full bg-[#F5A400] text-black text-sm font-semibold"
      >
        + 학생 등록
      </button>

      {/* 드로어 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* 오버레이 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* 드로어 본문 */}
          <div className="relative w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold text-black">학생 등록</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
              {/* 학교 선택 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">학교</label>
                <select name="school_id" className={selectClass}>
                  <option value="">학교 선택 (선택사항)</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* 학생 이름 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">
                  학생 이름 <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="홍길동"
                  className={inputClass}
                />
              </div>

              {/* 학생 전화번호 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">학생 전화번호</label>
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="010-0000-0000"
                  className={inputClass}
                />
              </div>

              {/* 학부모 이름 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">학부모 이름</label>
                <input
                  name="parent_name"
                  type="text"
                  placeholder="홍부모"
                  className={inputClass}
                />
              </div>

              {/* 학부모 전화번호 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">학부모 전화번호</label>
                <input
                  name="parent_phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="010-0000-0000"
                  className={inputClass}
                />
              </div>

              {/* 이용 타입 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">이용 구분</label>
                <select name="ride_type" defaultValue="BOTH" className={selectClass}>
                  <option value="BOTH">등하교</option>
                  <option value="MORNING">등교만</option>
                  <option value="AFTERNOON">하교만</option>
                </select>
              </div>

              {/* 입금일 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">매월 입금일</label>
                <input
                  name="payment_day"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  placeholder="예: 25"
                  className={inputClass}
                />
              </div>

              {/* 개별 이용금액 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">
                  개별 이용금액
                  <span className="text-xs text-[#6C6C70] ml-1">(비워두면 학교 기본금액 적용)</span>
                </label>
                <input
                  name="custom_fee"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="학교 기본금액 사용"
                  className={inputClass}
                />
              </div>

              {/* 시작일 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#6C6C70]">시작일</label>
                  <input name="start_date" type="date" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#6C6C70]">종료일</label>
                  <input name="end_date" type="date" className={inputClass} />
                </div>
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
                {isPending ? '등록 중...' : '학생 등록'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
