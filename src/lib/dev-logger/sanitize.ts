/**
 * PII 마스킹 및 페이로드 크기 제한 유틸
 */

const REDACTED = '[REDACTED]'
const MAX_PAYLOAD_BYTES = 1024

/** 마스킹할 키 목록 (대소문자 무관) */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'access_token',
  'refresh_token',
  'jwt',
  'authorization',
  'secret',
  'api_key',
  'apikey',
  'credential',
  'credentials',
])

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase())
}

/** 객체를 재귀적으로 순회하며 민감 키 값을 REDACTED로 교체 */
function maskObject(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[DEPTH_LIMIT]'
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return obj
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj

  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => maskObject(item, depth + 1))
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? REDACTED : maskObject(value, depth + 1)
    }
    return result
  }

  return obj
}

/** 페이로드 마스킹 + 1KB 초과 시 truncate */
export function sanitizePayload(payload: unknown): unknown {
  const masked = maskObject(payload)
  // JSON.stringify(undefined) → undefined 이므로 fallback 처리
  const json = JSON.stringify(masked) ?? ''
  if (json.length <= MAX_PAYLOAD_BYTES) return masked

  // 1KB 초과 시 문자열로 truncate
  return { _truncated: true, preview: json.slice(0, MAX_PAYLOAD_BYTES) + '…' }
}
