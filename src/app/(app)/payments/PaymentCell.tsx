'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { disputePaymentAction } from '@/lib/actions/payments'

interface Payment {
  id: string
  amount: number
  paidAt: string
  status: string
  memo: string | null
}

interface Props {
  payment: Payment
}

const statusLabel: Record<string, string> = {
  CONFIRMED: '확정',
  PENDING: '확인 중',
  DISPUTED: '수정 요청',
}
const statusBg: Record<string, string> = {
  CONFIRMED: 'bg-[#34C759]/10 text-[#34C759]',
  PENDING: 'bg-[#FF6B00]/10 text-[#FF6B00]',
  DISPUTED: 'bg-[#FF3B30]/10 text-[#FF3B30]',
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function PaymentCell({ payment }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDispute = () => {
    setError(null)
    startTransition(async () => {
      const result = await disputePaymentAction(payment.id, memo)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setDisputing(false)
        setMemo('')
        router.refresh()
      }
    })
  }

  return (
    <>
      {/* 셀 콘텐츠 — 클릭 가능 */}
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 w-full py-1"
      >
        <span className="text-sm font-semibold text-black">
          {formatKRW(payment.amount)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBg[payment.status] ?? ''}`}>
          {statusLabel[payment.status] ?? payment.status}
        </span>
      </button>

      {/* 상세 바텀시트 */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setOpen(false); setDisputing(false); setMemo('') }} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold">납부 상세</h2>
              <button
                onClick={() => { setOpen(false); setDisputing(false); setMemo('') }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 pb-8">
              {/* 금액 */}
              <div className="flex items-center justify-between py-2 border-b border-[#F2F2F7]">
                <span className="text-sm text-[#6C6C70]">금액</span>
                <span className="text-base font-bold text-black">{formatKRW(payment.amount)}</span>
              </div>

              {/* 납부일 */}
              <div className="flex items-center justify-between py-2 border-b border-[#F2F2F7]">
                <span className="text-sm text-[#6C6C70]">납부일</span>
                <span className="text-base text-black">
                  {new Date(payment.paidAt).toLocaleDateString('ko-KR')}
                </span>
              </div>

              {/* 상태 */}
              <div className="flex items-center justify-between py-2 border-b border-[#F2F2F7]">
                <span className="text-sm text-[#6C6C70]">상태</span>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusBg[payment.status] ?? ''}`}>
                  {statusLabel[payment.status] ?? payment.status}
                </span>
              </div>

              {/* 메모 */}
              {payment.memo && (
                <div className="py-2 border-b border-[#F2F2F7]">
                  <p className="text-sm text-[#6C6C70] mb-1">메모</p>
                  <p className="text-base text-black">{payment.memo}</p>
                </div>
              )}

              {/* 수정 요청 폼 */}
              {payment.status === 'PENDING' && (
                <>
                  {!disputing ? (
                    <button
                      onClick={() => setDisputing(true)}
                      className="w-full h-14 rounded-full border border-[#FF3B30] text-[#FF3B30] text-base font-semibold"
                    >
                      수정 요청
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#6C6C70]">수정 요청 사유 *</label>
                        <textarea
                          value={memo}
                          onChange={(e) => setMemo(e.target.value)}
                          rows={3}
                          placeholder="금액이 다릅니다 / 날짜가 틀렸습니다 등"
                          className="w-full px-4 py-3 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#FF3B30] resize-none"
                        />
                      </div>

                      {error && (
                        <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                          <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setDisputing(false); setMemo(''); setError(null) }}
                          className="flex-1 h-12 rounded-full border border-[#C6C6C8] text-[#6C6C70] text-base"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleDispute}
                          disabled={isPending || !memo.trim()}
                          className="flex-1 h-12 rounded-full bg-[#FF3B30] text-white text-base font-semibold disabled:opacity-60"
                        >
                          {isPending ? '요청 중...' : '요청 전송'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {payment.status === 'DISPUTED' && (
                <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                  <p className="text-sm font-medium text-[#FF3B30]">수정 요청이 버스기사에게 전달되었습니다.</p>
                </div>
              )}

              {payment.status === 'CONFIRMED' && (
                <div className="px-4 py-3 rounded-2xl bg-[#34C759]/10 border border-[#34C759]/20">
                  <p className="text-sm font-medium text-[#34C759]">납부가 확정된 내역입니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
