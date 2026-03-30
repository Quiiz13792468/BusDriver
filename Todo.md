# BusDriver — Todo & Issue Tracker

> 관리 원칙: 새 버그/요청/리뷰 이슈 발생 시 이 파일에 추가. 완료 시 `[x]`로 표시.
> 우선순위: 🔴 Blocker → 🟠 High → 🟡 Medium → 🟢 Low / Nit

---

## 완료된 작업

### 2026-03-31
- [x] **B-1** `shortages/page.tsx`: inactive 학생 필터 추가 (`isActive` 체크)
- [x] **B-2** `payments/page.tsx`: `getStudentById` N+1 → `allStudents` Map 조회로 교체
- [x] **B-3** `getRoutesBySchool`: stops N+1 → `restSelectIn` 일괄 조회 + JS 그루핑
- [x] **H-1** `payments/page.tsx`: `activeStudents` 필터에 `isActive` 추가
- [x] **H-2** `recordPayment`: INSERT 후 SELECT 제거 → 삽입 행 직접 반환
- [x] **H-3** `createStudent`: INSERT 후 SELECT 제거 → `mapRowToStudent` 직접 반환
- [x] **H-4** `requireSession`: 미인증 → `redirect('/login')`, 권한 없음 → `redirect('/dashboard')`
- [x] **H-5** `payments/page.tsx`: `getAllPayments()` → `getPaymentsByYear(selectedYear)`
- [x] **M-1** `createRoute` / `updateRoute`: INSERT/PATCH 후 SELECT 제거 → 객체 직접 구성
- [x] **M-2** `dashboard/page.tsx`: 연간 실적 계산에 `isActive` 조건 추가
- [x] **M-3** `payments/page.tsx`: `getSchoolById()` → `schools.find()` (DB 쿼리 제거)
- [x] `lib/data/school.ts`: `createSchool` INSERT 후 SELECT 제거
- [x] `protected-nav.tsx`: `paymentAddOpen` 미정의 변수 → `isPaymentsPath` 수정
- [x] next-auth 잔존 코드 전면 제거 (protected-shell, protected-nav, header-user-menu)
- [x] 입금 기록 추가 버튼 → 인라인 `PaymentQuickModal`
- [x] `record-payment-form.tsx` 로딩 오버레이 → `useNavigationOverlay` 통일
- [x] `shortage-request-form.tsx` 부족 인원/금액 뱃지 스타일
- [x] `payments/page.tsx` 총 금액 컬럼 우측 이동
- [x] `navigation-overlay.tsx` 40ms 딜레이 제거, 부제목 제거
- [x] `shortages/page.tsx` `listUsers` 일괄 조회 (N+1 제거)
- [x] `lib/data/alert.ts` `revalidateTag` 적용

---

## 🔴 Blocker

### ~~B-1. inactive 학생이 부족 인원 목록에 노출됨~~ ✅ 완료
- **파일**: `app/(protected)/dashboard/shortages/page.tsx:54`
- **Why**: `getAllStudents()` 호출 후 `isActive` 필터 없이 전체 학생 대상으로 부족금액 계산
- **Risk**: 이용 정지된 학생이 입금 요청 대상으로 나타남 → 학부모에게 잘못된 알림 발송
- **Fix**: `students.filter(s => s.isActive)` 적용 후 부족 계산

### ~~B-2. `payments/page.tsx` 월별 상세 조회 N+1~~ ✅ 완료

### ~~B-3. `getRoutesBySchool` N+1 — 정차지점 쿼리 과다~~ ✅ 완료

---

## 🟠 High

### ~~H-1. `getAllStudents()` inactive 미필터~~ ✅ 완료

### ~~H-2. `recordPayment` INSERT 후 불필요한 SELECT~~ ✅ 완료

### ~~H-3. `createStudent` INSERT 후 불필요한 SELECT~~ ✅ 완료

### ~~H-4. `requireSession` 실패 시 500 에러~~ ✅ 완료

### ~~H-5. `payments/page.tsx` ALL 학교 선택 시 `getAllPayments()` 호출~~ ✅ 완료

### ~~H-6. `routes/page.tsx` 학교별 `getRoutesBySchool` 직렬 가능성~~ ✅ 완료 (B-3 해결로 자동 개선)

---

## 🟡 Medium

### ~~M-1. `createRoute` / `updateRoute` INSERT 후 SELECT~~ ✅ 완료

### ~~M-2. 대시보드 연간 실적 — inactive 학생 포함 계산~~ ✅ 완료

### ~~M-3. `payments/page.tsx` `getSchoolById` 불필요한 별도 호출~~ ✅ 완료

### M-4. 학부모 대시보드 — 연도 선택 후 GET form submit (페이지 리로드)
- **파일**: `app/(protected)/dashboard/page.tsx:387-394`
- **Why**: 연도 변경 시 form submit으로 전체 페이지 리로드 — UX 저하
- **Fix**: `useRouter().push()` 또는 `<select onChange>` + searchParams 업데이트

### M-5. 입금 기록 추가 모달 — 학교 없을 때 빈 select
- **파일**: `components/payment-quick-modal.tsx:19`
- **Why**: 학교가 없으면 `setSelectedSchoolId('')`이 되고 RecordPaymentForm이 안 나타남 — 안내 없음
- **Fix**: 학교 없을 때 "등록된 학교가 없습니다" 안내 표시

### M-6. 노선 상세 페이지 — 카카오맵 `NotAuthorizedError` (코드 외 이슈)
- **Why**: Kakao Developer Console에서 해당 앱의 "OPEN_MAP_AND_LOCAL" 서비스 미활성화
- **Fix**: Kakao Developers → 앱 선택 → 플랫폼 → Web → OPEN_MAP_AND_LOCAL 활성화 (개발자 콘솔 작업)

### M-7. `getMonthlyPaymentSummary` 학교별 직렬 호출 — payments 페이지 느림
- **파일**: `app/(protected)/payments/page.tsx:49-62`
- **Why**: `Promise.all(schools.map(s => getMonthlyPaymentSummary(...)))` — 각 함수 내부에서 3개 쿼리 = 학교 5개 × 3 = 15 쿼리
- **Fix**: 연도 기준 전체 payments 한 번에 조회 후 JS에서 학교별 집계

### ~~M-8. `ShortageRequestForm` — 선택된 학생 수 뱃지 없음~~ ✅ 완료

---

## 🟢 Low / Nit

### L-1. `protected-nav.tsx` — import 순서 비표준
- **파일**: `components/protected-nav.tsx:9-12`
- **Why**: `lazy()` 호출이 static import 사이에 위치 — 린터 경고 가능
- **Fix**: lazy import를 static import 블록 아래로 이동

### L-2. `UserRecord.passwordHash` 필드 잔존
- **파일**: `lib/data/types.ts:8`
- **Why**: Supabase Auth 이전 후 더 이상 사용하지 않는 `passwordHash` 필드 타입에 남아있음
- **Fix**: `UserRecord` 타입에서 제거 (사용 여부 grep 확인 후)

### L-3. `payment.ts` 정렬 방향 일관성
- **파일**: `lib/data/payment.ts:83, 90, 96`
- **Why**: 모두 `b.targetYear - a.targetYear` (최신순) — `getAllPayments`는 `updatedAt` 기준 다름
- **Note**: 의도적 차이라면 주석 추가 권장

### L-4. `board/page.tsx` — 관리자 ADMIN 페이지에서 `getSchools()` 불필요 여부 확인
- **파일**: `app/(protected)/board/page.tsx:18`
- **Why**: 공지 작성 폼에 학교 선택이 필요하긴 하나 데이터 미사용 경우도 있음
- **Note**: 현재는 필요함 — 이슈 아님, 재확인용

### L-5. AdSlot 컴포넌트 — 실제 광고 미연동
- **파일**: `components/ads/ad-slot.tsx`
- **Why**: 플레이스홀더만 있고 실제 광고 네트워크 미연동
- **Fix**: Google AdSense 또는 다른 광고 네트워크 연동 검토

---

## 📋 기능 요청 / 개선

### F-1. 입금 내역 삭제 기능
- 잘못 입력된 입금 기록을 삭제할 수 없음
- `deletePayment(id)` 서버 액션 + 확인 다이얼로그 필요

### F-2. 학생 일괄 이월 (연도 넘어갈 때)
- 매년 새 학년도 시작 시 활성 학생 목록 재확인 흐름 없음
- 연도별 활성/비활성 일괄 처리 기능 검토

### F-3. 입금 알림 실제 발송 (카카오 알림톡 / SMS)
- `requestShortagePaymentAction` — 현재 Alert 생성만 하고 실제 메시지 발송 없음
- 카카오 알림톡 or SMS 연동 시 실효성 증가

### F-4. 관리자 대시보드 — 학교별 수납률 차트
- 현재 숫자 테이블만 있음 — 월별 수납률 bar chart 추가 시 가독성 향상

### F-5. 학부모 앱 — 푸시 알림 (PWA)
- 입금 요청 시 학부모에게 브라우저 푸시 알림
- Service Worker + Web Push API 연동 필요

### F-6. 결제 내역 CSV 내보내기
- 관리자가 월별/학교별 결제 내역을 엑셀로 다운로드할 수 없음
- `payments` 데이터 CSV export 서버 액션 추가

### F-7. 학생 검색 기능
- 학교/학생 관리 페이지에 이름 검색 없음 — 학생 수 증가 시 탐색 불편
- `SchoolsTabs`에 검색 input 추가

---

## 🔒 보안 체크리스트

- [ ] B-4: Supabase RLS 정책 — `payments`, `students`, `alerts` 테이블에 행 수준 보안 활성화 여부 확인
- [ ] PARENT 역할이 다른 학부모 학생 데이터에 접근할 수 없는지 RLS로 차단 확인
- [ ] `createAdminClient()` 사용처가 서버 사이드에서만 호출되는지 확인 (`server-only` import 체크)
- [ ] 초대 토큰 만료 처리 — 만료된 토큰 재사용 불가 확인 (`lib/data/invite.ts`)

---

## 🐛 오류 이력

| 날짜 | 오류 | 원인 | 해결 |
|------|------|------|------|
| 2026-03-30 | Vercel build: `schoolId: string\|null` not assignable | `quick-payment-dialog.tsx` 타입 | `schoolId!` non-null assertion |
| 2026-03-30 | Vercel build: `authOptions` not exported | `api/invite/route.ts` next-auth 잔존 | `requireSession` 방식으로 재작성 |
| 2026-03-30 | Prerender error: 로그인이 필요합니다 | protected layout에 dynamic 미설정 | `force-dynamic` 추가 |
| 2026-03-30 | `restCount` not found | `alert.ts` import 누락 | import 추가 |
| 2026-03-30 | 로그아웃 404 localhost:3000 | next-auth signOut 잔존 | Supabase signOut으로 전환 |
| 2026-03-30 | 학부모 로그인 서버 오류 Digest:1896323267 | `countUnreadBoardNotifications` 미catch | `.catch(() => 0)` 추가 |
| 2026-03-30 | `protected-nav.tsx` `paymentAddOpen` 미정의 | 변수명 오류 | `isPaymentsPath`로 수정 |
