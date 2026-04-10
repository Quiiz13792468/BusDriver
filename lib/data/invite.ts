import 'server-only';

import crypto from 'node:crypto';
import { supaEnabled, restSelect, restInsert, restPatch } from '@/lib/supabase/rest';

export type InviteTokenRecord = {
  id: string;
  token: string;
  adminId: string;
  adminName: string | null;
  targetRole: 'PARENT' | 'DRIVER';
  used: boolean;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
};

function ensureSupabase() {
  if (!supaEnabled()) throw new Error('Supabase is not configured.');
}

/** 관리자가 초대 토큰을 생성합니다 */
export async function createInviteToken(
  adminId: string,
  expiresInHours: number = 24,
  targetRole: 'PARENT' | 'DRIVER' = 'PARENT',
): Promise<InviteTokenRecord> {
  ensureSupabase();
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(24).toString('hex'); // 48자 랜덤 토큰
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

  await restInsert('invite_tokens', [{
    id,
    token,
    admin_id: adminId,
    target_role: targetRole,
    used: false,
    used_by: null,
    used_at: null,
    expires_at: expiresAt,
    created_at: now.toISOString(),
  }]);

  const rows = await restSelect<any>('invite_tokens', { id }, { limit: 1 });
  return mapRow(rows[0]);
}

/** 토큰 유효성 검사 (미사용 + 만료 전) */
export async function validateInviteToken(token: string): Promise<InviteTokenRecord | null> {
  if (!supaEnabled()) return null;
  const rows = await restSelect<any>('invite_tokens', { token }, { limit: 1 });
  if (!rows[0]) return null;
  const record = mapRow(rows[0]);
  if (record.used) return null;
  if (new Date(record.expiresAt) < new Date()) return null;
  return record;
}

/** 토큰을 사용 처리합니다 */
export async function markTokenUsed(token: string, userId: string) {
  if (!supaEnabled()) return;
  await restPatch('invite_tokens', { token }, {
    used: true,
    used_by: userId,
    used_at: new Date().toISOString(),
  });
}

/** 관리자의 최근 초대 토큰 목록 */
export async function getInviteTokensByAdmin(adminId: string): Promise<InviteTokenRecord[]> {
  if (!supaEnabled()) return [];
  const rows = await restSelect<any>('invite_tokens', { admin_id: adminId }, { order: 'created_at.desc', limit: 10 });
  return rows.map(mapRow);
}

function mapRow(r: any): InviteTokenRecord {
  return {
    id: r.id,
    token: r.token,
    adminId: r.admin_id,
    adminName: r.admin_name ?? null,
    targetRole: (r.target_role ?? 'PARENT') as 'PARENT' | 'DRIVER',
    used: r.used,
    usedBy: r.used_by ?? null,
    usedAt: r.used_at ?? null,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}
