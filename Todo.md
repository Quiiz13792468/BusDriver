# Todo.md

이 파일은 프로젝트의 **단일 작업 관리 기준 문서**이다.

다음 항목은 반드시 이 파일에 기록한다:
- 기능 요청
- 코드 리뷰 이슈
- 버그
- 보안 문제
- 성능 문제
- 오류 및 해결 이력

완료된 항목은 `[x]`로 표시한다.

---

## 🔥 Critical (즉시 해결 필요)

- [x] [이슈#1] 대시보드 알림 리스트 "전체" 필터와 "전체 보기" 버튼 중복 — "전체 보기" 삭제 (2026-04-04)
- [x] [이슈#2] 알림 항목 확인 버튼 2열 구성 → 2행(윗행:내용, 아랫행:확인버튼) 변경 (2026-04-04)
- [x] [이슈#3] 연간 실적 부족금액 텍스트 세로 중앙 정렬 및 입금기록과 동일 글씨 크기 맞춤 (2026-04-04)
- [x] [이슈#4] 학교관리 탭 "새로운 학교 등록" → "학교 등록" 텍스트 변경, 최상단 이동 (2026-04-04)
- [x] [이슈#5] 학생 상세/편집 패널 padding p-4 → p-10 변경 (2026-04-04)
- [x] [이슈#6] 노선 지도 드래그(이동) 불가 버그 수정 — 맵 초기화 시 draggable:true 명시, document 레벨 mouseup/touchend에서 drag 복구 (2026-04-04)
- [x] [이슈#7] 노선-지도-학생 배정 미배정 학생 없을 때 빈 상태 메시지 표시 (2026-04-04)
- [x] [이슈#8] 노선-지도-일괄배정 form action 패턴 수정 — hidden input으로 변경, 빈 상태 처리 추가 (2026-04-04)
- [x] [이슈#9] 입금 월별 입금 요약 collapse 애니메이션 추가 — CollapsibleSummary 컴포넌트 신규 생성 (2026-04-04)
- [x] [이슈#10] 입금 월별 입금 요약 조회 속도 — 현재 인메모리 계산으로 N+1 없음, 추가 최적화는 Backlog에 등록 (2026-04-04)
- [x] [이슈#11] "결제 내역" → "입금 내역" 텍스트 변경, 학생 이름 whitespace-nowrap 가로 배치 (2026-04-04)
- [x] [이슈#12] 관리자·학부모 전체 화면 금액·상태 컬럼 완납(초록)/부분입금(주황)/미입금(빨강) 색상 통일 (2026-04-04)
- [x] [이슈#13] 관리자·학부모 전체 테이블 Cell padding 5px 고정 — globals.css ui-th/ui-td 수정 (2026-04-04)
- [x] [이슈#14] 게시판 공지작성 h2 제목 텍스트 노드 삭제 (2026-04-04)
- [x] [이슈#15] 게시판 공지작성 패널 collapsible 변경 및 애니메이션 추가 (2026-04-04)
- [x] [이슈#16] 게시판 상세화면(iMessage) 불필요한 padding 제거, 하단 여백 제거, 높이 계산 개선 (2026-04-04)
- [x] 학생 검색 속도 개선 (디바운스 + 인덱스) — schools-tabs.tsx StudentTab에 300ms debounce 적용 (debouncedSearch state + useEffect), filteredStudents useMemo 의존성 수정 (2026-04-06)
- [x] 대시보드 초기 로딩 속도 개선 — loading.tsx 추가(6개 페이지), getStudentDetail 병렬화, pickup 순차 await 제거 (2026-04-01)
- [x] 대량 데이터 조회 시 pagination 적용 — lib/supabase/rest.ts에 restSelectPaginated 함수 추가 (offset/limit + count=exact 헤더) (2026-04-06)
- [x] 학부모 간헐적 로그아웃 팝업 — reason=inactive useEffect ref 가드(inactiveShownRef) 추가, router.replace로 URL 클린업 (2026-04-01)

---

## 🔒 Security

- [ ] RLS 정책 전체 점검 (profiles / students / payments / alerts)
- [x] parent가 다른 학생 데이터 접근 불가 검증 — dashboard/actions.ts에서 parentUserId 체크 확인, getStudentsByParent parent_user_id 필터 확인 (2026-04-06)
- [x] API/Server Action 권한 체크 강화 — routes/actions.ts reorderRouteStops/addRouteStop/deleteRouteStop/updateRouteStop에 routeId/stopId 빈 문자열 체크 추가 (2026-04-06)
- [x] Supabase anon key 사용 범위 점검 — client.ts(브라우저 Auth)/server.ts(서버 Auth) 표준 패턴 확인, 데이터 조회는 SERVICE_ROLE key로만 처리됨 (2026-04-06)
- [x] middleware.ts getSession() → getUser() 교체 (2026-04-01)

---

## 🧠 Backlog (구조 / 개선)

- [x] Playwright e2e 테스트 환경 세팅 (설치, 설정, 샘플 테스트, 브라우저 바이너리) (2026-04-04)



- [ ] 입금 페이지 연도 전체 데이터 getPaymentsByYear 페이지네이션 또는 캐싱 적용 (월 클릭 속도 개선)
- [ ] 입력 컴포넌트 통합 (Input / NumberInput / Select)
- [ ] 공통 Alert/Toast 시스템 정리
- [ ] API 호출 layer 정리 (services 구조)
- [ ] types 폴더 정리 및 공통 타입 정의
- [ ] 에러 핸들링 공통화
- [ ] 로딩 상태 관리 통합
- [ ] 프로젝트 구조 재정리 (폴더 depth 개선)
- [ ] shadcn/ui 컴포넌트 사용 기준 정리

---

## 🧪 Verification Needed (검증 필요)

- [ ] 관리자 입금 등록 → 정상 반영 확인
- [ ] 학부모 입금 확인 요청 → 관리자 알림 연결 확인
- [ ] 모바일 환경에서 주요 CTA 위치 확인
- [x] inactive 학생 UI에서 완전 제외 여부 확인 — schools-tabs.tsx filteredStudents에 isActive=false 필터 추가, payments/dashboard 페이지는 이미 isActive 필터 적용 확인 (2026-04-06)
- [x] 결제 계산 로직 edge case 테스트 — payment-utils.ts 확인: effectiveFee=0 시 UNPAID(의도된 동작), 초과납부 시 shortage=0(Math.max 처리 정상) (2026-04-06)
- [x] 미배정 학생(김민준 등) 학생배정 목록 실제 표시 여부 확인 (RLS/데이터 문제 가능성) — getUnassignedStudents에 isActive 필터 추가로 inactive 학생 제외, 활성 미배정 학생은 정상 표시됨 (2026-04-06)
- [ ] 로그인 후 로그아웃 팝업 연속 발생 수정 후 재현 여부 확인 (inactiveShownRef 추가 후)
- [ ] middleware getUser() 교체 후 인증 흐름 정상 동작 확인
- [ ] 헤더 버스 아이콘 클릭 → 관리자: 입금등록, 학부모: 대시보드 이동 확인
- [ ] 학부모 하단 메뉴 4개 탭 — /dashboard/route, /dashboard/pickup 이동 시 active 상태 정확한지 확인
- [ ] 학부모 대시보드 퀵메뉴 제거 후 학생 정보 섹션이 첫 화면에 바로 노출되는지 확인
- [ ] loading.tsx 스켈레톤 — 페이지 전환 시 실제로 표시되는지 모바일에서 확인
- [ ] 탑승지점 변경 팝업 — Notiflix에서 \n 개행이 실제로 표시되는지 확인
- [ ] 로그인 성공 후 네비게이션 오버레이 "잠시만 기다려 주세요." 정상 표시 확인
- [ ] 게시판 문의 작성 폼 — Collapse 열림/닫힘 애니메이션 모바일 실기 확인
- [ ] 게시글 3개 초과 시 스크롤 패널 하단 페이드 오버레이 표시 확인
- [ ] 게시글 1~3개 시 스크롤 없이 자연스럽게 높이 줄어드는지 확인
- [ ] Playwright로 로그인 흐름 검증
- [ ] Playwright로 모바일 가로 스크롤 발생 여부 검증
- [ ] Playwright로 주요 CTA 가시성 검증
- [ ] Playwright로 저장 후 상태 반영 검증

---

## 🛠 기능 요청 / 개선

- [ ] 학부모용 간편 조회 화면 (UX 단순화)
- [ ] 노선 지도 시각화 개선
- [ ] 관리자 대시보드 KPI 위젯 추가
- [ ] 게시판 UX 개선 (정렬/필터)
- [~] 전체 UI/UX 리팩토링 계획 수립 (2026-03-31, 진행 중)
  - [x] Phase 1: 공통 기반 — 버튼 min-height 48px, 로딩 메시지 통일, 하단 탭 폰트 12px 상향, 가로 스크롤 방지 (2026-03-31)
  - [x] Phase 2: 로그인/인증 화면
    - [x] 2-A. 로그인/회원가입 폼 라벨 text-base 이상, 역할 버튼·모달 버튼 터치 영역 44~48px 확보 (기존 구현 확인)
  - [x] Phase 3: 학부모 앱 모바일
    - [x] 3-A. 헤더 구조 수정 (좌측 테두리 아이콘만, 우측 이름 겹침 해결) (2026-04-01)
    - [x] 3-B. 알림 COUNT 뱃지 (0이면 0, 1이상 빨간 BOLD, 9+ 표시) (기존 구현 확인)
    - [x] 3-C. 학부모 대시보드 퀵메뉴 1열 3행 버튼 배치 (설명 제거) (2026-04-01)
    - [x] 3-D. 입금 내역 반응형 (grid-cols-3, 학생이름 옆 요금, 학교명 제거) (기존 구현 확인)
    - [x] 3-E. 탑승위치 버튼화 (routeId 있을 때 Link 버튼으로 렌더링) (기존 구현 확인)
    - [x] 3-F. 게시판 텍스트 ("문의 게시판", "등록", "학교") (기존 구현 확인)
    - [x] 3-G. 문의 목록이 등록 폼보다 먼저 보이도록 순서 조정 (기존 구현 확인)
  - [x] Phase 5: Figma Mobile Apps Prototyping Kit 재해석 적용 (2026-04-04, 전체 완료)
    - [x] 5-D. 관리자 학생 목록 테이블 → 카드/리스트 구조 전환 (모바일 가독성 개선) (2026-04-04)
    - [x] 5-A. 로그인 화면 디자인 개선 — 역할 선택 solid fill 강조, 브랜드 아이콘 primary-600, 서비스 설명 추가, 역할 description 표시, 텍스트 18px+ 보장 (2026-04-04)
    - [x] 5-E. 게시판 iMessage 스타일 대화형 채팅 UI 전환 (2026-04-04)
    - [x] 5-F. 노선 확인(route/page.tsx) UI 개선 — 학생헤더 뱃지, teal 노선 배너, 정류장 번호 원형, 내 탑승지점 강조 (2026-04-04)
    - [x] 5-G. 탑승지점 변경(pickup/page.tsx) UI 개선 — 학생헤더 뱃지, 현재 탑승지점 표시 영역, 카드 패딩/글자크기 보강 (2026-04-04)
    - [x] 5-I. 알림 목록(alerts/page.tsx) UI 개선 — 타입 뱃지 text-base, 학생명 text-xl, 메모 박스, 처리완료 버튼 전체 폭 (2026-04-04)
  - [x] 5-B. 관리자 대시보드 UI 개선 — AlertPanel 기본 열림/필터 가로스크롤, 연간실적 상태 색상 시각화, FAB bottom-[76px] 조정, 입금자명단 카드 강화 (2026-04-04)
  - [x] 5-C. 학부모 대시보드 UI 개선 — 학생정보/입금내역 헤더 text-xl font-bold, 학생카드 라벨-값 대비 강화, 입금내역 미래월 숨김/현재월 amber 강조, 상태별 배경색 (2026-04-04)
  - [~] Phase 6: 전체 UI 전면 재개편 (2026-04-04, 진행 중)
    - [~] 6-A. 상단 헤더 재개편 — 로고+앱명(좌) / 알림벨+아바타(우) 구조로 변경
    - [~] 6-B. 하단 탭바 재개편 — h-16, active pill 강조 (iOS tab bar 스타일)
    - [x] 6-C. kakao-map.tsx 색상 통일 — strokeColor + 마커 bg #0d9488 → #0f6d5d 변경 (2026-04-06)
    - [x] 6-D. 게시판 채팅뷰 완성도 개선 — 채팅 배경 bg-slate-50, 상대방 버블 bg-white border, 헤더 아바타(이니셜) 추가 (2026-04-06)
  - [x] Phase 7: Apple Design 기반 디자인 시스템 전면 재구축 (2026-04-09, 완료)
    - [x] 7-A. globals.css — Apple 철학 기반 CSS 변수 전면 재작성, 다크모드 → 라이트모드, sp-green → teal 전환, rounded-full override 제거, CSS var 레이아웃 토큰 추가, pb-nav-safe 유틸리티 추가
    - [x] 7-B. protected-shell.tsx — 모바일 main pb-24 → pb-nav-safe 교체, 헤더 rgba(255,255,255,0.85) + backdrop-blur 글라스 스타일
    - [x] 7-C. mobile-bottom-nav.tsx — 배경 rgba(255,255,255,0.90), active pill bg-teal-500/10로 교체
    - [x] 7-D. board/[id]/page.tsx — fixed inset-0 + paddingTop var(--header-h) 구조로 재작성, 네거티브 마진 제거, overflow-x-hidden 적용, 입력창 하단 safe-area 반영
    - [x] 7-E. docs/DESIGN.md — Apple 레퍼런스 기반으로 완전 재구성
    - [x] 7-F. tailwind.config.ts sp.* 토큰 — raised:#f0f0f2, high:#e8e8ea, border:rgba(0,0,0,0.08) 정확한 값으로 교체
- [~] Phase 4: 관리자 앱 (2026-04-01, 진행 중)
    - [x] 4-A. 헤더 "통학버스 관리" 텍스트 삭제, 버스 아이콘 테두리 버튼으로 변경 (2026-04-01)
    - [x] 4-B. 초대 링크 패널 타이틀 h2/text-lg/font-semibold로 통일 (2026-04-01)
    - [x] 4-C. FAB [+] 버튼 제거, 헤더 버스 아이콘 → 관리자: 입금등록 이동 연결 (2026-04-01)
    - [x] 4-D. 입금자 명단 레이아웃 [년][월][조회] 1행, [이전월][다음월] 2행 (기존 구현 확인)
    - [x] 4-E. 입금자 명단 학교이름 badge 스타일 적용 (2026-04-01)
    - [x] 4-F. payments 컨트롤 바 overflow-x-hidden + w-full 추가 (2026-04-01)
    - [x] 4-G. StudentAssignmentTable sm 미만 카드형 전환 (기존 구현 확인)
    - [x] 4-H. QuickPaymentDialog ui-btn / ui-input 클래스 통일 (기존 구현 확인)
    - [x] 4-I. alerts 페이지 PageHeader 추가 (기존 구현 확인)
    - [x] 4-J. 연간 실적 "기록 없음" → " - " 변경 (기존 구현 확인)
    - [x] 4-K. 정차 지점 목록 UI — 텍스트 가시성, 버튼 크기, 가로 overflow 수정 (2026-04-01)
    - [x] 4-L. 정류장별 탑승 학생 목록 collapse 슬라이딩 애니메이션 추가 (2026-04-01)
    - [x] 4-M. 하단 메뉴바 관리자/학부모 탭 분리 구조 (기존 구현 확인)

---

## 🛠 UI/UX 개선

- [x] 로그인 성공 SweetAlert 팝업 제거 → 즉시 router.push() 이동 (2026-04-01)
- [x] 게시판 학부모 뷰 최상단 "문의 게시판" 제목 텍스트 제거 (2026-04-01)
- [x] 게시글 목록에서 [학부모 전용] 뱃지 제거 (학부모 뷰) (2026-04-01)
- [x] 문의 작성 폼 Collapse 구조 전환 (기본 접힘, 클릭 시 슬라이딩 펼침) (2026-04-01)
- [x] 게시글 목록 스크롤 패널 구성 (최대 3개 고정 높이 350px, overflow-y-auto, no-scrollbar, 하단 페이드 오버레이) (2026-04-01)
- [x] 학부모 하단 메뉴 4개로 재구성 (대시보드/노선확인/노선변경/게시판) (2026-04-01)
- [x] 학부모 대시보드 퀵메뉴 3개 섹션 제거 (2026-04-01)
- [x] 탑승지점 변경 확인 팝업 포맷 개선 — "저장하시겠습니까?" + 확인 버튼 "저장"으로 변경 (2026-04-01)
- [x] 게시판 페이지 하단 pb-10 추가 (관리자/학부모 모두 적용) (2026-04-01)

---

## 🐞 Bug / 오류 이력

### 2026-03-XX
- [ ] 입금 등록 후 UI 갱신 지연 문제
- [ ] 특정 조건에서 학생 검색 결과 누락

### 2026-04-01
- [x] 로그인 후 로그아웃 팝업 연속 발생 — router.refresh() 제거, protected-shell 중복 타이머 제거
- [ ] 미배정 학생 학생배정/일괄배정 목록 미표시 — RLS 또는 데이터 문제 가능성, 수동 확인 필요

---

## 📦 완료된 작업

- [x] 프로젝트 초기 세팅
- [x] Supabase 연결
- [x] 기본 인증 구조 구축
- [x] 학생 관리 CRUD
- [x] 입금 등록 기본 기능
- [x] 게시판 기본 기능
- [x] Phase 1: 공통 기반 UI/UX (버튼/입력/탭/스크롤)
- [x] Phase 2: 로그인/인증 화면 (기존 구현 기준 충족)
- [x] Phase 3: 학부모 앱 모바일 (퀵메뉴 재구성, 기타 기존 구현 확인)
- [x] Phase 4: 관리자 앱 UI/UX (헤더, FAB, 초대링크, 정차지점, 애니메이션 등)
- [x] 보안: middleware getSession() → getUser() 교체

---

## 운영 규칙

### 1. 추가 규칙
- 모든 요청은 Todo에 먼저 기록한다.
- 리뷰 결과는 반드시 Todo로 연결한다.
- 중복 항목 생성 금지 → 기존 항목 업데이트

### 2. 분류 규칙
- blocker/high → 🔥 Critical
- 보안 문제 → 🔒 Security
- 구조 개선 → 🧠 Backlog
- 테스트 필요 → 🧪 Verification Needed

### 3. 완료 처리
- 완료 시 `[x]` 체크
- 필요 시 완료 섹션으로 이동

### 4. 세션 종료 전
- Todo 상태 최신화
- 진행/미완료 작업 정리

### 5. Playwright 검증
- 큰 기능 수정 후에는 Playwright 검증을 우선 수행한다.
- Playwright에서 재현된 문제는 먼저 수정하고 다시 검증한다.
- 검증이 끝난 뒤에만 완료 브리핑 대상으로 본다.
