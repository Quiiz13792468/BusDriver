/**
 * 개발 모드 전용 로깅 시스템 타입 정의
 * NODE_ENV !== 'production' 에서만 동작
 */

export type DevLogKind =
  | 'page_view'       // 페이지 이동
  | 'click'           // 클릭 이벤트
  | 'event'           // 메뉴/탭/모달 등 수동 이벤트
  | 'action'          // Server Action 실행 결과
  | 'api'             // API 라우트 응답
  | 'error'           // 에러 캡처

export interface DevLogSession {
  userId?: string
  role?: string
  schoolId?: string
}

export interface DevLogEntry {
  ts: string              // ISO 8601 타임스탬프
  kind: DevLogKind
  pathname?: string       // 현재 pathname
  label?: string          // 클릭 대상 텍스트 or 이벤트 이름
  target?: string         // CSS selector / data-log 값
  payload?: unknown       // 추가 데이터 (1KB 제한, PII 마스킹 후)
  durationMs?: number     // Server Action / API 소요 시간
  status?: number         // HTTP 상태 코드 (api 종류)
  ok?: boolean            // 성공 여부
  error?: string          // 에러 메시지
  session?: DevLogSession // 세션 컨텍스트
}
