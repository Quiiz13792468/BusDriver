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

function fmtWon(n: number) {
  return '₩' + n.toLocaleString('ko-KR')
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

const inputClass =
  'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'

const AMBER = '#F5A400'
const RED = '#FF3B30'
const BLUE = '#007AFF'
const LABEL = '#8E8E93'
const SEP = '#E5E5EA'

const TABS = ['입금 예정', '미납', '확인 요청', '입금 현황']

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

  const todaySum = todayStudents.reduce((s, x) => s + (x.custom_fee ?? x.default_fee ?? 0), 0)
  const overdueSum = overdueList.reduce((s, x) => s + (x.custom_fee ?? x.default_fee ?? 0), 0)
  const pendingSum = pendingPayments.reduce((s, p) => s + p.amount, 0)

  const chips = [
    { label: '입금 예정', value: `${todayStudents.length}명`, color: AMBER, tabIdx: 0 },
    { label: '미납', value: `${overdueList.length}명`, color: RED, tabIdx: 1 },
    { label: '확인 요청', value: `${pendingPayments.length}건`, color: BLUE, tabIdx: 2 },
  ]

  return (
    <>
      {/* 이번달 입금 요약 */}
      <div style={{ background: 'rgb(245,164,0)', padding: '14px 18px 12px', borderBottom: `1px solid ${SEP}` }}>
        <div style={{ color: 'rgb(33,33,35)', marginBottom: 2, fontSize: 16 }}>{month}월 입금 확정</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
          {fmtWon(monthlySum)}
        </div>
      </div>

      {/* 상태 칩 */}
      <div style={{ display: 'flex', gap: 10, padding: '6px 14px', background: '#fff', borderBottom: `1px solid ${SEP}` }}>
        {chips.map(({ label, value, color, tabIdx }) => (
          <button
            key={label}
            onClick={() => setTab(tabIdx)}
            style={{
              flex: 1, borderRadius: 12, padding: '10px 6px', textAlign: 'center',
              background: `${color}18`, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              border: `1.5px solid ${color}33`,
            }}
          >
            <span style={{ fontSize: 12, color: '#000' }}>{label}</span>
            <span style={{ fontWeight: 800, color, fontSize: 24 }}>{value}</span>
          </button>
        ))}
      </div>

      {/* 탭바 */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: `1.5px solid ${AMBER}` }}>
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{
              flex: 1, padding: '11px 4px',
              fontWeight: tab === i ? 700 : 500,
              color: tab === i ? AMBER : LABEL,
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: tab === i ? `2.5px solid ${AMBER}` : '2.5px solid transparent',
              background: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap', fontSize: 18,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div key={tab} style={{ paddingTop: 12, animation: 'tabSlideIn 0.22s ease' }}>

        {/* 입금 예정 */}
        {tab === 0 && (
          todayStudents.length === 0 ? (
            <div className="bg-white rounded-2xl mx-[14px] px-4 py-8 text-center">
              <p className="text-sm text-[#8E8E93]">오늘 입금 예정 학생이 없습니다</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '0 14px 8px', fontSize: 13, color: LABEL, fontWeight: 500 }}>
                오늘 입금 예정 · {todayStudents.length}명 · 합계 {fmtWon(todaySum)}
              </div>
              {todayStudents.map((s) => (
                <div key={s.id} style={{
                  background: '#fff', borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  margin: '0 14px 10px', border: `1.5px solid ${AMBER}33`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minHeight: 72,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#111', fontSize: 22 }}>{s.name}</div>
                    {s.school_name && (
                      <div style={{ color: LABEL, marginTop: 2, fontSize: 16 }}>{s.school_name}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#111', fontSize: 22, marginBottom: 6 }}>
                      {fmtWon(s.custom_fee ?? s.default_fee ?? 0)}
                    </div>
                    <button
                      onClick={() => openRegister(s)}
                      style={{
                        background: AMBER, color: '#fff', border: 'none',
                        borderRadius: 8, padding: '6px 14px',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 34,
                      }}
                    >
                      등록
                    </button>
                  </div>
                </div>
              ))}
            </>
          )
        )}

        {/* 미납 */}
        {tab === 1 && (
          overdueList.length === 0 ? (
            <div className="bg-white rounded-2xl mx-[14px] px-4 py-8 text-center">
              <p className="text-sm text-[#8E8E93]">미납 학생이 없습니다</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '0 14px 8px', fontSize: 13, color: LABEL, fontWeight: 500 }}>
                미납 학생 · {overdueList.length}명 · 총 {fmtWon(overdueSum)}
              </div>
              {overdueList.map((s) => (
                <div key={s.id} style={{
                  background: '#fff', borderRadius: 14,
                  margin: '0 14px 10px', padding: '14px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1.5px solid ${RED}33`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 22, color: '#111' }}>{s.name}</div>
                      {s.school_name && (
                        <div style={{ color: LABEL, fontSize: 16, marginTop: 2 }}>{s.school_name}</div>
                      )}
                      <div style={{ color: RED, marginTop: 4, fontWeight: 600, fontSize: 14 }}>
                        {s.payment_day}일 이후 미납
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: RED, fontSize: 22 }}>
                        {fmtWon(s.custom_fee ?? s.default_fee ?? 0)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openRegister(s)}
                      disabled={isPending}
                      style={{
                        flex: 1, minHeight: 48, background: RED, color: '#fff',
                        border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      입금요청
                    </button>
                    <button
                      onClick={() => openRegister(s)}
                      disabled={isPending}
                      style={{
                        flex: 1, minHeight: 48, background: '#F2F2F7', color: '#555',
                        border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      입금확정
                    </button>
                  </div>
                </div>
              ))}
            </>
          )
        )}

        {/* 확인 요청 */}
        {tab === 2 && (
          <>
            {pendingPayments.length === 0 ? (
              <div className="bg-white rounded-2xl mx-[14px] px-4 py-8 text-center">
                <p className="text-sm text-[#8E8E93]">새로운 요청이 없습니다</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '0 14px 8px', fontSize: 13, color: LABEL, fontWeight: 500 }}>
                  입금 확인 요청 · {pendingPayments.length}건 · 합계 {fmtWon(pendingSum)}
                </div>
                {pendingPayments.map((p) => (
                  <div key={p.id} style={{
                    background: '#fff', borderRadius: 14,
                    margin: '0 14px 10px', padding: '14px 16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1.5px solid ${BLUE}22`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 24, color: '#000' }}>
                          {p.student_name ?? '—'}
                        </div>
                        <div style={{ marginTop: 1, fontSize: 16, color: LABEL }}>{p.paid_at}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 22 }}>{fmtWon(p.amount)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleConfirm(p.id)}
                        disabled={isPending}
                        style={{
                          flex: 1, minHeight: 44, background: BLUE, color: '#fff',
                          border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isPending ? '처리 중...' : '확정'}
                      </button>
                      <button
                        onClick={() => { setDisputeId(p.id); setDisputeMemo(''); setError(null) }}
                        disabled={isPending}
                        style={{
                          flex: 1, minHeight: 44, background: '#F2F2F7', color: '#555',
                          border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        재확인요청
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {error && (
              <div className="mx-[14px] px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
              </div>
            )}
          </>
        )}

        {/* 입금 현황 */}
        {tab === 3 && (
          <div className="-mx-0">
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
                className="w-full h-14 rounded-full bg-[#F5A400] text-white text-base font-bold disabled:opacity-60"
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
