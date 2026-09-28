import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.setViewportSize({ width: 390, height: 844 }) // iPhone 14

  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('networkidle')
  await page.fill('#login_id', 'driver01')
  await page.fill('#password', 'test1234!')
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 })

  for (const path of ['/payments', '/board']) {
    await page.goto(`${BASE}${path}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `scripts/shot${path.replace(/\//g, '-')}.png`, fullPage: true })

    const btns = await page.$$eval('button', els => els.map(e => ({
      text: e.textContent?.trim(),
      visible: e.offsetParent !== null,
    })))
    console.log(`\n[${path}] 모든 버튼:`, JSON.stringify(btns, null, 2))
  }

  await browser.close()
}

main().catch(console.error)
