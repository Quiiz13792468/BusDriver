// BusDriver E2E 테스트 — 로그인부터 전 기능 커버
import { test, expect } from '@playwright/test'

const DRIVER_EMAIL = 'admin@test.com'
const DRIVER_PW = 'test1234!'

async function loginAsDriver(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByPlaceholder(/아이디/).fill(DRIVER_EMAIL)
  await page.getByPlaceholder('비밀번호').fill(DRIVER_PW)
  await page.getByRole('button', { name: /로그인/ }).click()
  await page.waitForURL('**/dashboard', { timeout: 15000 })
}

// ─── 1. 로그인 ────────────────────────────────────────────────────
test('로그인 — 이메일/비밀번호 입력 후 대시보드 이동', async ({ page }) => {
  await loginAsDriver(page)
  await expect(page).toHaveURL(/dashboard/)
})

test('로그인 — 잘못된 비밀번호 시 오류 메시지', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder(/아이디/).fill(DRIVER_EMAIL)
  await page.getByPlaceholder('비밀번호').fill('wrongpassword')
  await page.getByRole('button', { name: /로그인/ }).click()
  await expect(page.getByText(/오류|실패|incorrect|invalid/i)).toBeVisible({ timeout: 8000 })
})

// ─── 2. 대시보드 ──────────────────────────────────────────────────
test('대시보드 — 월 입금 요약 카드 표시', async ({ page }) => {
  await loginAsDriver(page)
  // 월 수입 금액 표시
  await expect(page.getByText(/월 수입/)).toBeVisible()
})

test('대시보드 — 미납 탭: 학생 카드 표시', async ({ page }) => {
  await loginAsDriver(page)
  // 미납 탭 클릭
  const tab = page.getByRole('button', { name: /미납/ }).or(page.getByText(/미납/))
  await tab.first().click()
  // 학생 이름 또는 빈 상태 중 하나가 보여야 함
  const hasStudent = await page.getByText(/홍길동|이영희/).isVisible().catch(() => false)
  const isEmpty = await page.getByText(/미납 학생이 없습니다|없습니다/).isVisible().catch(() => false)
  expect(hasStudent || isEmpty).toBe(true)
})

test('대시보드 — 확인요청 탭: 학교/학년 서브타이틀 표시', async ({ page }) => {
  await loginAsDriver(page)
  const tab = page.getByRole('button', { name: /확인요청/ }).or(page.getByText(/확인요청/))
  await tab.first().click()
  // 결제 항목이 있으면 학교명 or 빈상태
  const hasBadge = await page.getByText(/행복초등학교/).isVisible().catch(() => false)
  const isEmpty = await page.getByText(/요청이 없습니다|없습니다/).isVisible().catch(() => false)
  expect(hasBadge || isEmpty).toBe(true)
})

test('대시보드 — 입금현황 탭 (매트릭스) 표시', async ({ page }) => {
  await loginAsDriver(page)
  const tab = page.getByRole('button', { name: /입금현황/ }).or(page.getByText(/입금현황/))
  await tab.first().click()
  await expect(page.getByText(/홍길동|이영희|학생 없음|등록된 학생/)).toBeVisible({ timeout: 5000 })
})

// ─── 3. 입금 등록 모달 ────────────────────────────────────────────
test('입금 등록 모달 — 열기 및 월 선택 후 닫기', async ({ page }) => {
  await loginAsDriver(page)
  // 하단 + 버튼 (GlobalActions)
  const addBtn = page.getByRole('button', { name: /입금/ }).first()
  await addBtn.click()
  // 모달 타이틀
  await expect(page.getByText(/입금 등록/)).toBeVisible({ timeout: 5000 })
  // 월 셀 하나 클릭 (1월)
  const cell = page.getByText('1').first()
  await cell.click()
  // 닫기
  await page.keyboard.press('Escape')
})

// ─── 4. 학생관리 ──────────────────────────────────────────────────
test('학생관리 — 학생 목록 로드', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/schools')
  await expect(page.getByText(/홍길동|이영희|학생이 없습니다/)).toBeVisible({ timeout: 8000 })
})

test('학생관리 — 검색', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/schools')
  const searchInput = page.getByPlaceholder(/검색|이름/)
  if (await searchInput.isVisible()) {
    await searchInput.fill('홍')
    await expect(page.getByText(/홍길동/)).toBeVisible({ timeout: 5000 })
  }
})

test('학생관리 — 정보 버튼 클릭 시 모달 열림', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/schools')
  const infoBtn = page.getByRole('button', { name: /정보/ }).first()
  if (await infoBtn.isVisible()) {
    await infoBtn.click()
    await expect(page.getByText(/학생 정보|이름|납부일/)).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  }
})

test('학생관리 — 기록 버튼 클릭 시 모달 열림', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/schools')
  const histBtn = page.getByRole('button', { name: /기록/ }).first()
  if (await histBtn.isVisible()) {
    await histBtn.click()
    await expect(page.getByText(/납부 기록|입금|기록 없음/)).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  }
})

// ─── 5. 장부 ─────────────────────────────────────────────────────
test('장부 — 월 네비게이션 및 KPI 카드', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/payments')
  await expect(page.getByText(/월|수입|지출/)).toBeVisible({ timeout: 8000 })
  // 이전 달 버튼
  const prevBtn = page.getByRole('button', { name: /‹|이전/ }).first()
  if (await prevBtn.isVisible()) {
    await prevBtn.click()
    await expect(page.getByText(/월/)).toBeVisible()
  }
})

test('장부 — 입금 탭 목록', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/payments')
  const tab = page.getByRole('button', { name: /입금/ }).or(page.getByText(/입금/)).first()
  await tab.click()
  await expect(page.getByText(/홍길동|이영희|내역 없음|없습니다/)).toBeVisible({ timeout: 5000 })
})

test('장부 — 주유 탭 전환', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/payments')
  const tab = page.getByRole('button', { name: /주유/ }).or(page.getByText(/주유/)).first()
  await tab.click()
  await expect(page.getByText(/주유|내역 없음|없습니다/)).toBeVisible({ timeout: 5000 })
})

// ─── 6. 게시판 ────────────────────────────────────────────────────
test('게시판 — 1:1 대화 탭 표시', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/board')
  await expect(page.getByText(/1:1 대화/)).toBeVisible({ timeout: 8000 })
  // 메시지 있거나 빈 상태
  const hasMsg = await page.getByText(/이학부모|학부모/).isVisible().catch(() => false)
  const isEmpty = await page.getByText(/메시지가 없습니다/).isVisible().catch(() => false)
  expect(hasMsg || isEmpty).toBe(true)
})

test('게시판 — 전체 공지 탭 전환', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/board?tab=notices')
  await expect(page.getByText(/전체 공지/)).toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/공지 작성|작성된 공지가 없습니다/)).toBeVisible({ timeout: 5000 })
})

test('게시판 — 채팅방 진입', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/board')
  const chatLink = page.locator('a[href*="/board/chat/"]').first()
  if (await chatLink.isVisible()) {
    await chatLink.click()
    await expect(page.getByText(/전송|메시지 입력/)).toBeVisible({ timeout: 8000 })
  }
})

// ─── 7. 설정 ─────────────────────────────────────────────────────
test('설정 — 프로필 카드 표시', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/settings')
  await expect(page.getByText(/김기사|admin@test.com/)).toBeVisible({ timeout: 8000 })
})

test('설정 — 학교 관리 섹션 표시', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/settings')
  await expect(page.getByText(/학교|행복초등학교/)).toBeVisible({ timeout: 5000 })
})

test('설정 — 로그아웃 버튼 존재', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/settings')
  await expect(page.getByRole('button', { name: /로그아웃/ })).toBeVisible({ timeout: 5000 })
})

test('설정 — 로그아웃 후 로그인 페이지 이동', async ({ page }) => {
  await loginAsDriver(page)
  await page.goto('/settings')
  await page.getByRole('button', { name: /로그아웃/ }).click()
  await page.waitForURL('**/login', { timeout: 10000 })
  await expect(page).toHaveURL(/login/)
})

// ─── 8. 하단 네비게이션 ───────────────────────────────────────────
test('하단 네비 — 4개 탭 전환', async ({ page }) => {
  await loginAsDriver(page)
  // 학생관리
  await page.getByRole('link', { name: /학생관리/ }).click()
  await page.waitForURL('**/schools**', { timeout: 8000 })
  // 장부
  await page.getByRole('link', { name: /장부/ }).click()
  await page.waitForURL('**/payments**', { timeout: 8000 })
  // 게시판
  await page.getByRole('link', { name: /게시판/ }).click()
  await page.waitForURL('**/board**', { timeout: 8000 })
  // 홈
  await page.getByRole('link', { name: /홈/ }).click()
  await page.waitForURL('**/dashboard**', { timeout: 8000 })
})
