'use client'

import { useState } from 'react'
import MatrixRegisterModal from './MatrixRegisterModal'
import PaymentDetailModal from '@/components/driver/PaymentDetailModal'

interface School {
  id: string
  name: string
}

interface Student {
  id: string
  name: string
  school_id: string
  custom_fee: number | null
  schools: { default_fee: number } | null
}

interface Payment {
  id: string
  student_id: string
  amount: number
  paid_at: string
  status: string
}

interface Props {
  year: number
  currentMonth: number
  schools: School[]
  students: Student[]
  payments: Payment[]
  driverName?: string
  recentMonthsOnly?: boolean
}

interface RegisterModalData {
  studentId: string
  studentName: string
  month: number
  year: number
  defaultAmount: number
}

interface DetailModalData {
  paymentId: string
  studentName: string
}

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]

function formatKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function PaymentMatrix({ year, currentMonth, schools, students, payments, driverName = '버스기사', recentMonthsOnly = false }: Props) {
  const [registerModal, setRegisterModal] = useState<RegisterModalData | null>(null)
  const [detailModal, setDetailModal] = useState<DetailModalData | null>(null)

  if (!schools.length || !students.length) return null

  const visibleMonths = recentMonthsOnly
    ? MONTHS.filter((m) => m >= Math.max(1, currentMonth - 2) && m <= currentMonth)
    : MONTHS

  // 학생별 월별 CONFIRMED 결제 맵 생성: key = `${studentId}-${month}` → { amount, id }
  const paymentMap = new Map<string, { amount: number; id: string }>()
  for (const p of payments) {
    const m = parseInt(p.paid_at.split('-')[1], 10)
    const key = `${p.student_id}-${m}`
    const prev = paymentMap.get(key)
    if (!prev) {
      paymentMap.set(key, { amount: p.amount, id: p.id })
    } else {
      paymentMap.set(key, { amount: prev.amount + p.amount, id: prev.id })
    }
  }

  const handleCellClick = (student: Student, m: number) => {
    const entry = paymentMap.get(`${student.id}-${m}`)
    if (entry) {
      // CONFIRMED 셀 → 상세 모달
      setDetailModal({ paymentId: entry.id, studentName: student.name })
    } else {
      // 빈 셀 → 등록 모달
      const defaultAmount = student.custom_fee ?? student.schools?.default_fee ?? 0
      setRegisterModal({
        studentId: student.id,
        studentName: student.name,
        month: m,
        year,
        defaultAmount,
      })
    }
  }

  return (
    <>
      {schools.map((school) => {
        const schoolStudents = students.filter((s) => s.school_id === school.id)
        if (!schoolStudents.length) return null

        return (
          <section key={school.id} className="bg-white rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F2F2F7]">
              <h2 className="text-base font-semibold text-black">{school.name} 입금 현황</h2>
            </div>

            {/* 가로 스크롤 테이블 */}
            <div className="overflow-x-auto">
              <table className="border-collapse" style={{ minWidth: `${40 + visibleMonths.length * 56}px` }}>
                <thead>
                  <tr className="border-b border-[#F2F2F7]">
                    {/* sticky 이름 컬럼 헤더 */}
                    <th
                      className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-medium text-[#6C6C70] whitespace-nowrap border-r border-[#F2F2F7]"
                      style={{ minWidth: '80px' }}
                    >
                      학생
                    </th>
                    {visibleMonths.map((m) => (
                      <th
                        key={m}
                        className={`px-1 py-2 text-center text-xs font-medium whitespace-nowrap ${
                          m === currentMonth
                            ? 'bg-[#E3F2FD] text-[#1565C0]'
                            : 'text-[#6C6C70]'
                        }`}
                        style={{ minWidth: '52px' }}
                      >
                        {m}월
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schoolStudents.map((student) => (
                    <tr key={student.id} className="border-b border-[#F2F2F7] last:border-0">
                      {/* sticky 이름 컬럼 */}
                      <td
                        className="sticky left-0 z-10 bg-white px-3 py-2 text-sm font-medium text-black whitespace-nowrap border-r border-[#F2F2F7]"
                        style={{ minWidth: '80px' }}
                      >
                        {student.name}
                      </td>
                      {visibleMonths.map((m) => {
                        const key = `${student.id}-${m}`
                        const entry = paymentMap.get(key)
                        const amount = entry?.amount
                        const isCurrentMonth = m === currentMonth
                        const hasPayment = entry !== undefined

                        // 배경 결정: 현재월 > 미확정 순으로 스타일
                        let cellBg = ''
                        if (isCurrentMonth && !hasPayment) cellBg = 'bg-[#E3F2FD]'
                        else if (!hasPayment && m < currentMonth) cellBg = 'bg-[#FFF3CD]'
                        else if (isCurrentMonth && hasPayment) cellBg = 'bg-[#E3F2FD]'

                        return (
                          <td
                            key={m}
                            onClick={() => handleCellClick(student, m)}
                            className={`px-1 py-2 text-center text-xs cursor-pointer active:opacity-70 ${cellBg}`}
                            style={{ minWidth: '52px' }}
                          >
                            {hasPayment ? (
                              <span className="font-bold text-[#1A1A1A]">
                                {formatKRW(amount!)}
                              </span>
                            ) : (
                              <span className="text-[#C6C6C8]">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      {/* 입금 등록 모달 */}
      {registerModal && (
        <MatrixRegisterModal
          data={registerModal}
          onClose={() => setRegisterModal(null)}
        />
      )}

      {/* 결제 상세 모달 */}
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
