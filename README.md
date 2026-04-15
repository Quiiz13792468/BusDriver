# BusDriver

통학버스 관리 시스템 프로젝트입니다.

주 사용자:
- 관리자: 버스 기사 (50~80대)
- 일반 사용자: 학부모 (50~70대)

핵심 목표:
- 최소 클릭으로 사용 가능
- 모바일/태블릿 환경에서도 쉽게 사용
- IT에 익숙하지 않은 사용자도 사용 가능

---

## 기술 스택

- Framework: Next.js (App Router)
- Language: TypeScript
- UI: shadcn/ui + Tailwind + SweetAlert2
- Backend: Supabase (Auth + DB + Storage)

---

## 프로젝트 핵심 원칙

- 모바일 우선
- 큰 글자와 큰 터치 영역
- 한 화면에 하나의 주요 액션 우선
- 숨겨진 기능(hover 기반 등) 지양
- 관리자/학부모 역할 분리 명확화
- 도메인 규칙과 권한 정책 우선
- 불필요한 리팩터링보다 안정적인 개선 우선

## 핵심 운영 구조

 - 이 프로젝트는 "AI + Todo 기반 개발 시스템"으로 운영된다.
 - 모든 작업은 Todo.md를 중심으로 계획, 구현, 검증, 리뷰가 연결된다.

---

## 문서 구조

- `README.md`
  - 프로젝트 개요와 운영 구조 설명

- `AGENTS.md`
  - 프로젝트 도메인 규칙, 데이터 구조, 에이전트 운영 개요

- `CLAUDE.md`
  - Claude Code 작업 원칙, 서브에이전트 호출 기준, Todo 기반 운영 규칙

- `REVIEW.md`
  - 코드리뷰 기준과 출력 포맷

- `Todo.md`
  - 요청사항, 버그, 리뷰 이슈, 기능 개선, 보안 체크, 오류 이력을 관리하는 단일 작업 관리 문서

- `.claude/agents/`
  - 역할별 서브에이전트 정의

---

## 작업 관리
이 프로젝트는 `Todo.md`를 기준으로 작업을 관리하며, 이슈는 Critical / Backlog / Security / Verification Needed로 분류한다.

다음 항목이 발생하면 반드시 `Todo.md`에 반영합니다:
- 새로운 기능 요청
- 코드 리뷰 이슈
- 버그
- 성능 문제
- 보안 점검 항목
- 오류 및 해결 이력

완료된 항목은 `[x]`로 표시합니다.

---

## 서브에이전트 구성

### 총괄 / 실행
- `project-lead`
  - 전체 작업 총괄, 서브에이전트 지휘, 한국어 브리핑 담당
- `planner`
  - 요구사항 분석, 범위/영향도/단계별 계획 수립
- `architect`
  - 구조 설계, 책임 분리, 데이터 흐름/화면 흐름 설계
- `developer`
  - 실제 구현 담당, CamelCase 규칙 준수
- `supabase-architect`
  - Supabase 스키마, RLS, 권한, 마이그레이션 검토
- `qa-verifier`
  - 구현 결과 검증, 누락/회귀/권한/UX 체크

### 디자인 / UX
- `design-principal`
  - Impeccable 기반 수석 디자이너, 시각 언어와 UX 흐름 총괄
- `reviewer-ux`
  - 모바일/고령 사용자 기준 UX 검토

### 리뷰
- `reviewer-general`
  - 기능 정확성, 회귀 위험, 도메인 로직 검토
- `reviewer-security`
  - 인증, 권한, RLS, 데이터 노출 검토

---

## 권장 작업 흐름

일반 기능 수정:
`project-lead → planner → architect → developer → qa-verifier → reviewer-general`

UI/UX 개선:
`project-lead → planner → design-principal → architect → developer → qa-verifier → reviewer-ux`

Supabase/권한 변경:
`project-lead → planner → supabase-architect → developer → qa-verifier → reviewer-security`

복합 작업:
`project-lead`가 필요한 에이전트를 조합하여 진행

---

## 도메인 핵심 규칙

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

---

## 개발 진행 원칙

- 큰 작업은 계획부터 시작한다
- 진행 중 발견된 이슈는 `Todo.md`에 즉시 반영한다
- 작업이 길어져 품질 저하 위험이 생기면 무리하게 진행하지 않는다
- 이 경우 현재 진행 상황, 완료 항목, 남은 작업, 리스크를 한국어로 브리핑한다