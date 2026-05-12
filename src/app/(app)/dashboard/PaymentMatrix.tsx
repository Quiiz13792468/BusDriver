'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const IOS = {
  red: '#FF3B30',
  green: '#34C759',
  blue: '#007AFF',
  amber: '#F5A400',
  label: '#8E8E93',
  sep: '#E5E5EA',
  bg: '#F2F2F7',
}

export default function PaymentMatrix({ year, currentMonth, schools, students, payments, driverName = '버스기사', recentMonthsOnly = false }: Props) {
  const router = useRouter()
  const [registerModal, setRegisterModal] = useState<RegisterModalData | null>(null)
  const [detailModal, setDetailModal] = useState<DetailModalData | null>(null)

  if (!schools.length || !students.length) return null

  const visibleMonths = recentMonthsOnly
    ? MONTHS.filter((m) => m >= Math.max(1, currentMonth - 2) && m <= currentMonth)
    : MONTHS

  // 학생별 월별 CONFIRMED 결제 맵: key = `${studentId}-${month}` → { amount, id }
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

  // 학생의 가장 최근 결제 id
  const latestPaymentMap = new Map<string, { id: string; paidAt: string }>()
  for (const p of payments) {
    const prev = latestPaymentMap.get(p.student_id)
    if (!prev || p.paid_at > prev.paidAt) {
      latestPaymentMap.set(p.student_id, { id: p.id, paidAt: p.paid_at })
    }
  }

  const handleUnpaidBadgeClick = (student: Student, m: number) => {
    const defaultAmount = student.custom_fee ?? student.schools?.default_fee ?? 0
    setRegisterModal({
      studentId: student.id,
      studentName: student.name,
      month: m,
      year,
      defaultAmount,
    })
  }

  const handleRecord = (student: Student) => {
    const latest = latestPaymentMap.get(student.id)
    if (latest) {
      setDetailModal({ paymentId: latest.id, studentName: student.name })
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

            <div className="divide-y divide-[#F2F2F7]">
              {schoolStudents.map((student) => {
                const unpaidMonths = visibleMonths.filter((m) => {
                  if (m > currentMonth) return false
                  return !paymentMap.has(`${student.id}-${m}`)
                })
                const allPaid = unpaidMonths.length === 0

                return (
                  <div key={student.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 16px', gap: 10 }}>
                    {/* 학생 정보 + 미납 칩 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>{student.name}</div>
                      <div style={{ fontSize: 13, color: IOS.label, marginTop: 2, marginBottom: 8 }}>{school.name}</div>
                      {allPaid ? (
                        <span style={{ fontSize: 14, color: IOS.green, fontWeight: 700 }}>✓ 모든 월 완납</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {unpaidMonths.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => handleUnpaidBadgeClick(student, m)}
                              style={{
                                background: 'rgba(255,59,48,0.12)',
                                color: IOS.red,
                                border: `1.5px solid ${IOS.red}`,
                                borderRadius: 20,
                                padding: '5px 12px',
                                fontSize: 14, fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {m}월
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 버튼 세로 배치 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => router.push(`/schools/${student.id}`)}
                        style={{
                          minWidth: 60, minHeight: 48,
                          background: IOS.bg,
                          border: '2px solid #E5E5EA',
                          borderRadius: 12,
                          fontSize: 16, fontWeight: 800, color: '#333',
                          cursor: 'pointer',
                        }}
                      >
                        정보
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRecord(student)}
                        style={{
                          minWidth: 60, minHeight: 48,
                          background: IOS.amber,
                          border: 'none',
                          borderRadius: 12,
                          fontSize: 16, fontWeight: 800, color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        기록
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {registerModal && (
        <MatrixRegisterModal
          data={registerModal}
          onClose={() => setRegisterModal(null)}
        />
      )}

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
