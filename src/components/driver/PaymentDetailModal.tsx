'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getPaymentDetailAction,
  unconfirmPaymentAction,
  updatePaymentAction,
  addPaymentMemoAction,
} from '@/lib/actions/payments'

interface Props {
  paymentId: string
  studentName: string
  driverName: string
  onClose: () => void
}

interface Memo {
  id: string
  sender_role: string
  sender_name: string
  content: string
  created_at: string
}

interface PaymentDetail {
  id: string
  amount: number
  paid_at: string
  status: string
  memo: string | null
  created_by_role: string
  created_at: string
  profiles: { full_name: string } | null
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

const inputClass =
  'w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400] focus:ring-2 focus:ring-[#F5A400]/20'

export default function PaymentDetailModal({ paymentId, studentName, driverName, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<PaymentDetail | null>(null)
  const [memos, setMemos] = useState<Memo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [editPaidAt, setEditPaidAt] = useState('')
  const [memoInput, setMemoInput] = useState('')

  useEffect(() => {
    getPaymentDetailAction(paymentId).then((res) => {
      if (res.error || !res.data) {
        setError(res.error ?? '불러오기 실패')
      } else {
        setDetail(res.data.payment as unknown as PaymentDetail)
        setMemos(res.data.memos as Memo[])
        setEditAmount(String(res.data.payment.amount))
        setEditPaidAt(res.data.payment.paid_at)
      }
      setLoading(false)
    })
  }, [paymentId])

  const handleUnconfirm = () => {
    setError(null)
    startTransition(async () => {
      const result = await unconfirmPaymentAction(paymentId)
      if (result?.error) {
        setError(result.error)
      } else {
        setEditMode(true)
        setDetail((prev) => prev ? { ...prev, status: 'PENDING' } : prev)
      }
    })
  }

  const handleSaveEdit = () => {
    setError(null)
    const amount = parseInt(editAmount, 10)
    if (!amount || amount <= 0) { setError('금액을 올바르게 입력해주세요.'); return }
    if (!editPaidAt) { setError('입금일을 선택해주세요.'); return }
    startTransition(async () => {
      const result = await updatePaymentAction(paymentId, amount, editPaidAt)
      if (result?.error) {
        setError(result.error)
      } else {
        setDetail((prev) => prev ? { ...prev, amount, paid_at: editPaidAt } : prev)
        setEditMode(false)
        router.refresh()
      }
    })
  }

  const handleAddMemo = () => {
    if (!memoInput.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await addPaymentMemoAction(paymentId, memoInput.trim(), 'DRIVER', driverName)
      if (result?.error) {
        setError(result.error)
      } else {
        setMemos((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender_role: 'DRIVER',
            sender_name: driverName,
            content: memoInput.trim(),
            created_at: new Date().toISOString(),
          },
        ])
        setMemoInput('')
      }
    })
  }

  const registrar = detail?.profiles
    ? (detail.profiles as { full_name: string }).full_name
    : (detail?.created_by_role === 'PARENT' ? '학부모' : '버스기사')

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
          <div>
            <h2 className="text-lg font-bold text-black">입금 상세</h2>
            {studentName && <p className="text-sm text-[#6C6C70] mt-0.5">{studentName}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 pb-6">
          {loading && (
            <div className="py-8 text-center">
              <p className="text-sm text-[#6C6C70]">불러오는 중...</p>
            </div>
          )}

          {!loading && detail && (
            <>
              {/* 2열 정보 그리드 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F2F2F7] rounded-2xl px-4 py-3">
                  <p className="text-xs text-[#6C6C70]">등록자</p>
                  <p className="text-base font-semibold text-black mt-0.5">{registrar}</p>
                </div>
                <div className="bg-[#F2F2F7] rounded-2xl px-4 py-3">
                  <p className="text-xs text-[#6C6C70]">등록시간</p>
                  <p className="text-sm font-medium text-black mt-0.5">{formatDateTime(detail.created_at)}</p>
                </div>

                {/* 입금일자 */}
                <div className="bg-[#F2F2F7] rounded-2xl px-4 py-3">
                  <p className="text-xs text-[#6C6C70]">입금일자</p>
                  {editMode ? (
                    <input
                      type="date"
                      value={editPaidAt}
                      onChange={(e) => setEditPaidAt(e.target.value)}
                      className="mt-1 w-full text-sm border-b border-[#F5A400] bg-transparent outline-none"
                    />
                  ) : (
                    <p className="text-base font-semibold text-black mt-0.5">{detail.paid_at}</p>
                  )}
                </div>

                {/* 입금금액 */}
                <div className="bg-[#F2F2F7] rounded-2xl px-4 py-3">
                  <p className="text-xs text-[#6C6C70]">입금금액</p>
                  {editMode ? (
                    <input
                      type="number"
                      inputMode="numeric"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="mt-1 w-full text-sm border-b border-[#F5A400] bg-transparent outline-none"
                    />
                  ) : (
                    <p className="text-base font-semibold text-black mt-0.5">{formatKRW(detail.amount)}</p>
                  )}
                </div>

                {/* 메모 (2열 병합) */}
                <div className="col-span-2 bg-[#F2F2F7] rounded-2xl px-4 py-3">
                  <p className="text-xs text-[#6C6C70] mb-2">메모 내역</p>
                  {memos.length === 0 && !detail.memo && (
                    <p className="text-sm text-[#C6C6C8]">메모 없음</p>
                  )}
                  {detail.memo && (
                    <p className="text-sm text-[#3C3C43] mb-1">
                      <span className="font-medium">최초메모:</span> {detail.memo}
                    </p>
                  )}
                  {memos.map((m) => (
                    <div key={m.id} className="text-sm text-[#3C3C43] mb-1">
                      <span className="font-medium text-xs text-[#6C6C70]">
                        {m.sender_role === 'PARENT' ? '학부모' : '버스기사'} {m.sender_name}:
                      </span>{' '}
                      {m.content}
                    </div>
                  ))}

                  {/* 메모 입력 (수정 모드) */}
                  {editMode && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={memoInput}
                        onChange={(e) => setMemoInput(e.target.value)}
                        placeholder="메모 추가..."
                        className="flex-1 h-10 px-3 rounded-xl border border-[#C6C6C8] text-sm bg-white focus:outline-none focus:border-[#F5A400]"
                      />
                      <button
                        type="button"
                        onClick={handleAddMemo}
                        disabled={isPending || !memoInput.trim()}
                        className="h-10 px-4 rounded-xl bg-[#F5A400] text-black text-sm font-semibold disabled:opacity-50"
                      >
                        추가
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                  <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
                </div>
              )}

              {/* 하단 버튼 */}
              {editMode ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isPending}
                    className="h-14 rounded-full bg-[#F5A400] text-black text-base font-bold disabled:opacity-60"
                  >
                    {isPending ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setError(null) }}
                    disabled={isPending}
                    className="h-14 rounded-full border border-[#C6C6C8] text-[#6C6C70] text-base"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {detail.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={handleUnconfirm}
                      disabled={isPending}
                      className="h-14 rounded-full border border-[#FF3B30] text-[#FF3B30] text-base font-semibold disabled:opacity-60"
                    >
                      {isPending ? '처리 중...' : '확정 취소'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className={`h-14 rounded-full border border-[#C6C6C8] text-[#6C6C70] text-base ${detail.status !== 'CONFIRMED' ? 'col-span-2' : ''}`}
                  >
                    닫기
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && error && !detail && (
            <div className="py-8 text-center">
              <p className="text-sm text-[#FF3B30]">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
