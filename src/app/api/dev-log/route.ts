/**
 * 개발 모드 전용 로그 수신 엔드포인트
 * POST /api/dev-log
 *
 * 클라이언트 배치 → 파일 append
 * production 에서는 404 반환
 */

import { NextRequest, NextResponse } from 'next/server'
import { appendLog } from '@/lib/dev-logger/server-logger'
import { sanitizePayload } from '@/lib/dev-logger/sanitize'
import type { DevLogEntry } from '@/lib/dev-logger/types'

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: { entries?: DevLogEntry[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const entries = body?.entries
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: 'No entries' }, { status: 400 })
  }

  // 최대 100건 제한 (배치 overflow 방지)
  const limited = entries.slice(0, 100)
  for (const entry of limited) {
    const sanitized: DevLogEntry = entry.payload !== undefined
      ? { ...entry, payload: sanitizePayload(entry.payload) }
      : entry
    appendLog(sanitized)
  }

  return NextResponse.json({ ok: true, written: limited.length })
}
