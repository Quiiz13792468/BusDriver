// 학생 등록 바텀시트 팝업 — 디자인 목업 픽셀 퍼펙트 구현
'use client'

import { useState, useTransition } from 'react'
import { registerStudentAction } from '@/lib/actions/students'

interface School {
  id: string
  name: string
}

interface Props {
  schools: School[]
  driverId: string
}

const IOS = {
  green: '#34C759',
  red: '#FF3B30',
  amber: '#F5A400',
  blue: '#007AFF',
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
  border: `1px solid ${IOS.sep}`,
  color: '#111',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  color: IOS.label,
  marginBottom: 6,
  display: 'block',
  fontWeight: 500,
}

const GRADES = ['1학년', '2학년', '3학년']
const USE_TYPES = ['등하교', '등교', '하교']

export default function StudentRegisterButton({ schools, driverId }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [grade, setGrade] = useState('1학년')
  const [useType, setUseType] = useState('등하교')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('grade', grade)
    formData.set('ride_type', useType === '등하교' ? 'BOTH' : useType === '등교' ? 'MORNING' : 'AFTERNOON')
    startTransition(async () => {
      const result = await registerStudentAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        setGrade('1학년')
        setUseType('등하교')
      }
    })
  }

  const handleOpen = () => {
    setError(null)
    setGrade('1학년')
    setUseType('등하교')
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setError(null)
  }

  const ToggleBtn = ({
    active,
    label,
    onClick,
  }: {
    active: boolean
    label: string
    onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        border: `1.5px solid ${active ? IOS.amber : IOS.sep}`,
        background: active ? IOS.amber : IOS.bg,
        color: active ? '#fff' : '#555',
      }}
    >
      {label}
    </button>
  )

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          height: 40,
          paddingLeft: 16,
          paddingRight: 16,
          borderRadius: 9999,
          background: IOS.amber,
          color: '#000',
          fontSize: 14,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        + 학생 등록
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 70,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={handleClose}
        >
          <div
            style={{
              background: IOS.card,
              borderRadius: '20px 20px 0 0',
              padding: '20px 18px 40px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700 }}>학생 등록</span>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: IOS.label,
                  minWidth: 44,
                  minHeight: 44,
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* 학교 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  학교{' '}
                  <span style={{ fontSize: 12, color: IOS.label, fontWeight: 400 }}>
                    (선택사항 — 학부모 가입 시 자동 연결)
                  </span>
                </label>
                <select
                  name="school_id"
                  style={{ ...inputStyle, appearance: 'none' as const }}
                >
                  <option value="">학교 선택 (선택사항)</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 학년 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  학년{' '}
                  <span style={{ fontSize: 12, color: IOS.label, fontWeight: 400 }}>
                    (매년 3/1 자동 진급, 3학년→졸업)
                  </span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {GRADES.map((g) => (
                    <ToggleBtn
                      key={g}
                      active={grade === g}
                      label={g}
                      onClick={() => setGrade(g)}
                    />
                  ))}
                </div>
              </div>

              {/* 학생 이름 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  학생 이름 <span style={{ color: IOS.red }}>*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="홍길동"
                  style={inputStyle}
                />
              </div>

              {/* 학생 전화번호 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>학생 전화번호</label>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="010-0000-0000"
                  style={inputStyle}
                />
              </div>

              {/* 학부모 이름 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>학부모 이름 (입금자명)</label>
                <input
                  name="parent_name"
                  type="text"
                  placeholder="홍부모"
                  style={inputStyle}
                />
              </div>

              {/* 학부모 전화번호 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>학부모 전화번호</label>
                <input
                  name="parent_phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="010-0000-0000"
                  style={inputStyle}
                />
              </div>

              {/* 이용구분 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  이용구분 <span style={{ color: IOS.red }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {USE_TYPES.map((t) => (
                    <ToggleBtn
                      key={t}
                      active={useType === t}
                      label={t}
                      onClick={() => setUseType(t)}
                    />
                  ))}
                </div>
              </div>

              {/* 시작일 / 종료일 */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>
                    시작일 <span style={{ color: IOS.red }}>*</span>
                  </label>
                  <input
                    name="start_date"
                    type="date"
                    defaultValue="2026-03-01"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>
                    종료일{' '}
                    <span style={{ fontSize: 12, color: IOS.label, fontWeight: 400 }}>
                      (이용 종료 시)
                    </span>
                  </label>
                  <input name="end_date" type="date" style={inputStyle} />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: `${IOS.red}18`,
                    border: `1px solid ${IOS.red}33`,
                    marginBottom: 16,
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 500, color: IOS.red }}>{error}</p>
                </div>
              )}

              {/* 버튼 2개 나란히 */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    flex: 1,
                    minHeight: 54,
                    background: IOS.bg,
                    color: '#333',
                    border: `2px solid ${IOS.sep}`,
                    borderRadius: 14,
                    fontSize: 18,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    flex: 1,
                    minHeight: 54,
                    background: IOS.amber,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 18,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  {isPending ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
