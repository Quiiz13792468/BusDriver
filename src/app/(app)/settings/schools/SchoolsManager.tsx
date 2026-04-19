'use client'

import { useState, useTransition } from 'react'
import { updateSchoolAction } from '@/lib/actions/schools'

interface School {
  id: string
  name: string
  default_fee: number
}

interface Props {
  schools: School[]
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function SchoolsManager({ schools }: Props) {
  const [editTarget, setEditTarget] = useState<School | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // 로컬 상태로 낙관적 업데이트
  const [localSchools, setLocalSchools] = useState<School[]>(schools)

  const inputClass =
    'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'

  const handleClose = () => {
    setEditTarget(null)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editTarget) return
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateSchoolAction(editTarget.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        // 로컬 상태 갱신
        const newName = (formData.get('name') as string).trim()
        const newFee = parseInt(formData.get('default_fee') as string, 10) || 0
        setLocalSchools((prev) =>
          prev.map((s) =>
            s.id === editTarget.id ? { ...s, name: newName, default_fee: newFee } : s
          )
        )
        handleClose()
      }
    })
  }

  return (
    <>
      {localSchools.length === 0 ? (
        <div className="bg-white rounded-2xl px-4 py-6 text-center">
          <p className="text-sm text-[#6C6C70]">등록된 학교가 없습니다.</p>
          <p className="text-xs text-[#C6C6C8] mt-1">학생 등록 시 학교를 함께 추가하세요.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl divide-y divide-[#F2F2F7]">
          {localSchools.map((school) => (
            <button
              key={school.id}
              onClick={() => { setEditTarget(school); setError(null) }}
              className="flex items-center justify-between w-full px-4 py-4 text-left"
            >
              <div>
                <p className="text-base font-medium text-black">{school.name}</p>
                <p className="text-sm text-[#6C6C70] mt-0.5">
                  기본 이용금액: {school.default_fee ? formatKRW(school.default_fee) : '미설정'}
                </p>
              </div>
              <span className="text-[#C6C6C8] text-lg">›</span>
            </button>
          ))}
        </div>
      )}

      {/* 편집 모달 */}
      {editTarget && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold text-black">학교 편집</h2>
              <button
                onClick={handleClose}
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
                  defaultValue={editTarget.name}
                  placeholder="학교명"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">기본 이용금액</label>
                <input
                  name="default_fee"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={editTarget.default_fee || ''}
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
                {isPending ? '저장 중...' : '저장'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
