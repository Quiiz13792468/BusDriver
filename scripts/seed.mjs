/**
 * 테스트 데이터 시드 스크립트
 * 실행: node --env-file=.env.local scripts/seed.mjs
 *
 * 기존 auth 유저를 재활용:
 *   버스기사 | admin@test.com  / (기존 비밀번호)
 *   학부모   | parent1@test.com / (기존 비밀번호)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('❌ .env.local에 Supabase 환경변수가 없습니다.')
  process.exit(1)
}

// 관리자 클라이언트 (RLS 우회)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 익명 클라이언트 (로그인 세션 획득용)
const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function getMonthDate(offsetMonths = 0) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offsetMonths)
  return d.toISOString().split('T')[0]
}

// 기존 auth 유저를 이메일로 찾는 헬퍼
async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw new Error('유저 목록 조회 실패: ' + error.message)
  const user = data.users.find(u => u.email === email)
  if (!user) throw new Error(`유저를 찾을 수 없습니다: ${email}`)
  return user
}

async function seed() {
  console.log('🌱 시드 데이터 생성 시작...\n')

  // ── 1. DRIVER 계정 (기존 유저 재활용) ──────────────────────
  console.log('1️⃣  DRIVER 계정 확인 (admin@test.com)')
  const driverUser = await findUserByEmail('admin@test.com')
  const driverId = driverUser.id

  const { error: dpErr } = await admin.from('profiles').upsert({
    id: driverId,
    login_id: 'driver01',
    role: 'DRIVER',
    full_name: '김기사',
    phone: '010-1234-5678',
  }, { onConflict: 'id' })
  if (dpErr) throw new Error('DRIVER 프로필 생성 실패: ' + dpErr.message)
  console.log('   ✅ admin@test.com → DRIVER / 김기사\n')

  // ── 2. PARENT 계정 (기존 유저 재활용) ─────────────────────
  console.log('2️⃣  PARENT 계정 확인 (parent1@test.com)')
  const parentUser = await findUserByEmail('parent1@test.com')
  const parentId = parentUser.id

  const { error: ppErr } = await admin.from('profiles').upsert({
    id: parentId,
    login_id: 'parent01',
    role: 'PARENT',
    full_name: '이학부모',
    phone: '010-9876-5432',
  }, { onConflict: 'id' })
  if (ppErr) throw new Error('PARENT 프로필 생성 실패: ' + ppErr.message)
  console.log('   ✅ parent1@test.com → PARENT / 이학부모\n')

  // ── 3. 학교 ────────────────────────────────────────────
  console.log('3️⃣  학교 생성')
  let school
  const { data: existingSchool } = await admin
    .from('schools')
    .select('id')
    .eq('name', '행복초등학교')
    .eq('owner_driver_id', driverId)
    .maybeSingle()

  if (existingSchool) {
    school = existingSchool
    console.log('   ⚠️  행복초등학교 이미 존재 — 기존 데이터 사용')
  } else {
    const { data: newSchool, error: schoolErr } = await admin
      .from('schools')
      .insert({ name: '행복초등학교', owner_driver_id: driverId, default_fee: 150000 })
      .select('id')
      .single()
    if (schoolErr) throw new Error('학교 생성 실패: ' + schoolErr.message)
    school = newSchool
  }
  console.log('   ✅ 행복초등학교 (기본요금 150,000원)\n')

  // ── 4. 학생 ────────────────────────────────────────────
  console.log('4️⃣  학생 생성')

  async function upsertStudent(name, fields) {
    const { data: existing } = await admin
      .from('students')
      .select('id')
      .eq('name', name)
      .eq('school_id', school.id)
      .maybeSingle()
    if (existing) return existing
    const { data, error } = await admin
      .from('students')
      .insert({ name, school_id: school.id, driver_id: driverId, ...fields })
      .select('id')
      .single()
    if (error) throw new Error(`학생(${name}) 생성 실패: ` + error.message)
    return data
  }

  const student1 = await upsertStudent('홍길동', { is_active: true, ride_type: 'BOTH', payment_day: 5 })
  const student2 = await upsertStudent('이영희', { is_active: true, ride_type: 'MORNING', payment_day: 5 })
  console.log('   ✅ 홍길동, 이영희\n')

  // ── 5. 학부모 ↔ 학생 연결 ──────────────────────────────
  console.log('5️⃣  학부모 연결')
  const { error: spErr } = await admin
    .from('student_parents')
    .upsert(
      { student_id: student1.id, parent_profile_id: parentId },
      { onConflict: 'student_id,parent_profile_id' }
    )
  if (spErr) throw new Error('학부모-학생 연결 실패: ' + spErr.message)
  console.log('   ✅ 이학부모 → 홍길동\n')

  // ── 6. DRIVER 세션 획득 (트리거가 auth.uid() 필요) ────────
  console.log('6️⃣  드라이버 세션 획득')
  const SEED_PW = 'SeedTemp1234!'
  await admin.auth.admin.updateUserById(driverId, { password: SEED_PW })
  const { data: { session }, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: 'admin@test.com',
    password: SEED_PW,
  })
  if (signInErr || !session) throw new Error('드라이버 로그인 실패: ' + signInErr?.message)
  const driverClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  console.log('   ✅ 세션 획득 완료\n')

  console.log('7️⃣  입금 내역 생성')

  const thisMonth = getMonthDate(0)
  const lastMonth = getMonthDate(-1)
  const twoMonthsAgo = getMonthDate(-2)

  // 기존 입금 데이터 삭제 후 재삽입 (중복 방지)
  await admin.from('payments').delete().in('student_id', [student1.id, student2.id])

  // 홍길동 - 이번달 PENDING
  const { data: p1, error: p1Err } = await driverClient
    .from('payments')
    .insert({ student_id: student1.id, amount: 150000, paid_at: thisMonth })
    .select('id').single()
  if (p1Err) throw new Error('입금1 생성 실패: ' + p1Err.message)

  // 홍길동 - 지난달 CONFIRMED
  const { data: p2, error: p2Err } = await driverClient
    .from('payments')
    .insert({ student_id: student1.id, amount: 150000, paid_at: lastMonth })
    .select('id').single()
  if (p2Err) throw new Error('입금2 생성 실패: ' + p2Err.message)
  await admin.from('payments').update({ status: 'CONFIRMED', last_action_by: driverId, last_action_role: 'DRIVER' }).eq('id', p2.id)

  // 홍길동 - 2달 전 CONFIRMED
  const { data: p3, error: p3Err } = await driverClient
    .from('payments')
    .insert({ student_id: student1.id, amount: 150000, paid_at: twoMonthsAgo })
    .select('id').single()
  if (p3Err) throw new Error('입금3 생성 실패: ' + p3Err.message)
  await admin.from('payments').update({ status: 'CONFIRMED', last_action_by: driverId, last_action_role: 'DRIVER' }).eq('id', p3.id)

  // 이영희 - 이번달 PENDING
  const { error: p4Err } = await driverClient
    .from('payments')
    .insert({ student_id: student2.id, amount: 150000, paid_at: thisMonth })
  if (p4Err) throw new Error('입금4 생성 실패: ' + p4Err.message)

  // 이영희 - 지난달 DISPUTED
  const { data: p5, error: p5Err } = await driverClient
    .from('payments')
    .insert({ student_id: student2.id, amount: 150000, paid_at: lastMonth })
    .select('id').single()
  if (p5Err) throw new Error('입금5 생성 실패: ' + p5Err.message)
  await admin.from('payments').update({ status: 'DISPUTED', memo: '금액이 다릅니다', last_action_by: parentId, last_action_role: 'PARENT' }).eq('id', p5.id)

  console.log('   ✅ 홍길동 3건 (PENDING 1, CONFIRMED 2)')
  console.log('   ✅ 이영희 2건 (PENDING 1, DISPUTED 1)\n')

  // ── 7. 1:1 메시지 ─────────────────────────────────────
  console.log('7️⃣  샘플 메시지 생성')
  await admin.from('board_messages').delete()
    .eq('driver_id', driverId).eq('parent_id', parentId)

  const { error: msgErr } = await admin.from('board_messages').insert({
    driver_id: driverId,
    parent_id: parentId,
    sender_id: driverId,
    content: '안녕하세요! 이번 달 이용요금 안내드립니다. 4월 5일까지 납부 부탁드립니다.',
  })
  if (msgErr) throw new Error('메시지 생성 실패: ' + msgErr.message)
  console.log('   ✅ 샘플 채팅 메시지 1건\n')

  // ── 완료 ───────────────────────────────────────────────
  console.log('🎉 시드 완료!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('버스기사  | admin@test.com   / (기존 비밀번호)')
  console.log('학부모    | parent1@test.com / (기존 비밀번호)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

seed().catch((err) => {
  console.error('\n❌ 시드 실패:', err.message)
  process.exit(1)
})
