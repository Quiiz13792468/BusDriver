# AGENTS.md

## 프로젝트 개요
이 프로젝트는 통학버스 관리 시스템이다.

주 사용자:
- 관리자: 버스 기사 (50~80대)
- 일반 사용자: 학부모 (50~70대)

핵심 목표:
- 최소 클릭으로 사용 가능
- 모바일/태블릿 환경에서도 쉽게 사용
- IT에 익숙하지 않은 사용자도 사용 가능

## 기술 스택
- Framework: Next.js (App Router)
- Language: TypeScript
- UI: shadcn/ui + Tailwind + SweetAlert2
- Backend: Supabase (Auth + DB + Storage)

## 문서 역할 분리
- 공통 작업 규칙은 `CLAUDE.md`
- 코드리뷰 규칙은 `REVIEW.md`
- 작업 관리 기준은 `Todo.md`
- 역할별 에이전트는 `.claude/agents/` 하위 subagent 사용

## 서브에이전트 운영 개요

### 총괄 / 실행
- `project-lead`
  - 전체 요청 해석, 에이전트 조율, 최종 한국어 브리핑
- `planner`
  - 범위 분석, 단계별 계획 수립
- `architect`
  - 구조 설계, 화면/데이터 흐름 설계
- `developer`
  - 실제 코드 구현, CamelCase 규칙 준수
- `supabase-architect`
  - Supabase 스키마, RLS, 권한, 정책 정합성 검토
- `qa-verifier`
  - 요구사항 충족 여부, 회귀, 누락, 권한, UX 검증

### 디자인 / UX
- `design-principal`
  - Impeccable 기반 디자인 방향 수립 및 시각/UX 총괄
- `reviewer-ux`
  - 모바일 및 고령 사용자 기준 UX 검토

### 리뷰
- `reviewer-general`
  - 기능 정확성, 회귀 위험, 도메인 로직 검토
- `reviewer-security`
  - 인증, 권한, RLS, 데이터 노출 검토

## 핵심 도메인 규칙

### 입금 처리
- 기본 이용금액 우선순위:
  1. 학교별 고정금액
  2. 학생별 고정값
- 입금 유형:
  - 일반입금: 이용금액 전체
  - 부분입금: 일부 금액
- 부족금액 = 이용금액 - 총 입금액
- 입금은 누적 계산된다

### 이용 정지
- 이용 정지일이 설정된 학생은 모든 조회 리스트에서 제외
- 삭제하지 않고 inactive 상태로 유지

## 데이터 설계 가이드

### 인증/사용자
- `auth.users`
  - Supabase Auth 기본 사용자 테이블
- `profiles`
  - 앱 전용 사용자 프로필
  - role: ADMIN | PARENT
  - auth.users와 1:1 연결

### 학교/노선
- `schools`
  - 학교 정보
  - 기본 월 이용금액(default_monthly_fee) 관리
  - 담당 관리자(admin_user_id) 연결 가능
- `routes`
  - 학교별 노선
- `route_stops`
  - 노선별 정차 지점
  - 순서(position), 좌표(lat/lng), 설명 관리

### 학생/학부모
- `students`
  - 핵심 학생 정보
  - 학교, 학부모 계정, 노선 연결
  - 이용금액(fee_amount), 입금일(deposit_day), 이용정지(suspended_at), 활성여부(is_active) 관리
  - school_id는 NULL 허용 (미배정 학생 지원)
- `parent_profiles`
  - 학부모 부가 정보
  - 주소, 담당 관리자 정보 관리

### 입금/알림
- `payments`
  - 학생별 월 납부 데이터
  - 대상 연/월(target_year, target_month), 금액, 상태(PAID | PARTIAL | UNPAID), 납부일 관리
- `alerts`
  - 관리자 알림/처리 대상
  - 유형(PAYMENT | INQUIRY | ROUTE_CHANGE), 상태(PENDING | RESOLVED) 관리

### 게시판
- `board_posts`
  - 게시글
  - 학교 대상, 특정 학부모 대상, 부모 전용 여부(parent_only), 잠금 여부(locked) 관리
- `board_comments`
  - 댓글 / 대댓글
- `board_notifications`
  - 게시판 알림
  - 사용자별 읽음 여부 관리

### 초대/감사 로그
- `invite_tokens`
  - 학부모 초대 토큰
  - 사용 여부, 만료일 관리
- `auth_login_audit`
  - 로그인 감사 로그
  - 성공 여부, 사유, 사용자, 발생 시각 기록