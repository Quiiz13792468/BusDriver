# Todo.md

이 파일은 프로젝트의 **단일 작업 관리 기준 문서**이다.

---

## 🔥 Critical

- [x] loginAction의 NEXT_REDIRECT 예외를 catch 블록이 삼켜 대시보드 이동 불가 — LoginForm/InviteForm에서 router.push로 전환

## 🔒 Security

## 🧠 Backlog

- [ ] 로그인 화면 실제 구현 (역할 선택 탭, 아이디/비밀번호 폼, 저장 체크박스)
- [ ] 초대 링크 가입 화면 구현 (`/invite/[token]`)
- [ ] DRIVER 헤더 입금/주유 등록 글로벌 액션 모달 구현
- [ ] 학생관리: 학생 목록 (실제 데이터 연동, 학교 필터)
- [ ] 학생관리: 학생 등록/편집 폼
- [ ] 학생관리: 학생 상세 + 월별 입금 내역
- [ ] 장부: 입금 내역 실제 데이터 연동
- [ ] 장부: 주유 내역 실제 데이터 연동
- [ ] 게시판: 공지 목록/작성
- [ ] 게시판: 1:1 채팅 (iMessage 스타일, 답장 기능)
- [ ] PARENT 홈: 자녀 카드 스와이프
- [ ] PARENT 납부내역: 연도별 테이블 + 셀 클릭 팝업 (수정요청/확정 버튼)
- [ ] 설정: 프로필 수정, 비밀번호 변경, 학교 관리, 초대 링크 생성
- [ ] 알림 시스템 구현 (notifications 테이블 연동)
- [ ] PWA 설정 (manifest.json, service worker)
- [ ] 광고: Google AdSense 모바일 하단 배너 + 데스크톱 사이드바

## 🧪 Verification Needed (Stage F)

- [x] [+학교] 버튼을 schools/page.tsx에서 제거하고 settings/schools/page.tsx 상단으로 이동
- [x] 게시판·장부 필터 chip 영역 justify-start 정렬 변경
- [x] schools/page.tsx 하단 문구 "총 n명의 활성 학생" → "총 n명의 학생 이용 중"
- [x] DriverDashboard.tsx "{month}월 확정 입금" → "{month}월 입금 확정" + aria-label 조정
- [x] DriverHeader.tsx 좌측 버스 아이콘 크기 36px(style fontSize:36) 적용
- [x] DriverNav.tsx 탭 레이블 span font-size text-[18px] 적용

## 🧪 Verification Needed

- [ ] Supabase SQL 마이그레이션 실행 필요 (`supabase/migrations/20260413000000_init_busdriver_v2.sql`)
- [ ] Supabase SQL 마이그레이션 실행 필요 (`supabase/migrations/20260419000000_add_fuel_type_invite_role_payment_memos.sql`)
- [ ] consume_invite_token RPC 동작 검증 (가입 플로우 전체 테스트)
- [ ] RLS 정책 실제 동작 검증 (DRIVER/PARENT 역할 분리)
- [ ] payment_memos RLS 실제 동작 검증 (DRIVER/PARENT 역할 기준)
- [ ] getPaymentDetailAction의 profiles FK 별칭(`payments_created_by_fkey`) 실제 스키마와 일치 여부 확인
- [ ] 수수료 우선순위 확인: custom_fee → default_fee 순서 (3개 파일 수정 완료 — 실제 동작 재확인 권장)

## 📦 완료된 작업

- [x] 에이전트 frontmatter 정상화 (10개 에이전트 파일)
- [x] AGENTS.md v2 전면 재작성 (3역할, 메뉴구조, 입금프로세스, 데이터설계)
- [x] CLAUDE.md v2 구현 금지 패턴 + CSS 변수 토큰 추가
- [x] design-principal 에이전트 v2 디자인 시스템 추가
- [x] Todo.md 초기화
- [x] Next.js 15 프로젝트 초기화 (package.json name: busdriver)
- [x] 핵심 패키지 설치 (@supabase/ssr, resend, shadcn)
- [x] Supabase 클라이언트 3종 설정 (browser/server/admin)
- [x] proxy.ts 인증 미들웨어 (Next.js 16 proxy 규칙 준수)
- [x] .env.example 생성
- [x] DB 스키마 설계 및 SQL 마이그레이션 파일 생성
  - profiles, schools, students, student_parents, invite_tokens
  - payments, payment_events, fuel_records
  - board_posts, board_messages, notifications, auth_login_audit
  - RLS 정책 전체, SECURITY DEFINER 헬퍼 함수, consume_invite_token RPC
- [x] 프로젝트 폴더 구조 설계 및 기본 파일 생성
  - (auth): login, invite/[token]
  - (app): dashboard, schools, schools/[studentId], payments, board, settings
  - components/driver, components/parent
  - lib/actions/auth.ts, lib/queries/students.ts, lib/queries/payments.ts, lib/queries/notifications.ts
  - types/database.ts
- [x] globals.css CSS 변수 토큰 적용
- [x] 빌드 검증 통과 (Next.js 16, TypeScript, 11개 라우트)
- [x] Stage A: 게시판 필터 버튼 중앙 정렬 (#5)
- [x] Stage A: 미납 알림 카운트 항상 표시 (#6)
- [x] Stage A: 입금확인 요청 카운트 항상 표시 (#7)
- [x] Stage B: fuel_records에 fuel_type/price_per_liter 컬럼 추가 마이그레이션
- [x] Stage B: invite_tokens에 target_role 컬럼 추가 마이그레이션
- [x] Stage B: payment_memos 테이블 생성 + RLS 마이그레이션
- [x] Stage C: 수수료 우선순위 수정 (custom_fee → default_fee 순서, 3개 파일)
- [x] Stage C: 주유 모달 유종(휘발유/경유) 선택 + 리터당 가격 입력 추가 (#1)
- [x] Stage C: 설정 페이지 학교 관리 링크 + /settings/schools 페이지 구현 (#2)
- [x] Stage C: 초대 링크 역할 선택(학부모/버스기사) 기능 추가 (#4)
- [x] Stage D: 홈 학교별×월별 입금 매트릭스 구현 (sticky 컬럼, 셀 클릭 등록) (#8)
- [x] Stage E: CONFIRMED 셀 클릭 입금 상세 모달 (2열 레이아웃, 메모, 확정취소, 수정모드) (#9)
- [x] Stage E: 장부 페이지 입금 내역 행 클릭 동일 상세 모달 연동 (#9c)
- [x] 빌드 검증 통과 (Stage A~E 전체, TypeScript, 14개 라우트)
