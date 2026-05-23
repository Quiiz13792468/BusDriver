'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerPaymentAction } from '@/lib/actions/payments'

interface ModalData {
  studentId: string
  studentName: string
  month: number
  year: number
  defaultAmount: number
}

interface Props {
  data: ModalData
  onClose: () => void
}

export default function MatrixRegisterModal({ data, onClose }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 해당 월의 기본 날짜: year-month-01
  const defaultDate = `${data.year}-${String(data.month).padStart(2, '0')}-01`

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('student_id', data.studentId)
    startTransition(async () => {
      const result = await registerPaymentAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        onClose()
        router.refresh()
      }
    })
  }

  const inputSty: React.CSSProperties = {
    width: '100%', borderRadius: 10, border: '1px solid #E5E5EA',
    padding: '14px 14px', fontSize: 18, background: '#F2F2F7',
    outline: 'none', boxSizing: 'border-box', color: '#111', fontFamily: 'inherit',
  }
  const labelSty: React.CSSProperties = {
    fontSize: 14, color: '#8E8E93', marginBottom: 6, display: 'block', fontWeight: 600,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 16px', borderBottom: '1px solid #F2F2F7' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>입금 등록</h2>
            <p style={{ fontSize: 14, color: '#6C6C70', margin: 0 }}>
              {data.studentName} · {data.year}년 {data.month}월
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7', border: 'none', borderRadius: 22, color: '#6C6C70', fontSize: 16, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 금액 (프리필) */}
          <div>
            <label style={labelSty}>금액 <span style={{ color: '#FF3B30' }}>*</span></label>
            <input
              name="amount"
              type="number"
              inputMode="numeric"
              min={1}
              required
              defaultValue={data.defaultAmount || ''}
              placeholder="0"
              style={inputSty}
            />
          </div>

          {/* 입금일 */}
          <div>
            <label style={labelSty}>입금일 <span style={{ color: '#FF3B30' }}>*</span></label>
            <input
              name="paid_at"
              type="date"
              required
              defaultValue={defaultDate}
              style={inputSty}
            />
          </div>

          {/* 메모 */}
          <div>
            <label style={labelSty}>메모</label>
            <input
              name="memo"
              type="text"
              placeholder="메모 (선택사항)"
              style={inputSty}
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
            {isPending ? '등록 중...' : '등록'}
          </button>
        </form>
      </div>
    </div>
  )
}
