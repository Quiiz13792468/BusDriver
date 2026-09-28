// 입금 모달 상태 확인
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
  await page.click('button:has-text("입금")')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'scripts/debug-pay-modal.png', fullPage: false })

  // 모달 안 버튼/인풋 확인
  const btns = await page.$$eval('button', els => els.map(e => ({
    text: e.textContent?.trim().slice(0, 30),
    visible: e.offsetParent !== null,
    type: e.getAttribute('type'),
    disabled: e.disabled,
  })))
  console.log('\n입금 모달 열린 후 버튼:')
  for (const btn of btns) {
    console.log(`  ${btn.visible ? '✓' : '✗'} [${btn.type}] "${btn.text}" disabled=${btn.disabled}`)
  }

  const inputs = await page.$$eval('input, textarea, select', els => els.map(e => ({
    tag: e.tagName,
    name: e.getAttribute('name'),
    placeholder: e.getAttribute('placeholder'),
    visible: e.offsetParent !== null,
    type: e.getAttribute('type'),
  })))
  console.log('\n모달 인풋:')
  for (const inp of inputs) {
    console.log(`  ${inp.visible ? '✓' : '✗'} ${inp.tag}[name=${inp.name}] type=${inp.type} placeholder="${inp.placeholder}"`)
  }

  await browser.close()
}

main().catch(console.error)
