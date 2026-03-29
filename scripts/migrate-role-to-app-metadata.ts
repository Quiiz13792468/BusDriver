/**
 * Migration: user_metadata.role → app_metadata.role
 *
 * 배경:
 *   user_metadata는 사용자가 직접 수정 가능 → RBAC 보안 취약
 *   app_metadata는 Service Role 키로만 수정 가능 → 안전
 *
 * 실행 방법:
 *   npx tsx scripts/migrate-role-to-app-metadata.ts
 *
 * 전제 조건:
 *   - .env.local에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
 *
 * 이 스크립트는 IDEMPOTENT — 재실행해도 안전합니다.
 *   - app_metadata.role이 이미 올바르게 설정된 사용자는 건너뜁니다.
 *   - user_metadata.role이 없는 사용자는 PARENT로 기본 설정합니다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// .env.local 로더 (dotenv 패키지 불필요)
function loadDotenv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      const val = m[2].replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

loadDotenv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.');
  console.error('    .env.local 파일을 확인해주세요.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

type Role = 'ADMIN' | 'PARENT';
const VALID_ROLES: Role[] = ['ADMIN', 'PARENT'];

async function main() {
  console.log('🔍  Supabase Auth 사용자 목록 조회 중...\n');

  let page = 1;
  const perPage = 100;
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('❌  사용자 목록 조회 실패:', error.message);
      process.exit(1);
    }

    const users = data.users;
    if (users.length === 0) break;

    console.log(`📄  페이지 ${page} — ${users.length}명 처리 중...`);

    for (const user of users) {
      totalProcessed++;

      const metaRole = user.user_metadata?.role as string | undefined;
      const appRole  = user.app_metadata?.role  as string | undefined;

      // app_metadata.role이 이미 올바르게 설정된 경우 스킵
      const targetRole: Role = VALID_ROLES.includes(metaRole as Role)
        ? (metaRole as Role)
        : 'PARENT';

      if (appRole === targetRole) {
        totalSkipped++;
        console.log(`  ⏭  ${user.email} — 이미 app_metadata.role=${appRole} (스킵)`);
        continue;
      }

      // app_metadata.role 업데이트
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: { role: targetRole }
      });

      if (updateError) {
        totalErrors++;
        console.error(`  ❌  ${user.email} — 업데이트 실패: ${updateError.message}`);
      } else {
        totalUpdated++;
        const prev = appRole ?? '(없음)';
        console.log(`  ✅  ${user.email} — app_metadata.role: ${prev} → ${targetRole}`);
      }
    }

    // 다음 페이지가 없으면 종료
    if (users.length < perPage) break;
    page++;
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅  완료`);
  console.log(`   전체 처리: ${totalProcessed}명`);
  console.log(`   업데이트:  ${totalUpdated}명`);
  console.log(`   스킵:      ${totalSkipped}명 (이미 설정됨)`);
  if (totalErrors > 0) {
    console.log(`   오류:      ${totalErrors}명 ⚠️`);
  }
  console.log('─────────────────────────────────────────\n');

  if (totalErrors > 0) {
    console.warn('⚠️  일부 사용자 업데이트에 실패했습니다. 위 로그를 확인해주세요.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('예상치 못한 오류:', err);
  process.exit(1);
});
