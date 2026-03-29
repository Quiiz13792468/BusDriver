/**
 * 테스트 데이터 시드 스크립트
 * 실행: npx tsx scripts/seed.ts
 *
 * 생성 내용:
 *   - 관리자 계정 1개 (admin@test.com / test1234!)
 *   - 학부모 계정 2개 (parent1@test.com, parent2@test.com / test1234!)
 *   - 학교 1개 (테스트 초등학교)
 *   - 학생 3명 (학부모 각각 연결)
 *   - 노선 1개 + 정류장 5개
 *   - 결제 데이터 (이번 달 기준)
 *   - 게시글 1개
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local 수동 로드 (dotenv 불필요)
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local 없으면 환경변수에서 직접 읽음 */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ .env.local에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'test1234!';
const now = new Date().toISOString();
const year = new Date().getFullYear();
const month = new Date().getMonth() + 1;

// ── 헬퍼 ──────────────────────────────────────────────

async function createAuthUser(email: string, role: 'ADMIN' | 'PARENT', name: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { name, role },
  });
  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      console.log(`  ⚠️  이미 존재: ${email}`);
      const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const found = list?.users.find(u => u.email === email);
      return found ?? null;
    }
    throw new Error(`createUser 실패 (${email}): ${error.message}`);
  }
  console.log(`  ✅ 계정 생성: ${email} [${role}]`);
  return data.user;
}

async function insert(table: string, rows: object[]) {
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`insert(${table}) 실패: ${error.message}`);
}

async function upsert(table: string, rows: object[], onConflict: string) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`upsert(${table}) 실패: ${error.message}`);
}

// ── 메인 ──────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 시드 시작\n');

  // ── 1. 계정 생성 ────────────────────────────────────
  console.log('1️⃣  계정 생성');
  const admin  = await createAuthUser('admin@test.com',   'ADMIN',  '홍길동 기사');
  const p1     = await createAuthUser('parent1@test.com', 'PARENT', '김철수 부모');
  const p2     = await createAuthUser('parent2@test.com', 'PARENT', '이영희 부모');
  if (!admin || !p1 || !p2) throw new Error('계정 생성 실패');

  // parent_profiles 보장 (이미 있으면 무시)
  await upsert('parent_profiles', [
    { user_id: p1.id, address: '서울시 강남구 테헤란로 1길', admin_user_id: admin.id, created_at: now, updated_at: now },
    { user_id: p2.id, address: '서울시 서초구 반포대로 2길', admin_user_id: admin.id, created_at: now, updated_at: now },
  ], 'user_id');

  // ── 2. 학교 생성 ─────────────────────────────────────
  console.log('2️⃣  학교 생성');
  const schoolId = crypto.randomUUID();
  await upsert('schools', [{
    id: schoolId,
    name: '테스트 초등학교',
    address: '서울시 강남구 학교로 10',
    default_monthly_fee: 150000,
    note: '테스트용 학교입니다.',
    admin_user_id: admin.id,
    created_at: now,
    updated_at: now,
  }], 'id');
  console.log(`  ✅ 학교: 테스트 초등학교 (${schoolId})`);

  // ── 3. 학생 생성 ─────────────────────────────────────
  console.log('3️⃣  학생 생성');
  const s1Id = crypto.randomUUID();
  const s2Id = crypto.randomUUID();
  const s3Id = crypto.randomUUID();

  await upsert('students', [
    {
      id: s1Id,
      school_id: schoolId,
      parent_user_id: p1.id,
      name: '김민준',
      guardian_name: '김철수',
      phone: '010-1111-1111',
      home_address: '서울시 강남구 테헤란로 1길 101호',
      pickup_point: '테헤란로 정류장',
      route_id: null,
      emergency_contact: '010-9999-1111',
      fee_amount: 150000,
      deposit_day: 5,
      is_active: true,
      suspended_at: null,
      notes: '테스트 학생 1',
      created_at: now,
      updated_at: now,
    },
    {
      id: s2Id,
      school_id: schoolId,
      parent_user_id: p1.id,
      name: '김서연',
      guardian_name: '김철수',
      phone: '010-1111-2222',
      home_address: '서울시 강남구 테헤란로 1길 101호',
      pickup_point: '강남역 정류장',
      route_id: null,
      emergency_contact: '010-9999-1111',
      fee_amount: 150000,
      deposit_day: 5,
      is_active: true,
      suspended_at: null,
      notes: '테스트 학생 2 (김민준 형제)',
      created_at: now,
      updated_at: now,
    },
    {
      id: s3Id,
      school_id: schoolId,
      parent_user_id: p2.id,
      name: '이도현',
      guardian_name: '이영희',
      phone: '010-2222-1111',
      home_address: '서울시 서초구 반포대로 2길 202호',
      pickup_point: '반포 정류장',
      route_id: null,
      emergency_contact: '010-9999-2222',
      fee_amount: 130000,
      deposit_day: 10,
      is_active: true,
      suspended_at: null,
      notes: '테스트 학생 3',
      created_at: now,
      updated_at: now,
    },
  ], 'id');
  console.log('  ✅ 학생 3명 생성');

  // ── 4. 노선 생성 ─────────────────────────────────────
  console.log('4️⃣  노선 생성');
  const routeId = crypto.randomUUID();
  await upsert('routes', [{
    id: routeId,
    school_id: schoolId,
    name: '강남 1호선',
    created_at: now,
    updated_at: now,
  }], 'id');

  const stopNames = ['테헤란로 정류장', '강남역 정류장', '논현동 정류장', '반포 정류장', '교문 앞'];
  const stops = stopNames.map((name, idx) => ({
    id: crypto.randomUUID(),
    route_id: routeId,
    name,
    position: idx,
    lat: 37.497 + idx * 0.003,
    lng: 127.027 + idx * 0.002,
    description: null,
  }));
  await upsert('route_stops', stops, 'id');

  // 학생들 노선 배정
  await supabase.from('students').update({ route_id: routeId, updated_at: now }).in('id', [s1Id, s2Id, s3Id]);
  console.log(`  ✅ 노선: 강남 1호선 (정류장 ${stops.length}개)`);

  // ── 5. 결제 데이터 ───────────────────────────────────
  console.log('5️⃣  결제 데이터 생성');
  const payments = [
    // s1: 이번 달 완납
    {
      id: crypto.randomUUID(),
      student_id: s1Id,
      school_id: schoolId,
      amount: 150000,
      target_year: year,
      target_month: month,
      status: 'PAID',
      paid_at: now,
      memo: '계좌이체',
      created_at: now,
      updated_at: now,
    },
    // s1: 지난 달 완납
    {
      id: crypto.randomUUID(),
      student_id: s1Id,
      school_id: schoolId,
      amount: 150000,
      target_year: month === 1 ? year - 1 : year,
      target_month: month === 1 ? 12 : month - 1,
      status: 'PAID',
      paid_at: now,
      memo: '계좌이체',
      created_at: now,
      updated_at: now,
    },
    // s2: 이번 달 부분납
    {
      id: crypto.randomUUID(),
      student_id: s2Id,
      school_id: schoolId,
      amount: 80000,
      target_year: year,
      target_month: month,
      status: 'PARTIAL',
      paid_at: now,
      memo: '일부만 입금',
      created_at: now,
      updated_at: now,
    },
    // s3: 이번 달 미납 (payment 없음, 아래 PENDING 알림만)
  ];
  await upsert('payments', payments, 'id');
  console.log(`  ✅ 결제 ${payments.length}건 생성`);

  // ── 6. 알림(alert) ───────────────────────────────────
  console.log('6️⃣  알림 생성');
  await upsert('alerts', [
    {
      id: crypto.randomUUID(),
      student_id: s3Id,
      school_id: schoolId,
      year,
      month,
      type: 'PAYMENT',
      status: 'PENDING',
      created_by: admin.id,
      memo: '이달 이용료 미납',
      created_at: now,
    },
  ], 'id');
  console.log('  ✅ 미납 알림 1건 생성');

  // ── 7. 게시글 ────────────────────────────────────────
  console.log('7️⃣  게시글 생성');
  const postId = crypto.randomUUID();
  await upsert('board_posts', [{
    id: postId,
    title: '3월 이용료 안내',
    content: '안녕하세요. 3월 이용료 납부 기한은 3월 10일입니다.\n계좌: 테스트은행 123-456-789\n\n문의사항은 댓글로 남겨주세요.',
    author_id: admin.id,
    school_id: schoolId,
    target_parent_id: null,
    parent_only: false,
    locked: false,
    view_count: 0,
    created_at: now,
    updated_at: now,
  }], 'id');

  // 학부모 문의글
  const inquiryId = crypto.randomUUID();
  await upsert('board_posts', [{
    id: inquiryId,
    title: '탑승 정류장 변경 문의',
    content: '안녕하세요. 다음 달부터 자녀 탑승 정류장을 변경하고 싶습니다. 어떻게 신청하면 되나요?',
    author_id: p1.id,
    school_id: schoolId,
    target_parent_id: null,
    parent_only: true,
    locked: false,
    view_count: 2,
    created_at: now,
    updated_at: now,
  }], 'id');
  console.log('  ✅ 게시글 2건 생성');

  // ── 완료 ─────────────────────────────────────────────
  console.log('\n✅ 시드 완료!\n');
  console.log('📋 테스트 계정:');
  console.log('  관리자  admin@test.com    / test1234!');
  console.log('  학부모1 parent1@test.com  / test1234!  (학생 2명: 김민준, 김서연)');
  console.log('  학부모2 parent2@test.com  / test1234!  (학생 1명: 이도현)');
  console.log('\n📋 데이터:');
  console.log('  학교: 테스트 초등학교 (월 150,000원)');
  console.log('  노선: 강남 1호선 (정류장 5개)');
  console.log(`  결제: 김민준 ${year}/${month} 완납, 김서연 부분납, 이도현 미납`);
  console.log('  게시글: 2건 (공지 1, 학부모 문의 1)\n');
}

seed().catch(err => {
  console.error('\n❌ 시드 실패:', err.message);
  process.exit(1);
});
