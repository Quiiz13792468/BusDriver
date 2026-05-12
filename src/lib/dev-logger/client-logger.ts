'use client'

/**
 * 클라이언트 사이드 개발 로거
 * - 배치(1초 or 10건)로 /api/dev-log 에 POST
 * - production 빌드에서는 모든 함수가 noop
 */

import type { DevLogEntry, DevLogKind, DevLogSession } from './types'
import { sanitizePayload } from './sanitize'

const IS_DEV = process.env.NODE_ENV !== 'production'
const BATCH_INTERVAL_MS = 1000
const BATCH_MAX_SIZE = 10

let _session: DevLogSession = {}
let _pathname = ''
const _queue: DevLogEntry[] = []
let _timer: ReturnType<typeof setTimeout> | null = null

/** 세션 컨텍스트 설정 (userId, role, schoolId) */
export function setDevLogSession(session: DevLogSession) {
  if (!IS_DEV) return
  _session = { ..._session, ...session }
}

/** 현재 pathname 갱신 (DevLogProvider에서 호출) */
export function setDevLogPathname(pathname: string) {
  if (!IS_DEV) return
  _pathname = pathname
}

/** 로그 엔트리 큐에 추가 */
function enqueue(entry: DevLogEntry) {
  _queue.push(entry)
  if (_queue.length >= BATCH_MAX_SIZE) {
    flush()
    return
  }
  if (!_timer) {
    _timer = setTimeout(flush, BATCH_INTERVAL_MS)
  }
}

/** 큐를 서버로 전송 */
function flush() {
  if (_timer) {
    clearTimeout(_timer)
    _timer = null
  }
  if (_queue.length === 0) return

  const entries = _queue.splice(0)

  // fetch는 fire-and-forget, 실패해도 앱에 영향 없음
  fetch('/api/dev-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries }),
    // keepalive: 페이지 언로드 시에도 전송 시도
    keepalive: true,
  }).catch(() => {
    // 로깅 실패는 무시 (개발 편의 도구이므로)
  })
}

/** 페이지 이동 로그 */
export function logPageView(pathname: string) {
  if (!IS_DEV) return
  enqueue({
    ts: new Date().toISOString(),
    kind: 'page_view' as DevLogKind,
    pathname,
    session: { ..._session },
  })
}

/** 클릭 로그 */
export function logClick(label: string, target: string) {
  if (!IS_DEV) return
  enqueue({
    ts: new Date().toISOString(),
    kind: 'click' as DevLogKind,
    pathname: _pathname,
    label,
    target,
    session: { ..._session },
  })
}

/** 수동 이벤트 로그 (메뉴 오픈, 탭 전환, 모달 열림 등) */
export function logEvent(name: string, payload?: unknown) {
  if (!IS_DEV) return
  enqueue({
    ts: new Date().toISOString(),
    kind: 'event' as DevLogKind,
    pathname: _pathname,
    label: name,
    payload: payload !== undefined ? sanitizePayload(payload) : undefined,
    session: { ..._session },
  })
}

/** 에러 로그 */
export function logError(message: string, payload?: unknown) {
  if (!IS_DEV) return
  enqueue({
    ts: new Date().toISOString(),
    kind: 'error' as DevLogKind,
    pathname: _pathname,
    label: message,
    payload: payload !== undefined ? sanitizePayload(payload) : undefined,
    ok: false,
    session: { ..._session },
  })
}

// 페이지 언로드 시 남은 큐 전송
if (IS_DEV && typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush)
}
