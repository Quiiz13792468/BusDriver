'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { registerPaymentAction, confirmPaymentAction, disputePaymentAction } from '@/lib/actions/payments'
import PaymentMatrix from './PaymentMatrix'

interface TodayStudent {
  id: string
  name: string
  school_name: string | null
  custom_fee: number | null
  default_fee: number | null
}

interface OverdueStudent {
  id: string
  name: string
  school_name: string | null
  payment_day: number
  custom_fee: number | null
  default_fee: number | null
}

interface PendingPayment {
  id: string
  amount: number
  paid_at: string
  student_name: string | null
}

interface School {
  id: string
  name: string
}

interface MatrixStudent {
  id: string
  name: string
  school_id: string
  custom_fee: number | null
  schools: { default_fee: number } | null
}

interface MatrixPayment {
  id: string
  student_id: string
  amount: number
  paid_at: string
  status: string
}

interface Props {
  year: number
  month: number
  monthlySum: number
  todayStudents: TodayStudent[]
  overdueList: OverdueStudent[]
  pendingPayments: PendingPayment[]
  schools: School[]
  matrixStudents: MatrixStudent[]
  matrixPayments: MatrixPayment[]
  driverName: string
}

interface RegisterTarget {
  studentId: string
  studentName: string
  defaultAmount: number
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

const inputClass =
  'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'

const TABS = ['입금 예정', '미납', '확인 요청', '입금 현황']
const CHIP_COLORS = ['#F5A400', '#FF3B30', '#5856D6']

export default function HomeTabs({
  year, month, monthlySum,
  todayStudents, overdueList, pendingPayments,
  schools, matrixStudents, matrixPayments,
  driverName,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [registerTarget, setRegisterTarget] = useState<RegisterTarget | null>(null)
  const [disputeId, setDisputeId] = useState<string | null>(null)
  const [disputeMemo, setDisputeMemo] = useState('')

  useEffect(() => setMounted(true), [])

  const today = new Date().toISOString().split('T')[0]

  const openRegister = (s: TodayStudent | OverdueStudent) => {
    setError(null)
    setRegisterTarget({
      studentId: s.id,
      studentName: s.name,
      defaultAmount: s.custom_fee ?? s.default_fee ?? 0,
    })
  }

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!registerTarget) return
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('student_id', registerTarget.studentId)
    startTransition(async () => {
      const result = await registerPaymentAction(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setRegisterTarget(null)
        router.refresh()
      }
    })
  }

  const handleConfirm = (paymentId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await confirmPaymentAction(paymentId)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  const handleDispute = () => {
    if (!disputeId) return
    setError(null)
    startTransition(async () => {
      const result = await disputePaymentAction(disputeId, disputeMemo.trim() || '재확인 요청')
      if (result?.error) {
        setError(result.error)
      } else {
        setDisputeId(null)
        setDisputeMemo('')
        router.refresh()
      }
    })
  }

  const chipCounts = [todayStudents.length, overdueList.length, pendingPayments.length]
  const chipLabels = [`예정 ${todayStudents.length}명`, `미납 ${overdueList.length}명`, `요청 ${pendingPayments.length}건`]

  return (
    <>
      {/* 이번달 입금 요약 배너 */}
      <div className="mx-4 mt-3 rounded-2xl bg-[#F5A400] px-4 py-3">
        <p className="text-xs font-medium text-black/60 mb-0.5">{month}월 확정 입금</p>
        <p className="text-2xl font-bold text-black">{formatKRW(monthlySum)}</p>
      </div>

      {/* 상태 칩 */}
      <div className="flex gap-2 px-4 mt-2.5">
        {chipLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className="h-8 px-3 rounded-full text-xs font-semibold border transition-colors"
            style={{
              borderColor: CHIP_COLORS[i],
              color: tab === i ? '#fff' : CHIP_COLORS[i],
              backgroundColor: tab === i ? CHIP_COLORS[i] : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭바 */}
      <div className="flex border-b border-[#E5E5EA] mt-2.5 px-1">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`flex-1 py-2.5 text-sm font-medium relative transition-colors ${
              tab === i ? 'text-black' : 'text-[#8E8E93]'
            }`}
          >
            <span>{t}</span>
            {i < 3 && chipCounts[i] > 0 && (
              <span
                className="ml-0.5 text-[10px] font-bold align-top leading-none"
                style={{ color: CHIP_COLORS[i] }}
              >
                {chipCounts[i]}
              </span>
            )}
            {tab === i && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-black rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div key={tab} className="px-4 pt-3 pb-2 space-y-2" style={{ animation: 'tabSlideIn 0.18s ease' }}>

        {/* 입금 예정 */}
        {tab === 0 && (
          todayStudents.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-8 text-center">
              <p className="text-sm text-[#8E8E93]">오늘 입금 예정 학생이 없습니다</p>
            </div>
          ) : (
            todayStudents.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-black truncate">{s.name}</p>
                  {s.school_name && <p className="text-xs text-[#8E8E93] mt-0.5">{s.school_name}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-[#34C759]">
                    {formatKRW(s.custom_fee ?? s.default_fee ?? 0)}
                  </span>
                  <button
                    onClick={() => openRegister(s)}
                    className="h-9 px-4 rounded-full bg-[#F5A400] text-black text-sm font-semibold"
                  >
                    등록
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* 미납 */}
        {tab === 1 && (
          overdueList.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-8 text-center">
              <p className="text-sm text-[#8E8E93]">미납 학생이 없습니다</p>
            </div>
          ) : (
            overdueList.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-black truncate">{s.name}</p>
                  <p className="text-xs text-[#FF3B30] mt-0.5">{s.payment_day}일 미납</p>
                  {s.school_name && <p className="text-xs text-[#8E8E93]">{s.school_name}</p>}
                </div>
                <button
                  onClick={() => openRegister(s)}
                  className="h-9 px-4 rounded-full bg-[#F5A400] text-black text-sm font-semibold shrink-0"
                >
                  입금 등록
                </button>
              </div>
            ))
          )
        )}

        {/* 확인 요청 */}
        {tab === 2 && (
          <>
            {pendingPayments.length === 0 ? (
              <div className="bg-white rounded-2xl px-4 py-8 text-center">
                <p className="text-sm text-[#8E8E93]">새로운 요청이 없습니다</p>
              </div>
            ) : (
              pendingPayments.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl px-4 py-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-black">{p.student_name ?? '—'}</p>
                      <p className="text-xs text-[#8E8E93] mt-0.5">{p.paid_at}</p>
                    </div>
                    <p className="text-base font-bold text-black">{formatKRW(p.amount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setDisputeId(p.id); setDisputeMemo(''); setError(null) }}
                      disabled={isPending}
                      className="flex-1 h-10 rounded-full border border-[#FF3B30] text-[#FF3B30] text-sm font-semibold disabled:opacity-50"
                    >
                      재확인요청
                    </button>
                    <button
                      onClick={() => handleConfirm(p.id)}
                      disabled={isPending}
                      className="flex-1 h-10 rounded-full bg-[#34C759] text-white text-sm font-bold disabled:opacity-50"
                    >
                      {isPending ? '처리 중...' : '확정'}
                    </button>
                  </div>
                </div>
              ))
            )}
            {error && (
              <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}
          </>
        )}

        {/* 입금 현황 */}
        {tab === 3 && (
          <div className="-mx-4">
            <PaymentMatrix
              year={year}
              currentMonth={month}
              schools={schools}
              students={matrixStudents}
              payments={matrixPayments}
              driverName={driverName}
              recentMonthsOnly
            />
          </div>
        )}
      </div>

      {/* 입금 등록 모달 */}
      {registerTarget && mounted && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setRegisterTarget(null); setError(null) }} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <div>
                <h2 className="text-lg font-bold text-black">입금 등록</h2>
                <p className="text-sm text-[#6C6C70] mt-0.5">{registerTarget.studentName}</p>
              </div>
              <button
                onClick={() => { setRegisterTarget(null); setError(null) }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="px-5 py-4 space-y-4 pb-8">
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
                  defaultValue={registerTarget.defaultAmount || ''}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">
                  입금일 <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  name="paid_at"
                  type="date"
                  required
                  defaultValue={today}
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

      {/* 재확인요청 모달 */}
      {disputeId && mounted && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setDisputeId(null); setDisputeMemo('') }} />
          <div className="relative w-full bg-white rounded-t-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold text-black">재확인 요청</h2>
              <button
                onClick={() => { setDisputeId(null); setDisputeMemo('') }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 pb-8">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">사유 (선택)</label>
                <input
                  type="text"
                  value={disputeMemo}
                  onChange={(e) => setDisputeMemo(e.target.value)}
                  placeholder="재확인이 필요한 이유..."
                  className={inputClass}
                />
              </div>
              {error && (
                <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                  <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
                </div>
              )}
              <button
                onClick={handleDispute}
                disabled={isPending}
                className="w-full h-14 rounded-full bg-[#FF3B30] text-white text-base font-bold disabled:opacity-60"
              >
                {isPending ? '처리 중...' : '재확인요청 보내기'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
