'use client'

import { useState, useTransition } from 'react'
import { createInviteTokenAction } from '@/lib/actions/settings'

type TargetRole = 'PARENT' | 'DRIVER'

export default function InviteDrawer() {
  const [open, setOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresHours, setExpiresHours] = useState('48')
  const [targetRole, setTargetRole] = useState<TargetRole>('PARENT')
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    setError(null)
    setInviteUrl(null)
    startTransition(async () => {
      const result = await createInviteTokenAction(targetRole, parseInt(expiresHours))
      if (result.error) {
        setError(result.error)
      } else if (result.token) {
        setInviteUrl(`${window.location.origin}/invite/${result.token}`)
      }
    })
  }

  const handleCopy = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleClose = () => {
    setOpen(false)
    setInviteUrl(null)
    setError(null)
    setCopied(false)
    setTargetRole('PARENT')
  }

  const expireLabels: Record<string, string> = {
    '1': '1시간',
    '24': '24시간',
    '48': '48시간',
    '168': '7일',
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 16px', minHeight: 56, fontSize: 18, fontWeight: 500, color: '#111', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        초대 링크 생성
        <span style={{ color: '#C6C6C8', fontSize: 20 }}>›</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={handleClose} />
          <div style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 16px', borderBottom: '1px solid #F2F2F7' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111' }}>초대 링크 생성</h2>
              <button
                onClick={handleClose}
                style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7', border: 'none', borderRadius: 22, color: '#6C6C70', fontSize: 16, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 20px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 대상 역할 선택 */}
              <div>
                <label style={{ fontSize: 14, color: '#8E8E93', marginBottom: 6, display: 'block', fontWeight: 600 }}>초대 대상</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['PARENT', 'DRIVER'] as TargetRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      style={{
                        flex: 1, minHeight: 48, borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${targetRole === role ? '#F5A400' : '#E5E5EA'}`,
                        background: targetRole === role ? '#F5A400' : '#F2F2F7',
                        color: targetRole === role ? '#fff' : '#555',
                      }}
                    >
                      {role === 'PARENT' ? '학부모' : '버스기사'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 14, color: '#8E8E93', marginBottom: 6, display: 'block', fontWeight: 600 }}>유효기간</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1', '24', '48', '168'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setExpiresHours(h)}
                      style={{
                        flex: 1, minHeight: 44, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        border: `2px solid ${expiresHours === h ? '#F5A400' : '#E5E5EA'}`,
                        background: expiresHours === h ? '#F5A400' : '#F2F2F7',
                        color: expiresHours === h ? '#fff' : '#555',
                      }}
                    >
                      {expireLabels[h]}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#FF3B30', margin: 0 }}>{error}</p>
                </div>
              )}

              {inviteUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '14px', borderRadius: 10, background: '#F2F2F7', wordBreak: 'break-all' }}>
                    <p style={{ fontSize: 14, color: '#3C3C43', margin: 0 }}>{inviteUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    style={{ width: '100%', minHeight: 54, borderRadius: 14, background: '#111', color: '#fff', border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {copied ? '복사됨 ✓' : '링크 복사'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInviteUrl(null); setError(null) }}
                    style={{ width: '100%', minHeight: 54, borderRadius: 14, background: 'transparent', border: '1.5px solid #C6C6C8', color: '#6C6C70', fontSize: 18, fontWeight: 500, cursor: 'pointer' }}
                  >
                    새 링크 생성
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleGenerate}
                  style={{ width: '100%', minHeight: 54, borderRadius: 14, background: '#F5A400', color: '#fff', border: 'none', fontSize: 18, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
                >
                  {isPending ? '생성 중...' : '링크 생성'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
