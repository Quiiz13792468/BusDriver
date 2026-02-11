import crypto from 'node:crypto';

import { restInsert, supaEnabled } from '@/lib/supabase/rest';

type AuthAuditReason =
  | 'INVALID_PAYLOAD'
  | 'USER_NOT_FOUND'
  | 'ROLE_MISMATCH'
  | 'PASSWORD_MISMATCH'
  | 'LOGIN_SUCCESS'
  | 'INTERNAL_ERROR';

type LogAuthAttemptInput = {
  email?: string | null;
  role?: string | null;
  success: boolean;
  reason: AuthAuditReason;
  userId?: string | null;
  source?: string;
};

function normalizeEmail(email?: string | null) {
  return (email ?? '').trim().toLowerCase();
}

export async function logAuthAttempt(input: LogAuthAttemptInput) {
  const now = new Date().toISOString();
  const email = normalizeEmail(input.email);
  const role = input.role ?? null;
  const event = {
    ts: now,
    email,
    role,
    success: input.success,
    reason: input.reason,
    userId: input.userId ?? null,
    source: input.source ?? 'credentials'
  };

  console.info('[auth-audit]', JSON.stringify(event));

  if (!supaEnabled()) return;

  try {
    await restInsert('auth_login_audit', [
      {
        id: crypto.randomUUID(),
        email,
        role,
        success: input.success,
        reason: input.reason,
        user_id: input.userId ?? null,
        source: event.source,
        occurred_at: now
      }
    ]);
  } catch {
    // Non-blocking by design: auth flow should not fail when audit write fails.
  }
}
