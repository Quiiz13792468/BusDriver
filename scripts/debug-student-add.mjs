// 학생 추가 → /payments 드롭다운 검증
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
  console.log('로그인:', page.url())

  // ─── 1. schools 페이지 현재 학생 수 확인 ───────────────────────────
  await page.goto(`${BASE}/schools`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  const pageText = await page.locator('body').innerText()
  const match = pageText.match(/총 (\d+)명/)
  console.log('\n현재 학생 수:', match ? match[0] : '파악 불가')
  console.log('schools 본문 일부:', pageText.slice(0, 200))

  // ─── 2. 학생 추가 ───────────────────────────────────────────────────
  let studentBtn = await page.$('button:has-text("학생 등록")')
  if (!studentBtn) studentBtn = await page.$('button:has-text("+ 학생")')
  if (!studentBtn) {
    const btns = await page.$$eval('button', els => els.map(e => e.textContent?.trim()).filter(Boolean))
    console.log('버튼 목록:', btns)
    await browser.close()
    return
  }

  await studentBtn.click()
  await page.waitForTimeout(800)

  const nameInput = await page.$('input[name="name"]')
  if (!nameInput) {
    console.log('이름 입력란 없음')
    await browser.close()
    return
  }

  const studentName = '자동테스트_' + Date.now()
  await nameInput.fill(studentName)
  console.log('\n추가할 학생 이름:', studentName)

  // submit 버튼 확인
  const submitBtns = await page.$$eval('button[type="submit"]', els =>
    els.filter(e => e.offsetParent !== null).map(e => e.textContent?.trim())
  )
  console.log('submit 버튼들:', submitBtns)

  await page.click('button[type="submit"]')
  await page.waitForTimeout(3000)

  // 모달이 닫혔는지 확인
  const modalStillOpen = await page.$('input[name="name"]')
  console.log('submit 후 이름 입력란 여전히 있음:', !!modalStillOpen)

  if (modalStillOpen) {
    // 에러 확인
    const errTexts = await page.$$eval('p', els =>
      els.filter(e => e.offsetParent !== null).map(e => e.textContent?.trim()).filter(Boolean)
    )
    console.log('화면 p 태그:', errTexts.slice(0, 10))
  }

  // ─── 3. schools 페이지 재확인 ───────────────────────────────────────
  await page.goto(`${BASE}/schools`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  const pageText2 = await page.locator('body').innerText()
  const match2 = pageText2.match(/총 (\d+)명/)
  console.log('\n추가 후 학생 수:', match2 ? match2[0] : '파악 불가')

  const hasNewStudent = pageText2.includes(studentName.slice(0, 10))
  console.log('새 학생 목록에 있음:', hasNewStudent)

  // ─── 4. /payments → 입금 모달 → 드롭다운 확인 ────────────────────────
  await page.goto(`${BASE}/payments`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  await page.locator('button', { hasText: '입금' }).first().click()
  await page.waitForTimeout(1000)

  const searchInput = await page.$('input[placeholder="이름으로 검색..."]')
  if (!searchInput) {
    console.log('\n학생 검색 인풋 없음')
  } else {
    await searchInput.fill('자동테스트')
    await page.waitForTimeout(800)

    const dropdownItems = await page.$$eval('[style*="position: absolute"] button[type="button"]', els =>
      els.filter(e => e.offsetParent !== null).map(e => e.textContent?.trim())
    )
    console.log('\n드롭다운 항목:', dropdownItems)

    // 대안: 전체 가시 버튼 중 학생 이름 포함
    const allVisibleBtns = await page.$$eval('button', els =>
      els.filter(e => e.offsetParent !== null).map(e => e.textContent?.trim()).filter(t => t?.includes('자동테스트'))
    )
    console.log('"자동테스트" 포함 버튼:', allVisibleBtns)
  }

  await browser.close()
}

main().catch(console.error)
