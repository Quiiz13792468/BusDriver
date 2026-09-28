// driver01 권한 검증 — 5개 등록 작업 테스트
import { chromium } from 'playwright'

const BASE = 'http://localhost:3000'

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.waitForLoadState('networkidle')
  await page.fill('#login_id', 'driver01')
  await page.fill('#password', 'test1234!')
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 })
  console.log('로그인 성공:', page.url())
}

// 모달 안 에러 텍스트 — p 태그 중 에러 키워드 포함
async function getModalError(page) {
  const texts = await page.$$eval('p', els =>
    els
      .filter(e => {
        const t = e.textContent?.trim() || ''
        return t.length > 0 && t.length < 120 &&
          (t.includes('없습니다') || t.includes('실패') || t.includes('오류') ||
           t.includes('선택해') || t.includes('입력해') || t.includes('권한') ||
           t.includes('다시') || t.includes('찾을 수'))
      })
      .map(e => e.textContent?.trim())
  )
  return texts.length > 0 ? texts[0] : null
}

// 제출 후 결과 확인: 모달이 닫혔으면 성공, 열려있으면 실패
async function checkSubmitResult(page, submitBtnText = '등록하기') {
  await page.waitForTimeout(3000)
  const modalOpen = await page.locator(`button[type="submit"]:has-text("${submitBtnText}")`).isVisible()
  if (!modalOpen) return 'OK'
  const err = await getModalError(page)
  return `FAIL: ${err || '알 수 없는 에러 (모달 미닫힘)'}`
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.setViewportSize({ width: 390, height: 844 })
  const results = {}
  let testStudentName = ''

  try {
    await login(page)

    // ─── 1. 학생 추가 ─────────────────────────────────────────────────────────
    await page.goto(`${BASE}/schools`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    let studentBtn = await page.$('button:has-text("학생 등록")')
    if (!studentBtn) studentBtn = await page.$('button:has-text("+ 학생")')
    if (!studentBtn) {
      const btns = await page.$$eval('button', els => els.map(e => e.textContent?.trim()).filter(Boolean))
      console.log('/schools 버튼 목록:', btns)
      results['학생추가'] = `FAIL: 학생 등록 버튼 없음`
    } else {
      await studentBtn.click()
      await page.waitForTimeout(800)
      const nameInput = await page.$('input[name="name"]')
      if (!nameInput) {
        results['학생추가'] = 'FAIL: 폼 열렸으나 이름 입력란 없음'
      } else {
        testStudentName = '자동테스트학생_' + Date.now()
        await nameInput.fill(testStudentName)
        await page.click('button[type="submit"]')
        results['학생추가'] = await checkSubmitResult(page, '등록')
      }
      const closeBtn = await page.$('button:has-text("닫기")')
      if (closeBtn) await closeBtn.click()
    }

    // ─── 2. 학교 추가 ─────────────────────────────────────────────────────────
    await page.goto(`${BASE}/settings/schools`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    let schoolBtn = await page.$('button:has-text("학교 추가")')
    if (!schoolBtn) schoolBtn = await page.$('button:has-text("+ 학교")')
    if (!schoolBtn) schoolBtn = await page.$('button:has-text("학교 등록")')
    if (!schoolBtn) {
      const btns = await page.$$eval('button', els => els.map(e => e.textContent?.trim()).filter(Boolean))
      console.log('/settings/schools 버튼 목록:', btns)
      results['학교추가'] = 'FAIL: 버튼 없음'
    } else {
      await schoolBtn.click()
      await page.waitForTimeout(800)
      const nameInput = await page.$('input[name="name"]')
      if (!nameInput) {
        results['학교추가'] = 'FAIL: 폼 열렸으나 학교명 입력란 없음'
      } else {
        await nameInput.fill('자동테스트초등학교_' + Date.now())
        await page.click('button[type="submit"]')
        results['학교추가'] = await checkSubmitResult(page)
      }
    }

    // ─── 3. 입금 등록 (GlobalActions → 입금 모달) ─────────────────────────────
    await page.goto(`${BASE}/payments`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const payBtn = page.locator('button', { hasText: '입금' }).first()
    await payBtn.click()
    await page.waitForTimeout(1000)

    // 학생 검색
    const studentSearch = await page.$('input[placeholder="이름으로 검색..."]')
    if (studentSearch) {
      await studentSearch.fill('자동테스트')
      await page.waitForTimeout(800)

      // 드롭다운에서 학생 클릭 — type="button" 중 "자동테스트" 포함
      const allTypeBtns = await page.$$('button[type="button"]')
      let picked = false
      for (const btn of allTypeBtns) {
        const txt = (await btn.textContent())?.trim() || ''
        const visible = await btn.isVisible()
        if (visible && txt.includes('자동테스트')) {
          await btn.click()
          picked = true
          console.log('학생 선택:', txt)
          break
        }
      }
      if (!picked) {
        console.log('학생 드롭다운 항목 없음 — 등록된 학생 부족 가능')
      }
      await page.waitForTimeout(1500) // 납부월 로딩 대기
    }

    // 첫 번째 미납 월 클릭
    const allBtnEls = await page.$$('button[type="button"]')
    let monthClicked = false
    for (const btn of allBtnEls) {
      const txt = (await btn.textContent())?.trim() || ''
      const disabled = await btn.getAttribute('disabled')
      const visible = await btn.isVisible()
      if (visible && txt.includes('미납') && disabled === null) {
        await btn.click()
        console.log('월 선택:', txt)
        monthClicked = true
        break
      }
    }
    if (!monthClicked) console.log('미납 월 버튼 없음')

    // 금액 입력
    const amountInput = await page.$('input[name="amount"]')
    if (amountInput) await amountInput.fill('50000')

    // 제출
    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: '등록하기' }).first()
    await submitBtn.click({ timeout: 10000 })
    results['입금등록'] = await checkSubmitResult(page, '등록하기')

    // ─── 4. 주유 등록 ─────────────────────────────────────────────────────────
    await page.goto(`${BASE}/payments`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // "주유" 버튼 — "입금" 다음에 위치
    const fuelBtn = page.locator('button', { hasText: '주유' }).first()
    await fuelBtn.click()
    await page.waitForTimeout(1000)

    const fueledAtInput = await page.$('input[name="fueled_at"]')
    if (fueledAtInput) await fueledAtInput.fill('2026-05-01')

    const fuelAmountInput = await page.$('input[name="amount"]')
    if (!fuelAmountInput) {
      results['주유등록'] = 'FAIL: 주유 모달 금액 입력란 없음'
    } else {
      await fuelAmountInput.fill('80000')
      const fuelSubmit = page.locator('button[type="submit"]').filter({ hasText: '등록하기' }).first()
      await fuelSubmit.click({ timeout: 10000 })
      results['주유등록'] = await checkSubmitResult(page, '등록하기')
    }

    // ─── 5. 게시판 등록 (/board?tab=notices → + 공지 작성) ───────────────────
    await page.goto(`${BASE}/board?tab=notices`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    let boardBtn = await page.$('button:has-text("+ 공지 작성")')
    if (!boardBtn) boardBtn = await page.$('button:has-text("공지 작성")')
    if (!boardBtn) boardBtn = await page.$('button:has-text("작성")')
    if (!boardBtn) boardBtn = await page.$('button:has-text("글쓰기")')

    if (!boardBtn) {
      const btns = await page.$$eval('button', els =>
        els.filter(e => e.offsetParent !== null).map(e => e.textContent?.trim()).filter(Boolean)
      )
      console.log('/board?tab=notices 버튼:', btns)
      results['게시판등록'] = `FAIL: 버튼 없음 [${btns.join(', ')}]`
    } else {
      await boardBtn.click()
      await page.waitForTimeout(800)

      const titleInput = await page.$('input[name="title"]')
      const contentInput = await page.$('textarea[name="content"]')

      if (!titleInput || !contentInput) {
        results['게시판등록'] = 'FAIL: 폼 열렸으나 입력란 없음'
      } else {
        await titleInput.fill('자동테스트 공지_' + Date.now())
        await contentInput.fill('자동 테스트 내용입니다.')
        await page.click('button[type="submit"]')
        results['게시판등록'] = await checkSubmitResult(page)
      }
    }

  } catch (e) {
    console.error('테스트 오류:', e.message)
    console.error(e.stack?.split('\n').slice(0, 5).join('\n'))
  } finally {
    await browser.close()
  }

  console.log('\n=== 권한 테스트 결과 ===')
  for (const [key, val] of Object.entries(results)) {
    const icon = val === 'OK' ? '✅' : val.startsWith('SKIP') ? '⚠️' : '❌'
    console.log(`${icon} ${key}: ${val}`)
  }

  const failures = Object.values(results).filter(v => v.startsWith('FAIL'))
  if (failures.length === 0 && Object.keys(results).length >= 5) {
    console.log('\n모든 권한 테스트 통과.')
    process.exit(0)
  } else if (failures.length > 0) {
    console.log(`\n${failures.length}개 실패.`)
    process.exit(1)
  } else {
    console.log('\n일부 테스트 미실행.')
    process.exit(1)
  }
}

main()
