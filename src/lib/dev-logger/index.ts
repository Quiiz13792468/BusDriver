'use client'

/**
 * dev-logger 공개 API — 클라이언트 전용 배럴
 *
 * 클라이언트 ('use client' 파일):
 *   import { logEvent, logClick, setDevLogSession } from '@/lib/dev-logger'
 *
 * 서버 (Server Action / Route Handler — fs 모듈 사용):
 *   import { withActionLog, appendLog, logApiCall } from '@/lib/dev-logger/server-logger'
 *
 * NOTE: server-logger 는 Node.js fs/path 모듈을 사용하므로
 *       이 배럴(index.ts)에 포함하지 않음 — 클라이언트 번들 오염 방지
 */

// 클라이언트 전용 (Client Component / 브라우저 코드에서 사용)
export {
  setDevLogSession,
  setDevLogPathname,
  logPageView,
  logClick,
  logEvent,
  logError,
} from './client-logger'

// 공통 타입 (클라이언트/서버 모두 사용 가능)
export type { DevLogEntry, DevLogKind, DevLogSession } from './types'
