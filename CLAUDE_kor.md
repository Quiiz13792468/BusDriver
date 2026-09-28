# BusDriver — 통학버스 관리 웹앱

> 이 파일은 `CLAUDE.md`(영어)의 한국어 번역본이다. J 확인용이며 Claude는 자동으로 읽지 않는다. 내용이 다르면 `CLAUDE.md`가 기준이다.

버스 기사(50~80대)와 학부모(50~70대)가 통학버스 원생, 입금, 주유를 관리하는 모바일 우선 웹앱.
공통 원칙은 상위 `../CLAUDE.md`.
도메인 규칙과 데이터 구조는 `AGENTS.md`, 리뷰 기준은 `REVIEW.md`, 작업 목록은 `Todo.md`.
진행 기록(Obsidian): `E:\Work\Brain\10_Projects\BusDriver\BusDriver MOC.md`

## 명령어

```bash
npm run dev      # 개발 서버 (Next.js)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run seed     # DB 시드 (.env.local 필요)
```

## 아키텍처
- **스택**: Next.js 14 App Router + Supabase Auth + Supabase DB
- **디렉터리**: `src/app/(app)/` — 인증된 DRIVER 화면, `src/app/(auth)/` — 로그인
- **인증**: Supabase Auth 직접 사용 (NextAuth 제거됨)
- **권한 삼중 가드**: 미들웨어 + 서버 컴포넌트 + RLS

## 역할 구조
| 역할 | 설명 |
|------|------|
| DRIVER | 핵심 사용자 (버스기사), 전체 기능 접근 |
| PARENT | 학부모, 자녀 조회와 이의제기만 가능 |
| ADMIN | 서비스 운영자 (Phase 2) |

- `profiles.role` 기준 판별, `auth.uid()` + RLS 조합

## UI/UX 원칙
- 모바일 우선, 주 사용자는 고령층 / IT 비숙련자
- 글자 최소 18px, 터치 영역 최소 48px
- 주요 액션 버튼은 가능하면 하단 고정
- 테이블보다 카드/리스트 구조 우선

## CSS 토큰 (globals.css)
```css
--header-h: 56px; --bottom-nav-h: 64px; --ad-banner-h: 50px;
--control-height: 48px; --space-card: 12px;
/* .pb-nav-safe = bottom-nav-h + ad-banner-h + safe-area */
```

## 금지 패턴
- 테이블 셀 텍스트 세로 줄바꿈 — `whitespace-nowrap` 필수
- 헤더, 탭바와 콘텐츠 겹침 — `pt-[--header-h]` + `pb-nav-safe` 필수
- 카드 내부 `p-4` 이상 (사유 없으면 반려)

## 작업 관리
- 모든 이슈/기능/버그는 `Todo.md`에 추가하고 완료 표시
- 완료 후 순서: 자체검증 → `npm run build` → `git push`

## 에이전트 워크플로우
- 일반 기능: `project-lead → planner → architect → developer → qa-verifier`
- UI 변경: `→ design-principal` 포함
- DB/권한: `→ supabase-architect → reviewer-security` 포함

# 이 프로젝트의 추가 작업 규칙

## 한국어 파일 머리 주석
**새 소스 파일의 첫 줄에는 역할을 설명하는 한국어 한 줄 주석을 단다.**
- TypeScript/JavaScript: `// 사용자 인증 상태를 관리하는 Context Provider`
- Python: `# KIS API 호출을 비동기로 래핑하는 클라이언트`
- SQL: `-- 일별 집계 결과를 저장하는 머티리얼라이즈드 뷰`
- 필수 지시문(`'use client'`, `'use server'`, shebang) 바로 아래에 둔다. 설정 파일(`*.config.ts`, `package.json` 등)은 제외.

이유: 에이전트는 파일을 골라 읽는다. 한 줄 머리 주석이 있으면 다음 세션이 파일 전체를 다시 읽지 않고도 길을 찾는다.

## 계획 + 체크리스트 + 컨텍스트 노트
**사소하지 않은 작업은 시작 전에 세 가지를 만든다. 없으면 코딩을 시작하지 않는다.**
- **계획** — 무엇을 왜 만드는지.
- **체크리스트** (`checklist.md`) — 구체적인 작업을 체크박스로. 진행하며 체크.
- **컨텍스트 노트** (`context-notes.md`) — 작업 중 내린 결정과 이유. 계속 덧붙인다.

사용자가 계획만 주고 코딩을 시작하라고 하면 "체크리스트와 컨텍스트 노트를 먼저 만들까요?"라고 묻는다.

## 의미 단위 커밋
**논리적 변경 하나가 끝나면 커밋한다. 요청을 기다리지 않는다.**
- 기준: "이 커밋을 한 문장으로 설명할 수 있나?" 아니면 나눈다.
- 좋은 예: "auth 미들웨어 추가". 나쁜 예: "auth 추가하고 UI도 고치고 버그도 수정" (3개로 나눌 것).
- 관계없는 수정을 쌓아 두지 않고, 커밋을 위한 커밋도 하지 않는다. 버릴 시제품은 느슨하게 묶어도 된다. 핵심은 되돌릴 수 있는 것.
