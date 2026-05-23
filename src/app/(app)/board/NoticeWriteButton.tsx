'use client'

import { useState, useTransition } from 'react'
import { createNoticeAction } from '@/lib/actions/board'

interface School {
  id: string
  name: string
}

interface Props {
  schools: School[]
  driverId: string
}

const inputSty: React.CSSProperties = {
  width: '100%', borderRadius: 10, border: '1px solid #E5E5EA',
  padding: '14px 14px', fontSize: 18, background: '#F2F2F7',
  outline: 'none', boxSizing: 'border-box', color: '#111', fontFamily: 'inherit',
}
const labelSty: React.CSSProperties = {
  fontSize: 14, color: '#8E8E93', marginBottom: 6, display: 'block', fontWeight: 600,
}

export default function NoticeWriteButton({ schools }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createNoticeAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ width: '100%', background: '#F5A400', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 800, cursor: 'pointer', minHeight: 48 }}
      >
        + 공지 작성
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 16px', borderBottom: '1px solid #F2F2F7' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111' }}>전체 공지 작성</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7', border: 'none', borderRadius: 22, color: '#6C6C70', fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelSty}>대상 학교</label>
                <select name="school_id" style={{ ...inputSty, height: 52 }}>
                  <option value="">전체</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelSty}>제목 <span style={{ color: '#FF3B30' }}>*</span></label>
                <input name="title" type="text" required placeholder="공지 제목" style={inputSty} />
              </div>
              <div>
                <label style={labelSty}>내용 <span style={{ color: '#FF3B30' }}>*</span></label>
                <textarea
                  name="content"
                  required
                  rows={5}
                  placeholder="공지 내용을 입력하세요"
                  style={{ ...inputSty, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              {error && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#FF3B30', margin: 0 }}>{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isPending}
                style={{ width: '100%', minHeight: 54, borderRadius: 14, background: '#F5A400', color: '#fff', border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
              >
                {isPending ? '발송 중...' : '공지 발송'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
