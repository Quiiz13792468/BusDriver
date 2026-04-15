'use client'

import { useState, useTransition } from 'react'
import { createInviteTokenAction } from '@/lib/actions/settings'

interface Student {
  id: string
  name: string
}

interface Props {
  students: Student[]
}

export default function InviteDrawer({ students }: Props) {
  const [open, setOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expiresHours, setExpiresHours] = useState('48')
  const [targetStudentId, setTargetStudentId] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    setError(null)
    setInviteUrl(null)
    startTransition(async () => {
      const result = await createInviteTokenAction(
        'PARENT',
        parseInt(expiresHours),
        targetStudentId || null,
      )
      if (result.error) {
        setError(result.error)
      } else if (result.token) {
        const origin = window.location.origin
        setInviteUrl(`${origin}/invite/${result.token}`)
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
        className="flex items-center justify-between w-full px-4 py-4 text-base text-black"
      >
        초대 링크 생성
        <span className="text-[#C6C6C8]">›</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold">초대 링크 생성</h2>
              <button
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 pb-8">
              {/* 유효기간 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">유효기간</label>
                <div className="flex gap-2">
                  {['1', '24', '48', '168'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setExpiresHours(h)}
                      className={`flex-1 h-11 rounded-2xl border text-sm font-medium ${
                        expiresHours === h
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-[#6C6C70] border-[#C6C6C8]'
                      }`}
                    >
                      {expireLabels[h]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 학생 태그 (선택) */}
              {students.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#6C6C70]">자녀 학생 지정 (선택)</label>
                  <select
                    value={targetStudentId}
                    onChange={(e) => setTargetStudentId(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400]"
                  >
                    <option value="">지정 안 함</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#6C6C70] px-1">
                    지정하면 학부모 가입 시 해당 학생이 자동 연결됩니다.
                  </p>
                </div>
              )}

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                  <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
                </div>
              )}

              {/* 생성된 링크 */}
              {inviteUrl && (
                <div className="space-y-2">
                  <div className="px-4 py-3 rounded-2xl bg-[#F2F2F7] break-all">
                    <p className="text-sm text-[#3C3C43]">{inviteUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full h-12 rounded-full bg-black text-white text-base font-semibold"
                  >
                    {copied ? '복사됨 ✓' : '링크 복사'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInviteUrl(null); setError(null) }}
                    className="w-full h-12 rounded-full border border-[#C6C6C8] text-[#6C6C70] text-base"
                  >
                    새 링크 생성
                  </button>
                </div>
              )}

              {!inviteUrl && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleGenerate}
                  className="w-full h-14 rounded-full bg-[#F5A400] text-black text-base font-bold disabled:opacity-60"
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
