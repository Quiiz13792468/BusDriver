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

  const inputClass = 'w-full px-4 py-3 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400]'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 rounded-full bg-[#F5A400] text-black text-sm font-semibold"
      >
        공지 작성
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
              <h2 className="text-lg font-bold">공지 작성</h2>
              <button onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 pb-8">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">대상 학교</label>
                <select name="school_id"
                  className="w-full h-12 px-4 rounded-2xl border border-[#C6C6C8] text-base bg-white focus:outline-none focus:border-[#F5A400]">
                  <option value="">전체</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">제목 *</label>
                <input name="title" type="text" required placeholder="공지 제목" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#6C6C70]">내용 *</label>
                <textarea name="content" required rows={5} placeholder="공지 내용을 입력하세요"
                  className={`${inputClass} resize-none`} />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20">
                  <p className="text-sm font-medium text-[#FF3B30]">{error}</p>
                </div>
              )}
              <button type="submit" disabled={isPending}
                className="w-full h-14 rounded-full bg-[#F5A400] text-black text-base font-bold disabled:opacity-60">
                {isPending ? '등록 중...' : '공지 등록'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
