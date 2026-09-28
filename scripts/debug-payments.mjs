// payments 페이지 버튼 상태 확인
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

  await page.screenshot({ path: 'scripts/debug-payments.png', fullPage: false })

  // 모든 버튼 상태 출력
  const btns = await page.$$eval('button', els => els.map(e => ({
    text: e.textContent?.trim(),
    visible: e.offsetParent !== null,
    display: getComputedStyle(e).display,
    visibility: getComputedStyle(e).visibility,
    opacity: getComputedStyle(e).opacity,
  })))
  console.log('모든 버튼:')
  for (const btn of btns) {
    console.log(`  ${btn.visible ? '✓' : '✗'} "${btn.text}" display=${btn.display} vis=${btn.visibility} op=${btn.opacity}`)
  }

  await browser.close()
}

main().catch(console.error)
