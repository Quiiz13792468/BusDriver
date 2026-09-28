// board 페이지 구조 확인
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

  await page.goto(`${BASE}/board`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  await page.screenshot({ path: 'scripts/debug-board.png', fullPage: true })

  const btns = await page.$$eval('button', els => els.map(e => ({
    text: e.textContent?.trim().slice(0, 30),
    visible: e.offsetParent !== null,
  })))
  console.log('board 버튼 전체:')
  for (const b of btns) {
    console.log(`  ${b.visible ? '✓' : '✗'} "${b.text}"`)
  }

  // 탭 관련 링크/버튼 탐색
  const links = await page.$$eval('a', els => els.map(e => ({
    href: e.getAttribute('href'),
    text: e.textContent?.trim().slice(0, 30),
  })))
  console.log('\nboard 링크:')
  for (const l of links) {
    console.log(`  "${l.text}" → ${l.href}`)
  }

  // role 속성 있는 요소
  const tabs = await page.$$eval('[role="tab"], [role="tablist"]', els =>
    els.map(e => ({ role: e.getAttribute('role'), text: e.textContent?.trim().slice(0, 30) }))
  )
  console.log('\ntab 역할 요소:', tabs)

  await browser.close()
}

main().catch(console.error)
