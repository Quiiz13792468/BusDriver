'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { registerPaymentAction, registerFuelAction, getStudentPaidMonthsAction } from '@/lib/actions/payments'

interface Student {
  id: string
  name: string
  school_name: string | null
}

interface Props {
  students: Student[]
}

type ModalType = 'payment' | 'fuel' | null
type FuelType = 'GASOLINE' | 'DIESEL'
type ServiceType = 'BOTH' | 'MORNING' | 'AFTERNOON'

const IOS = {
  amber: '#F5A400',
  red: '#FF3B30',
  green: '#34C759',
  bg: '#F2F2F7',
  card: '#FFFFFF',
  label: '#8E8E93',
  sep: '#E5E5EA',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: IOS.bg,
  borderRadius: 10,
  padding: '13px 14px',
  fontSize: 16,
  border: 'none',
  fontFamily: 'inherit',
  color: '#111',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: IOS.label,
  marginBottom: 4,
  display: 'block',
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'BOTH', label: '등하교' },
  { value: 'MORNING', label: '등교' },
  { value: 'AFTERNOON', label: '하교' },
]

export default function GlobalActions({ students }: Props) {
  const [modal, setModal] = useState<ModalType>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const [fuelType, setFuelType] = useState<FuelType>('DIESEL')

  const [studentQuery, setStudentQuery] = useState('')
  const [studentId, setStudentId] = useState('')
  const [showList, setShowList] = useState(false)
  const studentBoxRef = useRef<HTMLDivElement | null>(null)

  // 입금 모달 전용 상태
  const [serviceType, setServiceType] = useState<ServiceType>('BOTH')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [paidMonths, setPaidMonths] = useState<number[]>([])
  const [loadingMonths, setLoadingMonths] = useState(false)

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!showList) return
    const onClick = (e: MouseEvent) => {
      if (studentBoxRef.current && !studentBoxRef.current.contains(e.target as Node)) {
        setShowList(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [showList])

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    const q = studentQuery.trim()
    if (!q) return students
    return students.filter((s) => {
      if (s.name.includes(q)) return true
      if (s.school_name && s.school_name.includes(q)) return true
      return false
    })
  }, [studentQuery, students])

  const close = () => {
    setModal(null)
    setError(null)
    setFuelType('DIESEL')
    setStudentQuery('')
    setStudentId('')
    setShowList(false)
    setServiceType('BOTH')
    setSelectedMonth(null)
    setPaidMonths([])
    setLoadingMonths(false)
  }

  const selectStudent = async (s: Student) => {
    setStudentId(s.id)
    setStudentQuery(s.school_name ? `${s.name} (${s.school_name})` : s.name)
    setShowList(false)
    setSelectedMonth(null)
    setLoadingMonths(true)
    const months = await getStudentPaidMonthsAction(s.id, currentYear)
    setPaidMonths(months)
    setLoadingMonths(false)
  }

  const handleStudentChange = (v: string) => {
    setStudentQuery(v)
    setStudentId('')
    setPaidMonths([])
    setSelectedMonth(null)
    setShowList(true)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    if (modal === 'payment') {
      if (!studentId) {
        setError('학생을 선택해주세요')
        return
      }
      if (!selectedMonth) {
        setError('납부 월을 선택해주세요')
        return
      }
    }
    const formData = new FormData(e.currentTarget)
    if (modal === 'payment') {
      formData.set('student_id', studentId)
      formData.set('service_type', serviceType)
      const mm = String(selectedMonth).padStart(2, '0')
      formData.set('paid_at', `${currentYear}-${mm}-01`)
    } else if (modal === 'fuel') {
      formData.set('fuel_type', fuelType)
    }
    startTransition(async () => {
      const action = modal === 'payment' ? registerPaymentAction : registerFuelAction
      const result = await action(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        close()
      }
    })
  }

  const pillStyle: React.CSSProperties = {
    background: 'transparent',
    color: IOS.amber,
    border: `1.5px solid ${IOS.amber}`,
    borderRadius: 22,
    padding: '7px 16px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: 36,
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setModal('payment'); setError(null) }}
          style={pillStyle}
        >
          입금
        </button>
        <button
          onClick={() => { setModal('fuel'); setError(null) }}
          style={pillStyle}
        >
          주유
        </button>
      </div>

      {modal && mounted && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 60,
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={close}
        >
          <div
            style={{
              background: IOS.card,
              borderRadius: '20px 20px 0 0',
              padding: '20px 18px 36px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>
                {modal === 'payment' ? '입금 등록' : '주유 등록'}
              </span>
              <button
                onClick={close}
                aria-label="닫기"
                style={{
                  background: 'none', border: 'none',
                  fontSize: 22, cursor: 'pointer', color: IOS.label,
                  minWidth: 44, minHeight: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* 입금: 학생 검색 */}
              {modal === 'payment' && (
                <div ref={studentBoxRef} style={{ marginBottom: 14, position: 'relative' }}>
                  <label style={labelStyle}>학생 선택</label>
                  <input
                    type="text"
                    value={studentQuery}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    onFocus={() => setShowList(true)}
                    placeholder="이름으로 검색..."
                    autoComplete="off"
                    style={inputStyle}
                  />
                  {showList && filtered.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: '#fff',
                      border: `1px solid ${IOS.sep}`,
                      borderRadius: 10,
                      zIndex: 10,
                      maxHeight: 200,
                      overflowY: 'auto',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      marginTop: 4,
                    }}>
                      {filtered.map((s, i) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => selectStudent(s)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '13px 14px', fontSize: 15,
                            background: '#fff',
                            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                            borderBottom: i < filtered.length - 1 ? `1px solid ${IOS.sep}` : 'none',
                            cursor: 'pointer', color: '#111',
                          }}
                        >
                          {s.name}
                          {s.school_name && (
                            <span style={{ color: IOS.label, marginLeft: 6, fontSize: 14 }}>
                              · {s.school_name}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {showList && filtered.length === 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: '#fff',
                      border: `1px solid ${IOS.sep}`,
                      borderRadius: 10,
                      padding: '13px 14px',
                      fontSize: 14, color: IOS.label,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      marginTop: 4, zIndex: 10,
                    }}>
                      일치하는 학생이 없습니다
                    </div>
                  )}
                </div>
              )}

              {/* 입금: 이용유형 */}
              {modal === 'payment' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>이용유형</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {SERVICE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setServiceType(opt.value)}
                        style={{
                          flex: 1, minHeight: 44, borderRadius: 10,
                          border: `2px solid ${serviceType === opt.value ? IOS.amber : IOS.sep}`,
                          background: serviceType === opt.value ? IOS.amber : IOS.bg,
                          color: serviceType === opt.value ? '#fff' : '#555',
                          fontSize: 15, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 금액 (공통) */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  {modal === 'fuel' ? '주유금액' : '입금 금액'}
                </label>
                <input
                  name="amount"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  required
                  placeholder="0"
                  style={inputStyle}
                />
              </div>

              {/* 입금: 월 선택 그리드 */}
              {modal === 'payment' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>
                    납부 월 선택
                    {loadingMonths && (
                      <span style={{ marginLeft: 8, fontSize: 12, color: IOS.label }}>로딩 중...</span>
                    )}
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                  }}>
                    {MONTH_LABELS.map((label, idx) => {
                      const m = idx + 1
                      const isPaid = paidMonths.includes(m)
                      const isFuture = m > currentMonth
                      const isSelected = selectedMonth === m

                      let bg = IOS.bg
                      let color = '#333'
                      let border = `1.5px solid transparent`

                      if (isPaid) {
                        bg = IOS.green
                        color = '#fff'
                      } else if (isSelected) {
                        bg = IOS.amber
                        color = '#fff'
                        border = `1.5px solid ${IOS.amber}`
                      } else if (isFuture) {
                        bg = IOS.bg
                        color = '#C6C6C8'
                      }

                      return (
                        <button
                          key={m}
                          type="button"
                          disabled={isPaid || isFuture}
                          onClick={() => setSelectedMonth(isSelected ? null : m)}
                          style={{
                            minHeight: 44, borderRadius: 10,
                            background: bg, color, border,
                            fontSize: 15, fontWeight: isSelected || isPaid ? 700 : 500,
                            cursor: isPaid || isFuture ? 'default' : 'pointer',
                            opacity: isFuture ? 0.4 : 1,
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 주유: 유종 */}
              {modal === 'fuel' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>유종</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['DIESEL', 'GASOLINE'] as FuelType[]).map((ft) => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setFuelType(ft)}
                        style={{
                          flex: 1, minHeight: 48, borderRadius: 10,
                          border: `2px solid ${fuelType === ft ? IOS.amber : IOS.sep}`,
                          background: fuelType === ft ? IOS.amber : IOS.bg,
                          color: fuelType === ft ? '#fff' : '#555',
                          fontSize: 17, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        {ft === 'DIESEL' ? '경유' : '휘발유'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 주유: 주유일자 */}
              {modal === 'fuel' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>주유일자</label>
                  <input
                    name="fueled_at"
                    type="date"
                    defaultValue={today}
                    required
                    style={inputStyle}
                  />
                </div>
              )}

              {/* 주유: 리터당 가격 */}
              {modal === 'fuel' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>리터당 가격 (선택)</label>
                  <input
                    name="price_per_liter"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={1}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* 메모 */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>메모 (선택)</label>
                <input
                  name="memo"
                  type="text"
                  placeholder="메모 입력"
                  style={inputStyle}
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,59,48,0.1)',
                  border: '1px solid rgba(255,59,48,0.2)',
                  marginBottom: 14,
                }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: IOS.red, margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                style={{
                  width: '100%', minHeight: 52,
                  background: IOS.amber, color: '#fff',
                  border: 'none', borderRadius: 14,
                  fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', marginTop: 4,
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {isPending ? '등록 중...' : '등록하기'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
