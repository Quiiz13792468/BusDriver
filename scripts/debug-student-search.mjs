// 학생 검색 드롭다운 동작 확인
import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.setViewportSize({ width: 390, height: 844 })

  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('networkidle')
  await page.fill('#login_id', 'driver01')
  await page.fill('#password', 'test1234!')
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 })

  await page.goto(`${BASE}/payments`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // 입금 버튼 클릭
  await page.locator('button', { hasText: '입금' }).first().click()
  await page.waitForTimeout(1000)

  // 학생 검색 전 스크린샷
  await page.screenshot({ path: 'scripts/debug-student-1-before.png', fullPage: false })

  const studentSearch = await page.$('input[placeholder="이름으로 검색..."]')
  if (!studentSearch) {
    console.log('학생 검색 인풋 없음')
    await browser.close()
    return
  }

  // fill로 검색어 입력
  await studentSearch.fill('자동')
  await page.waitForTimeout(1000)

  // 검색 후 스크린샷
  await page.screenshot({ path: 'scripts/debug-student-2-after-fill.png', fullPage: false })

  // 모든 button[type="button"] 상태
  const buttons = await page.$$('button[type="button"]')
  console.log('\nbutton[type="button"] 전체:')
  for (const btn of buttons) {
    const text = (await btn.textContent())?.trim().slice(0, 40)
    const visible = await btn.isVisible()
    console.log(`  ${visible ? '✓' : '✗'} "${text}"`)
  }

  // 학생 목록 (students prop에 무엇이 있는지)
  const allBtns = await page.$$eval('button', els => els.map(e => ({
    text: e.textContent?.trim().slice(0, 40),
    type: e.getAttribute('type'),
    visible: e.offsetParent !== null,
  })))
  console.log('\n검색 후 모든 버튼:')
  for (const b of allBtns) {
    if (b.visible) console.log(`  ✓ [${b.type}] "${b.text}"`)
  }

  // focus 이벤트로 드롭다운 열기 시도
  await studentSearch.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'scripts/debug-student-3-after-click.png', fullPage: false })

  await browser.close()
}

main().catch(console.error)
