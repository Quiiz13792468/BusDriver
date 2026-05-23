'use client'

import { useState, useTransition } from 'react'
import { updateSchoolAction, deleteSchoolAction } from '@/lib/actions/schools'

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
  const [localSchools, setLocalSchools] = useState<School[]>(schools)

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

  const handleDelete = (school: School) => {
    if (!confirm(`"${school.name}" 학교를 삭제하시겠습니까?\n재학 중인 학생이 있으면 삭제할 수 없습니다.`)) return
    startTransition(async () => {
      const result = await deleteSchoolAction(school.id)
      if (result?.error) {
        alert(result.error)
      } else {
        setLocalSchools((prev) => prev.filter((s) => s.id !== school.id))
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
            <div
              key={school.id}
              className="flex items-center justify-between px-4 py-4"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-base font-medium text-black">{school.name}</p>
                <p className="text-sm text-[#6C6C70] mt-0.5">
                  기본 이용금액: {school.default_fee ? formatKRW(school.default_fee) : '미설정'}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => { setEditTarget(school); setError(null) }}
                  disabled={isPending}
                  className="min-w-[60px] min-h-[42px] rounded-xl bg-[#F2F2F7] text-black text-sm font-semibold disabled:opacity-60"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(school)}
                  disabled={isPending}
                  className="min-w-[60px] min-h-[42px] rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-sm font-semibold disabled:opacity-60"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 편집 모달 */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={handleClose} />
          <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 16px', borderBottom: '1px solid #F2F2F7' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111' }}>학교 편집</h2>
              <button
                onClick={handleClose}
                style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7', border: 'none', borderRadius: 22, color: '#6C6C70', fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 14, color: '#8E8E93', marginBottom: 6, display: 'block', fontWeight: 600 }}>
                  학교명 <span style={{ color: '#FF3B30' }}>*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editTarget.name}
                  placeholder="학교명"
                  style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E5EA', padding: '14px 14px', fontSize: 18, background: '#F2F2F7', outline: 'none', boxSizing: 'border-box', color: '#111', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 14, color: '#8E8E93', marginBottom: 6, display: 'block', fontWeight: 600 }}>기본 이용금액</label>
                <input
                  name="default_fee"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  defaultValue={editTarget.default_fee || ''}
                  placeholder="0"
                  style={{ width: '100%', borderRadius: 10, border: '1px solid #E5E5EA', padding: '14px 14px', fontSize: 18, background: '#F2F2F7', outline: 'none', boxSizing: 'border-box', color: '#111', fontFamily: 'inherit' }}
                />
              </div>

              {error && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#FF3B30', margin: 0 }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                style={{ width: '100%', minHeight: 54, borderRadius: 14, background: '#F5A400', color: '#fff', border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
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
