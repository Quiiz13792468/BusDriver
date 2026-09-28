// 각 페이지 스크린샷 및 버튼/에러 텍스트 추출
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('networkidle')

  // login_id 필드 탐색
  const allInputs = await page.$$('input')
  for (const inp of allInputs) {
    const type = await inp.getAttribute('type')
    const name = await inp.getAttribute('name')
    const placeholder = await inp.getAttribute('placeholder')
    console.log(`  input: type=${type} name=${name} placeholder=${placeholder}`)
  }

  const loginIdInput = await page.$('input[name="login_id"]')
  const emailInput = await page.$('input[name="email"], input[type="email"]')
  const passwordInput = await page.$('input[type="password"]')

  if (loginIdInput) {
    await loginIdInput.fill('driver01')
  } else if (emailInput) {
    await emailInput.fill('admin@test.com')
  }
  await passwordInput.fill('test1234!')
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
  console.log('로그인 후:', page.url())
}

async function getAllButtons(page) {
  const btns = await page.$$('button')
  const texts = []
  for (const btn of btns) {
    const text = (await btn.textContent())?.trim()
    if (text) texts.push(text)
  }
  return texts
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await login(page)

  const pages = ['/schools', '/settings/schools', '/payments', '/dashboard', '/board']
  for (const path of pages) {
    await page.goto(`${BASE}${path}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: `scripts/shot-${path.replace(/\//g, '-')}.png`, fullPage: true })
    const buttons = await getAllButtons(page)
    console.log(`\n[${path}] 버튼 목록:`, buttons.join(' | '))
  }

  await browser.close()
}

main().catch(console.error)
