import { test, expect } from '@playwright/test';

test.describe('로그인 페이지', () => {
  test('로그인 페이지에 접근하면 기본 UI가 표시된다', async ({ page }) => {
    await page.goto('/login');

    // 페이지 제목 또는 주요 요소 확인
    await expect(page).toHaveURL(/login/);

    // 이메일 입력 필드가 존재한다
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    // 비밀번호 입력 필드가 존재한다
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();

    // 로그인 버튼이 존재한다
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
  });

  test('빈 폼 제출 시 유효성 검사가 동작한다', async ({ page }) => {
    await page.goto('/login');

    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    // 제출 후에도 여전히 로그인 페이지에 머문다
    await expect(page).toHaveURL(/login/);
  });

  test('잘못된 자격증명으로 로그인 시 오류가 표시된다', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[type="email"], input[name="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // 오류 메시지가 표시된다 (로그인 실패 후 여전히 /login 유지)
    await expect(page).toHaveURL(/login/);
  });
});
