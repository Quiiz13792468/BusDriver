# Todo.md

이 파일은 프로젝트의 **단일 작업 관리 기준 문서**이다.

---

## 🔥 Critical

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

## 🧪 Verification Needed

- [ ] Supabase SQL 마이그레이션 실행 필요 (`supabase/migrations/20260413000000_init_busdriver_v2.sql`)
- [ ] consume_invite_token RPC 동작 검증 (가입 플로우 전체 테스트)
- [ ] RLS 정책 실제 동작 검증 (DRIVER/PARENT 역할 분리)
- [ ] 수수료 우선순위 확인: school.default_fee > student.custom_fee (CLAUDE.md 기준 적용됨 — 도메인 오너 재확인 권장)

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
