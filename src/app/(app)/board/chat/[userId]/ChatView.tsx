'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessageAction } from '@/lib/actions/board'

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  isRead: boolean
  replyToId: string | null
  taggedStudentName: string | null
}

interface Student {
  id: string
  name: string
}

interface Props {
  currentUserId: string
  otherName: string
  driverId: string
  parentId: string
  isDriver: boolean
  messages: Message[]
  students: Student[]
}

export default function ChatView({
  currentUserId,
  otherName,
  driverId,
  parentId,
  isDriver,
  messages,
  students,
}: Props) {
  const router = useRouter()
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [taggedStudentId, setTaggedStudentId] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages])

  const msgMap = new Map(messages.map((m) => [m.id, m]))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    if (replyTo) formData.set('reply_to_id', replyTo.id)
    if (taggedStudentId) formData.set('tagged_student_id', taggedStudentId)

    startTransition(async () => {
      const result = await sendMessageAction(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        setReplyTo(null)
        setTaggedStudentId('')
        router.refresh()
      }
    })
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
    })
  }

  // 날짜 구분선 표시용
  let lastDate = ''

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--header-h)-64px)]">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#F2F2F7]">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#F2F2F7] text-[#6C6C70]"
        >
          ‹
        </button>
        <div className="flex-1">
          <p className="text-base font-semibold text-black">{otherName}</p>
          <p className="text-xs text-[#6C6C70]">{isDriver ? '학부모' : '버스기사'}</p>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[#6C6C70] mt-8">메시지를 시작해보세요.</p>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          const dateStr = new Date(msg.createdAt).toDateString()
          const showDate = dateStr !== lastDate
          lastDate = dateStr

          const replyMsg = msg.replyToId ? msgMap.get(msg.replyToId) : null

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-xs text-[#6C6C70] bg-[#E5E5EA] px-3 py-1 rounded-full">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
              )}

              <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* 아바타 (상대방만) */}
                {!isMine && (
                  <div className="w-8 h-8 rounded-full bg-[#F5A400]/20 flex items-center justify-center text-sm font-bold text-[#F5A400] flex-none self-end">
                    {otherName[0]}
                  </div>
                )}

                <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                  {/* 학생 태그 */}
                  {msg.taggedStudentName && (
                    <span className="text-xs text-[#5856D6] font-medium px-2">
                      {msg.taggedStudentName} 관련
                    </span>
                  )}

                  {/* 말풍선 */}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 ${
                      isMine
                        ? 'bg-[#F5A400] text-black rounded-br-md'
                        : 'bg-white text-black rounded-bl-md'
                    }`}
                  >
                    {/* 답장 미리보기 */}
                    {replyMsg && (
                      <div className={`mb-1.5 px-2 py-1.5 rounded-lg text-xs border-l-2 ${
                        isMine ? 'bg-black/10 border-black/30' : 'bg-[#F2F2F7] border-[#C6C6C8]'
                      }`}>
                        <p className="font-medium truncate">
                          {replyMsg.senderId === currentUserId ? '나' : otherName}
                        </p>
                        <p className="truncate opacity-80">{replyMsg.content}</p>
                      </div>
                    )}
                    <p className="text-base leading-snug break-words">{msg.content}</p>
                  </div>

                  {/* 시간 + 읽음 */}
                  <div className="flex items-center gap-1">
                    {isMine && msg.isRead && (
                      <span className="text-[10px] text-[#6C6C70]">읽음</span>
                    )}
                    <span className="text-[10px] text-[#6C6C70]">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>

                {/* 답장 버튼 */}
                <button
                  onClick={() => setReplyTo(msg)}
                  className="opacity-0 hover:opacity-100 focus:opacity-100 text-[#C6C6C8] text-lg px-1 flex-none"
                  aria-label="답장"
                >
                  ↩
                </button>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t border-[#F2F2F7] px-4 pb-[env(safe-area-inset-bottom)]">
        {/* 답장 미리보기 스트립 */}
        {replyTo && (
          <div className="flex items-center gap-2 pt-2 pb-1">
            <div className="flex-1 bg-[#F2F2F7] rounded-xl px-3 py-1.5 text-xs text-[#6C6C70] truncate">
              ↩ {replyTo.senderId === currentUserId ? '나' : otherName}: {replyTo.content}
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-[#6C6C70] text-base w-6 h-6 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}

        {/* 학생 태그 (DRIVER만) */}
        {isDriver && students.length > 0 && (
          <div className="pt-2 pb-1">
            <select
              value={taggedStudentId}
              onChange={(e) => setTaggedStudentId(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-[#C6C6C8] text-sm bg-white focus:outline-none focus:border-[#F5A400]"
            >
              <option value="">학생 태그 없음</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-xs text-[#FF3B30] pt-1">{error}</p>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2 py-2">
          <input type="hidden" name="driver_id" value={driverId} />
          <input type="hidden" name="parent_id" value={parentId} />

          <textarea
            ref={inputRef}
            name="content"
            rows={1}
            placeholder="메시지를 입력하세요"
            required
            className="flex-1 px-4 py-2.5 rounded-2xl border border-[#C6C6C8] text-base bg-[#F2F2F7] focus:outline-none focus:border-[#F5A400] resize-none leading-snug"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-11 h-11 rounded-full bg-[#F5A400] flex items-center justify-center flex-none disabled:opacity-60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
