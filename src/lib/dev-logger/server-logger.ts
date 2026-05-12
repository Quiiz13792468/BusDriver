/**
 * 서버 사이드 개발 로거
 * - .dev-logs/session-YYYY-MM-DD.jsonl 에 append
 * - production 에서는 모든 함수가 noop
 */

import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { DevLogEntry } from './types'
import { sanitizePayload } from './sanitize'

const IS_DEV = process.env.NODE_ENV !== 'production'
const LOG_DIR = join(process.cwd(), '.dev-logs')

function getLogFilePath(): string {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return join(LOG_DIR, `session-${today}.jsonl`)
}

/** 엔트리를 JSONL 파일에 동기 append */
export function appendLog(entry: DevLogEntry): void {
  if (!IS_DEV) return
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    appendFileSync(getLogFilePath(), JSON.stringify(entry) + '\n', 'utf8')
  } catch {
    // 파일 쓰기 실패는 무시 (개발 편의 도구)
  }
}

/**
 * Server Action 래퍼 — 비파괴적 고차 함수
 *
 * 사용 예:
 *   export const loginAction = withActionLog('loginAction', async (...) => { ... })
 *
 * 기존 액션에 점진적으로 적용 가능 (시그니처 변경 없음)
 */
export function withActionLog<TArgs extends unknown[], TReturn>(
  name: string,
  fn: (...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<TReturn> {
  if (!IS_DEV) return fn

  return async (...args: TArgs): Promise<TReturn> => {
    const start = Date.now()
    let ok = true
    let errorMsg: string | undefined

    // 입력 요약: 첫 번째 인자만, 마스킹 후 기록
    const inputSummary =
      args.length > 0
        ? sanitizePayload(
            typeof args[0] === 'object' && args[0] !== null
              ? args[0]
              : { arg0: args[0] },
          )
        : undefined

    try {
      const result = await fn(...args)
      return result
    } catch (e) {
      ok = false
      errorMsg = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      const durationMs = Date.now() - start
      appendLog({
        ts: new Date().toISOString(),
        kind: 'action',
        label: name,
        payload: inputSummary,
        durationMs,
        ok,
        error: errorMsg,
      })
    }
  }
}

/**
 * API 라우트 로그 헬퍼
 * Next.js route handler 내에서 직접 호출
 *
 * 사용 예:
 *   logApiCall('GET /api/foo', 200, 45)
 */
export function logApiCall(
  label: string,
  status: number,
  durationMs: number,
  error?: string,
): void {
  if (!IS_DEV) return
  appendLog({
    ts: new Date().toISOString(),
    kind: 'api',
    label,
    status,
    durationMs,
    ok: status >= 200 && status < 400,
    error,
  })
}
