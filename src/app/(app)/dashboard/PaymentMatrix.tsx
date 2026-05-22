'use client'

// 학교별 입금 현황 — 미납 월 배지, 학생 검색, 입금 등록/기록 버튼 제공

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
  amber: '#F5A400',
  label: '#8E8E93',
  sep: '#E5E5EA',
  bg: '#F2F2F7',
}

export default function PaymentMatrix({ year, currentMonth, schools, students, payments, driverName = '버스기사', recentMonthsOnly = false }: Props) {
  const router = useRouter()
  const [registerModal, setRegisterModal] = useState<RegisterModalData | null>(null)
  const [detailModal, setDetailModal] = useState<DetailModalData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  if (!schools.length || !students.length) return null

  const visibleMonths = recentMonthsOnly
    ? MONTHS.filter((m) => m >= Math.max(1, currentMonth - 2) && m <= currentMonth)
    : MONTHS

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

  const latestPaymentMap = new Map<string, { id: string; paidAt: string }>()
  for (const p of payments) {
    const prev = latestPaymentMap.get(p.student_id)
    if (!prev || p.paid_at > prev.paidAt) {
      latestPaymentMap.set(p.student_id, { id: p.id, paidAt: p.paid_at })
    }
  }

  const schoolFeeMap = new Map<string, number>()
  for (const s of students) {
    if (!schoolFeeMap.has(s.school_id) && s.schools?.default_fee) {
      schoolFeeMap.set(s.school_id, s.schools.default_fee)
    }
  }

  const handleUnpaidBadgeClick = (student: Student, m: number) => {
    const defaultAmount = student.custom_fee ?? student.schools?.default_fee ?? 0
    setRegisterModal({ studentId: student.id, studentName: student.name, month: m, year, defaultAmount })
  }

  const handleRecord = (student: Student) => {
    const latest = latestPaymentMap.get(student.id)
    if (latest) setDetailModal({ paymentId: latest.id, studentName: student.name })
  }

  const renderStudentRow = (student: Student, schoolName: string, borderBottom: boolean) => {
    const unpaidMonths = visibleMonths.filter((m) => {
      if (m > currentMonth) return false
      return !paymentMap.has(`${student.id}-${m}`)
    })
    const allPaid = unpaidMonths.length === 0

    return (
      <div
        key={student.id}
        style={{
          display: 'flex', alignItems: 'flex-start', padding: '14px 14px',
          borderBottom: borderBottom ? `1px solid ${IOS.sep}` : 'none', gap: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>{student.name}</div>
          <div style={{ fontSize: 13, color: IOS.label, marginTop: 2 }}>{schoolName}</div>
          {allPaid ? (
            <div style={{ marginTop: 6, fontSize: 13, color: IOS.green, fontWeight: 600 }}>✓ 모든 월 완납</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {unpaidMonths.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleUnpaidBadgeClick(student, m)}
                  style={{
                    background: `${IOS.red}15`,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => router.push(`/schools/${student.id}`)}
            style={{
              minWidth: 60, minHeight: 48,
              background: IOS.bg, border: '2px solid #E5E5EA',
              borderRadius: 12, fontSize: 16, fontWeight: 800, color: '#333',
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
              background: IOS.amber, border: 'none',
              borderRadius: 12, fontSize: 16, fontWeight: 800, color: '#fff',
              cursor: 'pointer',
            }}
          >
            기록
          </button>
        </div>
      </div>
    )
  }

  const q = searchQuery.trim()
  const filteredStudents = q ? students.filter((s) => s.name.includes(q)) : null

  return (
    <>
      <div style={{ padding: '12px 14px', overflowX: 'hidden' }}>
        {/* 검색 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111', flexShrink: 0 }}>입금 현황</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학생 검색"
            style={{
              flex: 1, minWidth: 0, background: IOS.bg, borderRadius: 10,
              padding: '8px 12px', fontSize: 15, border: `1px solid ${IOS.sep}`,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 검색 결과 모드 */}
        {filteredStudents && (
          <div>
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', color: IOS.label, padding: '20px 0', fontSize: 14 }}>
                검색 결과 없음
              </div>
            ) : (
              filteredStudents.map((student) => {
                const schoolName = schools.find((sc) => sc.id === student.school_id)?.name ?? ''
                return renderStudentRow(student, schoolName, false)
              })
            )}
          </div>
        )}

        {/* 학교별 그룹 모드 */}
        {!filteredStudents && schools.map((school) => {
          const schoolStudents = students.filter((s) => s.school_id === school.id)
          if (!schoolStudents.length) return null
          const fee = schoolFeeMap.get(school.id)

          return (
            <div key={school.id} style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, color: '#111', marginBottom: 8, fontSize: 18 }}>
                {school.name}
                {fee != null && (
                  <span style={{ color: IOS.label, fontWeight: 400, fontSize: 14, marginLeft: 6 }}>
                    ₩{fee.toLocaleString()}/월
                  </span>
                )}
              </div>
              <div style={{
                background: '#fff', borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>
                {schoolStudents.map((student, ri) =>
                  renderStudentRow(student, school.name, ri < schoolStudents.length - 1)
                )}
              </div>
            </div>
          )
        })}
      </div>

      {registerModal && (
        <MatrixRegisterModal data={registerModal} onClose={() => setRegisterModal(null)} />
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
