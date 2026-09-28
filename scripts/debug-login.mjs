import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('networkidle')

  await page.fill('#login_id', 'driver01')
  await page.fill('#password', 'test1234!')
  await page.click('button[type="submit"]')

  // wait longer for Supabase auth round-trip
  try {
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    console.log('로그인 성공:', page.url())
  } catch {
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'scripts/login-after2.png' })
    const errEls = await page.$$eval('*', els =>
      els.filter(e => e.children.length === 0 && e.textContent?.trim())
         .map(e => ({ tag: e.tagName, text: e.textContent?.trim().slice(0, 80) }))
         .filter(e => e.text && (e.text.includes('실패') || e.text.includes('오류') || e.text.includes('없') || e.text.includes('error') || e.text.includes('Error')))
    )
    console.log('에러 관련 텍스트:', JSON.stringify(errEls, null, 2))
    console.log('현재 URL:', page.url())
  }

  await browser.close()
}

main().catch(console.error)
