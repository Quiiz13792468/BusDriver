'use client'

import { useState } from 'react'
import PaymentDetailModal from '@/components/driver/PaymentDetailModal'

interface Payment {
  id: string
  amount: number
  paid_at: string
  status: string
  memo: string | null
  created_by_role: string
  students: { id: string; name: string } | null
}

interface Props {
  payments: Payment[]
  driverName: string
}

const statusLabel: Record<string, string> = {
  CONFIRMED: '확정',
  PENDING: '확인 중',
  DISPUTED: '수정 요청',
}
const statusColor: Record<string, string> = {
  CONFIRMED: 'text-[#34C759]',
  PENDING: 'text-[#FF6B00]',
  DISPUTED: 'text-[#FF3B30]',
}

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function PaymentsList({ payments, driverName }: Props) {
  const [detailModal, setDetailModal] = useState<{ paymentId: string; studentName: string } | null>(null)

  if (!payments.length) {
    return <p className="px-4 py-4 text-sm text-[#6C6C70]">입금 내역이 없습니다.</p>
  }

  return (
    <>
      <ul className="divide-y divide-[#F2F2F7]">
        {payments.map((p) => {
          const student = p.students
          return (
            <li
              key={p.id}
              onClick={() => setDetailModal({ paymentId: p.id, studentName: student?.name ?? '—' })}
              className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-[#F2F2F7]"
            >
              <div>
                <p className="text-base font-medium text-black">{student?.name ?? '—'}</p>
                <p className="text-xs text-[#6C6C70] mt-0.5">
                  {p.paid_at}
                  {p.created_by_role === 'PARENT' && (
                    <span className="ml-1 text-[#5856D6]">학부모 등록</span>
                  )}
                </p>
                {p.memo && <p className="text-xs text-[#6C6C70]">{p.memo}</p>}
              </div>
              <div className="text-right">
                <p className="text-base font-semibold">{formatKRW(p.amount)}</p>
                <p className={`text-xs font-medium ${statusColor[p.status] ?? ''}`}>
                  {statusLabel[p.status] ?? p.status}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      {detailModal && (
        <PaymentDetailModal
          paymentId={detailModal.paymentId}
          studentName={detailModal.studentName}
          driverName={driverName}
          onClose={() => setDetailModal(null)}
        />
      )}
    </>
  )
}
