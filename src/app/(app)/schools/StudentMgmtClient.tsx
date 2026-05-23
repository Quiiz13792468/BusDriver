'use client'
// 학생관리 클라이언트 컴포넌트 — 검색, 정보 수정, 납부 기록, 신규 등록 모달 포함

import { useState, useTransition } from 'react'
import { registerStudentAction, updateStudentAction } from '@/lib/actions/students'
import { getStudentPaidMonthsAction } from '@/lib/actions/payments'

interface School { id: string; name: string; default_fee?: number | null }
interface Student {
  id: string; name: string; ride_type: string; payment_day: number | null
  custom_fee: number | null; school_id: string | null; phone: string | null
  parent_name: string | null; parent_phone: string | null
  start_date: string | null; end_date: string | null; is_active: boolean
  schools: { id: string; name: string; default_fee: number | null } | null
}
interface Props { students: Student[]; schools: School[] }

const RIDE_COLOR: Record<string, string> = { BOTH: '#F5A400', MORNING: '#007AFF', AFTERNOON: '#34C759' }
const RIDE_LABEL: Record<string, string> = { BOTH: '등하교', MORNING: '등교', AFTERNOON: '하교' }
const HIST_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const inputSty: React.CSSProperties = {
  width: '100%', height: 48, borderRadius: 14, border: '1.5px solid #E5E5EA',
  paddingLeft: 16, paddingRight: 16, fontSize: 16, background: '#fff',
  outline: 'none', boxSizing: 'border-box',
}

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '24px 24px 0 0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F2F2F7' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: '#F2F2F7', border: 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function StudentInfoModal({ student, schools, onClose }: { student: Student; schools: School[]; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateStudentAction(student.id, fd)
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <BottomSheet title="학생 정보" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학교</label>
          <select name="school_id" defaultValue={student.school_id ?? ''} style={{ ...inputSty, appearance: 'none' }}>
            <option value="">학교 없음</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학생 이름 <span style={{ color: '#FF3B30' }}>*</span></label>
          <input name="name" type="text" required defaultValue={student.name} style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학생 전화번호</label>
          <input name="phone" type="tel" defaultValue={student.phone ?? ''} style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학부모 이름</label>
          <input name="parent_name" type="text" defaultValue={student.parent_name ?? ''} style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학부모 전화번호</label>
          <input name="parent_phone" type="tel" defaultValue={student.parent_phone ?? ''} style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>이용 구분</label>
          <select name="ride_type" defaultValue={student.ride_type} style={{ ...inputSty, appearance: 'none' }}>
            <option value="BOTH">등하교</option>
            <option value="MORNING">등교만</option>
            <option value="AFTERNOON">하교만</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>매월 입금일</label>
          <input name="payment_day" type="number" min={1} max={31} defaultValue={student.payment_day ?? ''} placeholder="예: 25" style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>개별 이용금액</label>
          <input name="custom_fee" type="number" min={0} defaultValue={student.custom_fee ?? ''} placeholder="학교 기본금액 사용" style={inputSty} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>시작일</label>
            <input name="start_date" type="date" defaultValue={student.start_date ?? ''} style={inputSty} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>종료일</label>
            <input name="end_date" type="date" defaultValue={student.end_date ?? ''} style={inputSty} />
          </div>
        </div>
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FF3B3010', border: '1px solid #FF3B3030' }}>
            <p style={{ fontSize: 14, color: '#FF3B30', fontWeight: 500 }}>{error}</p>
          </div>
        )}
        <button type="submit" disabled={isPending} style={{ width: '100%', height: 56, borderRadius: 28, background: '#F5A400', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
          {isPending ? '저장 중...' : '저장'}
        </button>
      </form>
    </BottomSheet>
  )
}

function StudentHistModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [paidMonths, setPaidMonths] = useState<number[] | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async (y: number) => {
    setLoading(true)
    const months = await getStudentPaidMonthsAction(student.id, y)
    setPaidMonths(months)
    setLoading(false)
  }

  // load on mount
  useState(() => { load(year) })

  const changeYear = (y: number) => {
    setYear(y)
    load(y)
  }

  return (
    <BottomSheet title={`납부 기록 — ${student.name}`} onClose={onClose}>
      <div style={{ padding: '16px 20px 32px' }}>
        {/* 연도 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
          <button onClick={() => changeYear(year - 1)} style={{ width: 36, height: 36, borderRadius: 18, background: '#F2F2F7', border: 'none', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <span style={{ fontSize: 18, fontWeight: 700, minWidth: 60, textAlign: 'center' }}>{year}년</span>
          <button onClick={() => changeYear(year + 1)} disabled={year >= currentYear} style={{ width: 36, height: 36, borderRadius: 18, background: '#F2F2F7', border: 'none', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: year >= currentYear ? 0.3 : 1 }}>›</button>
        </div>
        {/* 월별 그리드 */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#8E8E93', padding: '20px 0' }}>불러오는 중...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {HIST_MONTHS.map((label, i) => {
              const paid = (paidMonths ?? []).includes(i + 1)
              return (
                <div key={i} style={{
                  height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: paid ? '#F5A400' : '#F2F2F7',
                  color: paid ? '#fff' : '#8E8E93',
                  fontSize: 15, fontWeight: paid ? 700 : 400,
                }}>
                  {label}
                </div>
              )
            })}
          </div>
        )}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#8E8E93', marginTop: 16 }}>
          {year}년 총 {(paidMonths ?? []).length}개월 납부
        </p>
      </div>
    </BottomSheet>
  )
}

function StudentRegisterModal({ schools, onClose }: { schools: School[]; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await registerStudentAction(fd)
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <BottomSheet title="학생 등록" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학교</label>
          <select name="school_id" style={{ ...inputSty, appearance: 'none' }}>
            <option value="">학교 선택 (선택사항)</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학생 이름 <span style={{ color: '#FF3B30' }}>*</span></label>
          <input name="name" type="text" required placeholder="홍길동" style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학생 전화번호</label>
          <input name="phone" type="tel" placeholder="010-0000-0000" style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학부모 이름</label>
          <input name="parent_name" type="text" placeholder="홍부모" style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>학부모 전화번호</label>
          <input name="parent_phone" type="tel" placeholder="010-0000-0000" style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>이용 구분</label>
          <select name="ride_type" defaultValue="BOTH" style={{ ...inputSty, appearance: 'none' }}>
            <option value="BOTH">등하교</option>
            <option value="MORNING">등교만</option>
            <option value="AFTERNOON">하교만</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>매월 입금일</label>
          <input name="payment_day" type="number" min={1} max={31} placeholder="예: 25" style={inputSty} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>개별 이용금액</label>
          <input name="custom_fee" type="number" min={0} placeholder="학교 기본금액 사용" style={inputSty} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>시작일</label>
            <input name="start_date" type="date" style={inputSty} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 14, color: '#8E8E93', fontWeight: 500 }}>종료일</label>
            <input name="end_date" type="date" style={inputSty} />
          </div>
        </div>
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FF3B3010', border: '1px solid #FF3B3030' }}>
            <p style={{ fontSize: 14, color: '#FF3B30', fontWeight: 500 }}>{error}</p>
          </div>
        )}
        <button type="submit" disabled={isPending} style={{ width: '100%', height: 56, borderRadius: 28, background: '#F5A400', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
          {isPending ? '등록 중...' : '학생 등록'}
        </button>
      </form>
    </BottomSheet>
  )
}

export default function StudentMgmtClient({ students, schools }: Props) {
  const [search, setSearch] = useState('')
  const [infoStudent, setInfoStudent] = useState<Student | null>(null)
  const [histStudent, setHistStudent] = useState<Student | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)

  const filtered = students
    .filter(s => s.name.includes(search) || (s.schools?.name ?? '').includes(search))
    .sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
      return a.name.localeCompare(b.name, 'ko')
    })

  return (
    <>
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>학생관리</h1>
          <button
            onClick={() => setRegisterOpen(true)}
            style={{ height: 40, paddingLeft: 16, paddingRight: 16, borderRadius: 20, background: '#F5A400', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            + 학생
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름 또는 학교 검색"
            style={{ width: '100%', height: 44, borderRadius: 12, border: '1.5px solid #E5E5EA', background: '#F2F2F7', paddingLeft: 40, paddingRight: 16, fontSize: 16, boxSizing: 'border-box', outline: 'none' }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: '#8E8E93', pointerEvents: 'none' }}>🔍</span>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, margin: '4px 16px 8px', overflow: 'hidden' }}>
        {!filtered.length ? (
          <p style={{ padding: '32px 16px', textAlign: 'center', fontSize: 15, color: '#8E8E93' }}>
            {search ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {filtered.map((s, i) => (
              <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #F2F2F7' : 'none', opacity: s.is_active ? 1 : 0.65 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{s.name}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, borderRadius: 6, padding: '2px 8px',
                      color: s.is_active ? RIDE_COLOR[s.ride_type] : '#8E8E93',
                      background: s.is_active ? `${RIDE_COLOR[s.ride_type]}18` : '#F2F2F7',
                      border: `1px solid ${s.is_active ? RIDE_COLOR[s.ride_type] : '#C6C6C8'}`,
                    }}>
                      {s.is_active ? RIDE_LABEL[s.ride_type] : '종료'}
                    </span>
                  </div>
                  {s.schools?.name && (
                    <p style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>{s.schools.name}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                  <button onClick={() => setInfoStudent(s)} style={{ height: 36, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1.5px solid #E5E5EA', background: '#F2F2F7', fontSize: 14, fontWeight: 600, color: '#3C3C43', cursor: 'pointer' }}>정보</button>
                  <button onClick={() => setHistStudent(s)} style={{ height: 36, paddingLeft: 14, paddingRight: 14, borderRadius: 10, border: '1.5px solid #E5E5EA', background: '#F2F2F7', fontSize: 14, fontWeight: 600, color: '#3C3C43', cursor: 'pointer' }}>기록</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#8E8E93', marginBottom: 16 }}>
        총 {students.filter(s => s.is_active).length}명 이용 중
      </p>

      {infoStudent && <StudentInfoModal student={infoStudent} schools={schools} onClose={() => setInfoStudent(null)} />}
      {histStudent && <StudentHistModal student={histStudent} onClose={() => setHistStudent(null)} />}
      {registerOpen && <StudentRegisterModal schools={schools} onClose={() => setRegisterOpen(false)} />}
    </>
  )
}
