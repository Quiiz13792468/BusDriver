import { test } from '@playwright/test';

const MOBILE = { width: 390, height: 844 }; // iPhone 14 기준

test.use({ viewport: MOBILE });

// 스켈레톤이 사라질 때까지 대기
async function waitForContent(page: any) {
  // animate-pulse(스켈레톤) 클래스가 없어질 때까지 대기 (최대 10초)
  await page.waitForFunction(
    () => document.querySelectorAll('.animate-pulse').length === 0,
    { timeout: 10000 }
  ).catch(() => {}); // 스켈레톤 없으면 무시
  await page.waitForTimeout(500);
}

// 관리자 로그인 헬퍼
async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('button').filter({ hasText: '관리자' }).first().click();
  await page.waitForTimeout(200);
  await page.locator('input[type="email"], input[name="email"]').fill('admin@test.com');
  await page.locator('input[type="password"], input[name="password"]').fill('test1234!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard|home/, { timeout: 15000 });
  await waitForContent(page);
}

// 학부모 로그인 헬퍼
async function loginAsParent(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('button').filter({ hasText: '학부모' }).first().click();
  await page.waitForTimeout(200);
  await page.locator('input[type="email"], input[name="email"]').fill('parent1@test.com');
  await page.locator('input[type="password"], input[name="password"]').fill('test1234!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard|home/, { timeout: 15000 });
  await waitForContent(page);
}

test.describe.serial('UI 스크린샷 캡처', () => {
  // ── 로그인 화면 ──────────────────────────────
  test('로그인 화면 - 기본 상태', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/01_login_default.png', fullPage: true });
  });

  test('로그인 화면 - 관리자 선택', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('button').filter({ hasText: '관리자' }).first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/02_login_admin_selected.png', fullPage: true });
  });

  test('로그인 화면 - 학부모 선택', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('button').filter({ hasText: '학부모' }).first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/03_login_parent_selected.png', fullPage: true });
  });

  test('로그인 화면 - 회원가입 모달', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const signupBtn = page.locator('button').filter({ hasText: /회원가입/ }).first();
    if (await signupBtn.isVisible()) {
      await signupBtn.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'e2e/screenshots/04_login_signup_modal.png', fullPage: true });
  });

  // ── 관리자 대시보드 ──────────────────────────
  test('관리자 - 대시보드 홈', async ({ page }) => {
    await loginAsAdmin(page);
    await page.screenshot({ path: 'e2e/screenshots/05_admin_dashboard.png', fullPage: true });
  });

  test('관리자 - 대시보드 스크롤 하단', async ({ page }) => {
    await loginAsAdmin(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/06_admin_dashboard_bottom.png', fullPage: true });
  });

  test('관리자 - 학생 탭', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/students');
    await waitForContent(page);
    await page.screenshot({ path: 'e2e/screenshots/07_admin_students.png', fullPage: true });
  });

  test('관리자 - 노선 탭', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/route');
    await waitForContent(page);
    await page.screenshot({ path: 'e2e/screenshots/08_admin_routes.png', fullPage: true });
  });

  test('관리자 - 학교 탭', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/pickup');
    await waitForContent(page);
    await page.screenshot({ path: 'e2e/screenshots/09_admin_schools.png', fullPage: true });
  });

  test('관리자 - 입금 탭', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/payments/pending');
    await waitForContent(page);
    await page.screenshot({ path: 'e2e/screenshots/09b_admin_payments.png', fullPage: true });
  });

  // ── 학부모 대시보드 ──────────────────────────
  test('학부모 - 대시보드 홈', async ({ page }) => {
    await loginAsParent(page);
    await page.screenshot({ path: 'e2e/screenshots/10_parent_dashboard.png', fullPage: true });
  });

  test('학부모 - 대시보드 스크롤 하단', async ({ page }) => {
    await loginAsParent(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e/screenshots/11_parent_dashboard_bottom.png', fullPage: true });
  });

  // ── 게시판 ──────────────────────────────────
  test('관리자 - 게시판 목록', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/board');
    await waitForContent(page);
    await page.screenshot({ path: 'e2e/screenshots/12_admin_board.png', fullPage: true });
  });

  test('관리자 - 게시판 상세(채팅뷰)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/board');
    await waitForContent(page);
    await page.waitForTimeout(500);
    const firstPost = page.locator('a[href^="/board/"]').first();
    const href = await firstPost.getAttribute('href').catch(() => null);
    if (href) {
      await page.goto(href);
      await waitForContent(page);
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'e2e/screenshots/13_admin_board_chat.png', fullPage: true });
  });

  test('학부모 - 게시판 목록', async ({ page }) => {
    await loginAsParent(page);
    await page.goto('/board');
    await waitForContent(page);
    await page.screenshot({ path: 'e2e/screenshots/14_parent_board.png', fullPage: true });
  });

  test('학부모 - 게시판 상세(채팅뷰)', async ({ page }) => {
    await loginAsParent(page);
    await page.goto('/board');
    await waitForContent(page);
    await page.waitForTimeout(500);
    const firstPost = page.locator('a[href^="/board/"]').first();
    const href = await firstPost.getAttribute('href').catch(() => null);
    if (href) {
      await page.goto(href);
      await waitForContent(page);
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'e2e/screenshots/15_parent_board_chat.png', fullPage: true });
  });
});
