'use client'

import { useState, useTransition } from 'react'
import { updatePasswordAction } from '@/lib/actions/settings'

const inputSty: React.CSSProperties = {
  width: '100%', borderRadius: 10, border: '1px solid #E5E5EA',
  padding: '14px 14px', fontSize: 18, background: '#F2F2F7',
  outline: 'none', boxSizing: 'border-box', color: '#111', fontFamily: 'inherit',
}
const labelSty: React.CSSProperties = {
  fontSize: 14, color: '#8E8E93', marginBottom: 6, display: 'block', fontWeight: 600,
}

export default function PasswordDrawer() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePasswordAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setOpen(false), 1200)
      }
    })
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(false); setError(null) }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 16px', minHeight: 56, fontSize: 18, fontWeight: 500, color: '#111', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        비밀번호 변경
        <span style={{ color: '#C6C6C8', fontSize: 20 }}>›</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setOpen(false)} />
          <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 16px', borderBottom: '1px solid #F2F2F7' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111' }}>비밀번호 변경</h2>
              <button
                onClick={() => setOpen(false)}
                style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7', border: 'none', borderRadius: 22, color: '#6C6C70', fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelSty}>새 비밀번호 <span style={{ color: '#FF3B30' }}>*</span></label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="8자 이상"
                  style={inputSty}
                />
              </div>
              <div>
                <label style={labelSty}>비밀번호 확인 <span style={{ color: '#FF3B30' }}>*</span></label>
                <input
                  name="confirm"
                  type="password"
                  required
                  placeholder="비밀번호 재입력"
                  style={inputSty}
                />
              </div>

              {error && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#FF3B30', margin: 0 }}>{error}</p>
                </div>
              )}
              {success && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.2)' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#34C759', margin: 0 }}>비밀번호가 변경되었습니다.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                style={{ width: '100%', minHeight: 54, borderRadius: 14, background: '#F5A400', color: '#fff', border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
              >
                {isPending ? '변경 중...' : '변경'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
