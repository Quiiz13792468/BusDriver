'use client'
// 학생관리 클라이언트 컴포넌트 — 검색, 정보 수정, 납부 기록, 신규 등록 모달 포함

import { useState, useTransition } from 'react'
import { registerStudentAction, updateStudentAction } from '@/lib/actions/students'
import { getStudentPaidMonthsAction } from '@/lib/actions/payments'

interface School { id: string; name: string; default_fee?: number | null }
interface Student {
  id: string; name: string; grade: string | null; ride_type: string
  payment_day: number | null; custom_fee: number | null; school_id: string | null
  phone: string | null; parent_name: string | null; parent_phone: string | null
  start_date: string | null; end_date: string | null; is_active: boolean
  schools: { id: string; name: string; default_fee: number | null } | null
}
interface Props { students: Student[]; schools: School[] }

const RIDE_COLOR: Record<string, string> = { BOTH: '#F5A400', MORNING: '#007AFF', AFTERNOON: '#34C759' }
const RIDE_LABEL: Record<string, string> = { BOTH: '등하교', MORNING: '등교', AFTERNOON: '하교' }
const HIST_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const inputSty: React.CSSProperties = {
  width: '100%', borderRadius: 10, border: '1px solid #E5E5EA',
  padding: '13px 14px', fontSize: 16, background: '#F2F2F7',
  outline: 'none', boxSizing: 'border-box', color: '#111',
}
const labelSty: React.CSSProperties = {
  fontSize: 14, color: '#8E8E93', marginBottom: 6, display: 'block', fontWeight: 500,
}
const GRADES = ['1학년', '2학년', '3학년']
const RIDE_TYPES = [
  { value: 'BOTH', label: '등하교' },
  { value: 'MORNING', label: '등교' },
  { value: 'AFTERNOON', label: '하교' },
]

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
  const [grade, setGrade] = useState(student.grade ?? '1학년')
  const [rideType, setRideType] = useState(student.ride_type ?? 'BOTH')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('grade', grade)
    fd.set('ride_type', rideType)
    startTransition(async () => {
      const res = await updateStudentAction(student.id, fd)
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <BottomSheet title="학생 정보 수정" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ padding: '16px 18px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelSty}>학교 <span style={{ fontSize: 12, color: '#8E8E93', fontWeight: 400 }}>(선택사항 — 학부모 가입 시 자동 연결)</span></label>
          <select name="school_id" defaultValue={student.school_id ?? ''} style={{ ...inputSty, appearance: 'none' }}>
            <option value="">학교 선택 (선택사항)</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSty}>학년 <span style={{ fontSize: 12, color: '#8E8E93', fontWeight: 400 }}>(매년 3/1 자동 진급, 3학년→졸업)</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            {GRADES.map(g => (
              <button key={g} type="button" onClick={() => setGrade(g)} style={{ flex: 1, minHeight: 48, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${grade === g ? '#F5A400' : '#E5E5EA'}`, background: grade === g ? '#F5A400' : '#F2F2F7', color: grade === g ? '#fff' : '#555' }}>{g}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelSty}>학생 이름 <span style={{ color: '#FF3B30' }}>*</span></label>
          <input name="name" type="text" required defaultValue={student.name} style={inputSty} />
        </div>
        <div>
          <label style={labelSty}>학생 전화번호</label>
          <input name="phone" type="tel" inputMode="tel" defaultValue={student.phone ?? ''} style={inputSty} />
        </div>
        <div>
          <label style={labelSty}>학부모 이름 (입금자명)</label>
          <input name="parent_name" type="text" defaultValue={student.parent_name ?? ''} style={inputSty} />
        </div>
        <div>
          <label style={labelSty}>학부모 전화번호</label>
          <input name="parent_phone" type="tel" inputMode="tel" defaultValue={student.parent_phone ?? ''} style={inputSty} />
        </div>
        <div>
          <label style={labelSty}>이용구분 <span style={{ color: '#FF3B30' }}>*</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            {RIDE_TYPES.map(rt => (
              <button key={rt.value} type="button" onClick={() => setRideType(rt.value)} style={{ flex: 1, minHeight: 48, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${rideType === rt.value ? '#F5A400' : '#E5E5EA'}`, background: rideType === rt.value ? '#F5A400' : '#F2F2F7', color: rideType === rt.value ? '#fff' : '#555' }}>{rt.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelSty}>시작일 <span style={{ color: '#FF3B30' }}>*</span></label>
            <input name="start_date" type="date" defaultValue={student.start_date ?? ''} style={inputSty} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelSty}>종료일 <span style={{ fontSize: 12, color: '#8E8E93', fontWeight: 400 }}>(이용 종료 시)</span></label>
            <input name="end_date" type="date" defaultValue={student.end_date ?? ''} style={inputSty} />
          </div>
        </div>
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FF3B3010', border: '1px solid #FF3B3030' }}>
            <p style={{ fontSize: 14, color: '#FF3B30', fontWeight: 500 }}>{error}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, minHeight: 54, background: '#F2F2F7', color: '#333', border: '2px solid #E5E5EA', borderRadius: 14, fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>닫기</button>
          <button type="submit" disabled={isPending} style={{ flex: 1, minHeight: 54, background: '#F5A400', color: '#fff', border: 'none', borderRadius: 14, fontSize: 18, fontWeight: 800, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>{isPending ? '저장 중...' : '저장'}</button>
        </div>
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
  const [grade, setGrade] = useState('1학년')
  const [rideType, setRideType] = useState('BOTH')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('grade', grade)
    fd.set('ride_type', rideType)
    startTransition(async () => {
      const res = await registerStudentAction(fd)
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <BottomSheet title="학생 등록" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ padding: '16px 18px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelSty}>학교 <span style={{ fontSize: 12, color: '#8E8E93', fontWeight: 400 }}>(선택사항 — 학부모 가입 시 자동 연결)</span></label>
          <select name="school_id" style={{ ...inputSty, appearance: 'none' }}>
            <option value="">학교 선택 (선택사항)</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSty}>학년 <span style={{ fontSize: 12, color: '#8E8E93', fontWeight: 400 }}>(매년 3/1 자동 진급, 3학년→졸업)</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            {GRADES.map(g => (
              <button key={g} type="button" onClick={() => setGrade(g)} style={{ flex: 1, minHeight: 48, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${grade === g ? '#F5A400' : '#E5E5EA'}`, background: grade === g ? '#F5A400' : '#F2F2F7', color: grade === g ? '#fff' : '#555' }}>{g}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelSty}>학생 이름 <span style={{ color: '#FF3B30' }}>*</span></label>
          <input name="name" type="text" required placeholder="홍길동" style={inputSty} />
        </div>
        <div>
          <label style={labelSty}>학생 전화번호</label>
          <input name="phone" type="tel" inputMode="tel" placeholder="010-0000-0000" style={inputSty} />
        </div>
        <div>
          <label style={labelSty}>학부모 이름 (입금자명)</label>
          <input name="parent_name" type="text" placeholder="홍부모" style={inputSty} />
        </div>
        <div>
          <label style={labelSty}>학부모 전화번호</label>
          <input name="parent_phone" type="tel" inputMode="tel" placeholder="010-0000-0000" style={inputSty} />
        </div>
        <div>
          <label style={labelSty}>이용구분 <span style={{ color: '#FF3B30' }}>*</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            {RIDE_TYPES.map(rt => (
              <button key={rt.value} type="button" onClick={() => setRideType(rt.value)} style={{ flex: 1, minHeight: 48, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${rideType === rt.value ? '#F5A400' : '#E5E5EA'}`, background: rideType === rt.value ? '#F5A400' : '#F2F2F7', color: rideType === rt.value ? '#fff' : '#555' }}>{rt.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelSty}>시작일 <span style={{ color: '#FF3B30' }}>*</span></label>
            <input name="start_date" type="date" style={inputSty} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelSty}>종료일 <span style={{ fontSize: 12, color: '#8E8E93', fontWeight: 400 }}>(이용 종료 시)</span></label>
            <input name="end_date" type="date" style={inputSty} />
          </div>
        </div>
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FF3B3010', border: '1px solid #FF3B3030' }}>
            <p style={{ fontSize: 14, color: '#FF3B30', fontWeight: 500 }}>{error}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, minHeight: 54, background: '#F2F2F7', color: '#333', border: '2px solid #E5E5EA', borderRadius: 14, fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>닫기</button>
          <button type="submit" disabled={isPending} style={{ flex: 1, minHeight: 54, background: '#F5A400', color: '#fff', border: 'none', borderRadius: 14, fontSize: 18, fontWeight: 800, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>{isPending ? '등록 중...' : '등록'}</button>
        </div>
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
      {/* 단일 행 헤더: 제목 + 검색 + 버튼 */}
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#111', flexShrink: 0 }}>학생관리</span>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름 또는 학교 검색"
            style={{ width: '100%', height: 40, borderRadius: 10, border: 'none', background: '#F2F2F7', paddingLeft: 36, paddingRight: 12, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#8E8E93', pointerEvents: 'none' }}>🔍</span>
        </div>
        <button
          onClick={() => setRegisterOpen(true)}
          style={{ flexShrink: 0, height: 40, paddingLeft: 14, paddingRight: 14, borderRadius: 20, background: '#F5A400', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          + 학생
        </button>
      </div>

      {/* 학생 카드 목록 */}
      <div style={{ padding: '4px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!filtered.length ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '32px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#8E8E93' }}>
              {search ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
            </p>
          </div>
        ) : (
          filtered.map((s) => {
            const fee = s.custom_fee ?? s.schools?.default_fee
            return (
              <div key={s.id} style={{
                background: '#fff', borderRadius: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                border: '1.5px solid #F5A40033',
                padding: '12px 12px',
                opacity: s.is_active ? 1 : 0.65,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {/* 학생 정보 — 왼쪽 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{s.name}</span>
                    <span style={{
                      fontSize: 14, fontWeight: 700, borderRadius: 8, padding: '2px 10px',
                      color: '#fff', flexShrink: 0,
                      background: s.is_active ? RIDE_COLOR[s.ride_type] : '#8E8E93',
                    }}>
                      {s.is_active ? RIDE_LABEL[s.ride_type] : '종료'}
                    </span>
                  </div>
                  {(s.schools?.name || s.grade) && (
                    <p style={{ fontSize: 14, color: '#8E8E93', margin: '0 0 2px' }}>
                      {[s.schools?.name, s.grade].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {fee != null && (
                    <p style={{ fontSize: 14, color: '#555', margin: 0 }}>₩{fee.toLocaleString('ko-KR')}/월</p>
                  )}
                </div>
                {/* 버튼 — 오른쪽 세로 배치 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setInfoStudent(s)} style={{ minWidth: 64, minHeight: 48, borderRadius: 12, border: '2px solid #E5E5EA', background: '#F2F2F7', fontSize: 16, fontWeight: 800, color: '#333', cursor: 'pointer' }}>정보</button>
                  <button onClick={() => setHistStudent(s)} style={{ minWidth: 64, minHeight: 48, borderRadius: 12, border: 'none', background: '#F5A400', fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer' }}>기록</button>
                </div>
              </div>
            )
          })
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
