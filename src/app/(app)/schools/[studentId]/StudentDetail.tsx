'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateStudentAction, deactivateStudentAction } from '@/lib/actions/students'

interface School {
  id: string
  name: string
  default_fee: number
}

interface Student {
  id: string
  name: string
  phone: string | null
  parent_name: string | null
  parent_phone: string | null
  ride_type: string
  payment_day: number | null
  custom_fee: number | null
  start_date: string | null
  end_date: string | null
  school_id: string | null
  is_active: boolean
  schools: School | null
}

interface Payment {
  id: string
  amount: number
  paid_at: string
  status: string
  memo: string | null
}

interface Props {
  student: Student
  schools: School[]
  recentPayments: Payment[]
}

const rideOptions = [
  { value: 'BOTH', label: '등하교' },
  { value: 'MORNING', label: '등교만' },
  { value: 'AFTERNOON', label: '하교만' },
]

const statusColor: Record<string, string> = {
  CONFIRMED: 'text-[#34C759]',
  PENDING: 'text-[#FF6B00]',
  DISPUTED: 'text-[#FF3B30]',
}
const statusLabel: Record<string, string> = {
  CONFIRMED: '확정',
  PENDING: '확인 중',
  DISPUTED: '수정 요청',
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function StudentDetail({ student, schools, recentPayments }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const effectiveFee = student.schools?.default_fee ?? student.custom_fee ?? 0

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateStudentAction(student.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setEditing(false)
        router.refresh()
      }
    })
  }

  const handleDeactivate = () => {
    if (!confirm(`${student.name} 학생을 이용 정지하시겠습니까?\n(삭제되지 않고 목록에서만 제외됩니다)`)) return
    startTransition(async () => {
      await deactivateStudentAction(student.id)
      router.push('/schools')
    })
  }

  const inputClass =
    'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20 disabled:bg-[#F2F2F7] disabled:text-[#6C6C70]'
  const selectClass =
    'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] disabled:bg-[#F2F2F7] disabled:text-[#6C6C70]'

  return (
    <div className="px-4 py-5 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-[#6C6C70] mb-1"
          >
            ← 목록
          </button>
          <h1 className="text-2xl font-bold text-black">{student.name}</h1>
          {student.schools && (
            <p className="text-sm text-[#6C6C70]">{student.schools.name}</p>
          )}
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
            editing
              ? 'bg-white text-[#6C6C70] border-[#C6C6C8]'
              : 'bg-[#F5A400] text-black border-[#F5A400]'
          }`}
        >
          {editing ? '취소' : '편집'}
        </button>
      </div>

      {/* 기본 정보 요약 카드 */}
      {!editing && (
        <div className="bg-white rounded-2xl px-4 py-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[#6C6C70]">이용 구분</p>
            <p className="text-base font-medium text-black mt-0.5">
              {rideOptions.find((r) => r.value === student.ride_type)?.label}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6C6C70]">매월 입금일</p>
            <p className="text-base font-medium text-black mt-0.5">
              {student.payment_day ? `${student.payment_day}일` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6C6C70]">이용금액</p>
            <p className="text-base font-medium text-black mt-0.5">
              {formatKRW(effectiveFee)}
              {student.schools?.default_fee && (
                <span className="text-xs text-[#6C6C70] ml-1">(학교 기본)</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6C6C70]">학부모</p>
            <p className="text-base font-medium text-black mt-0.5">
              {student.parent_name ?? '—'}
            </p>
          </div>
          {student.parent_phone && (
            <div className="col-span-2">
              <p className="text-xs text-[#6C6C70]">학부모 연락처</p>
              <a
                href={`tel:${student.parent_phone}`}
                className="text-base font-medium text-[#F5A400] mt-0.5 block"
              >
                {student.parent_phone}
              </a>
            </div>
          )}
        </div>
      )}

      {/* 편집 폼 */}
      {editing && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl px-4 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6C6C70]">학교</label>
            <select name="school_id" defaultValue={student.school_id ?? ''} className={selectClass}>
              <option value="">학교 없음</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6C6C70]">학생 이름 *</label>
            <input name="name" type="text" defaultValue={student.name} required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6C6C70]">학생 전화번호</label>
            <input name="phone" type="tel" inputMode="numeric" defaultValue={student.phone ?? ''} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6C6C70]">학부모 이름</label>
            <input name="parent_name" type="text" defaultValue={student.parent_name ?? ''} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6C6C70]">학부모 전화번호</label>
            <input name="parent_phone" type="tel" inputMode="numeric" defaultValue={student.parent_phone ?? ''} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#6C6C70]">이용 구분</label>
            <select name="ride_type" defaultValue={student.ride_type} className={selectClass}>
              {rideOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#6C6C70]">매월 입금일</label>
              <input name="payment_day" type="number" inputMode="numeric" min={1} max={31}
                defaultValue={student.payment_day ?? ''} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#6C6C70]">개별 이용금액</label>
              <input name="custom_fee" type="number" inputMode="numeric" min={0}
                defaultValue={student.custom_fee ?? ''} placeholder="학교 기본" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#6C6C70]">시작일</label>
              <input name="start_date" type="date" defaultValue={student.start_date ?? ''} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#6C6C70]">종료일</label>
              <input name="end_date" type="date" defaultValue={student.end_date ?? ''} className={inputClass} />
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
            {isPending ? '저장 중...' : '저장'}
          </button>

          <button
            type="button"
            onClick={handleDeactivate}
            disabled={isPending}
            className="w-full h-12 rounded-full border border-[#FF3B30] text-[#FF3B30] text-sm font-semibold disabled:opacity-60"
          >
            이용 정지
          </button>
        </form>
      )}

      {/* 최근 입금 내역 */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F7]">
          <h2 className="text-base font-semibold text-black">최근 입금 내역</h2>
        </div>
        {!recentPayments.length ? (
          <p className="px-4 py-4 text-sm text-[#6C6C70]">입금 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#F2F2F7]">
            {recentPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-base font-medium text-black">{formatKRW(p.amount)}</p>
                  {p.memo && <p className="text-xs text-[#6C6C70] mt-0.5">{p.memo}</p>}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${statusColor[p.status] ?? 'text-[#6C6C70]'}`}>
                    {statusLabel[p.status] ?? p.status}
                  </p>
                  <p className="text-xs text-[#6C6C70] mt-0.5">{p.paid_at}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
