# BusDriver v2 — Greenfield 전면 재설계 계획

**Created:** 2026-04-12
**Scope:** 0 → 1 전면 재구축 (기존 코드/히스토리 전부 폐기 전제)
**Estimated complexity:** HIGH
**Mode:** Consensus (RALPLAN-DR)
**Phase 분리:** Phase 1 (핵심 기능) / Phase 2 (포인트 시스템)

---

## Context

BusDriver v1은 Next.js 14 + NextAuth + Supabase로 동작하지만 NextAuth가 RLS를 우회(SERVICE_ROLE), 결제 도메인 로직 불완전, 스키마-앱 전제 불일치(`users` vs `profiles`) 등 구조적 부채가 누적되어 전면 재설계를 결정했다. v2는 저장소 및 git 히스토리를 초기화한 뒤 Next.js 15 + Supabase Auth + RLS를 기본 전제로 처음부터 다시 구축한다.

**사용자 특성**
- 버스기사(ADMIN) 40~70대: 현재 종이 장부, 모바일 비숙련
- 학부모(PARENT) 40~70대: 초대 링크로만 가입

**핵심 설계 제약**
- 최소 글자 18px, 터치 48px, 화면당 주요 액션 1개, 3단계 이내 접근
- hover/숨김 UI 금지, 테이블 금지(카드/리스트 중심)
- 아이디 기반 로그인(내부적으로 `<id>@busdriver.app`으로 Supabase Auth에 저장)

---

## 1. RALPLAN-DR 요약

### Principles (핵심 원칙)
1. **Supabase-first**: Auth/DB/Realtime/Storage 모두 Supabase 단일 스택에 통합, RLS를 보안 경계로 삼는다.
2. **Role-safe by construction**: ADMIN/PARENT 분기는 라우트 그룹 + RLS + 서버 컴포넌트 세션 가드로 삼중 보호.
3. **Mobile-first simplicity**: 종이 장부 대체 수준의 단순함 — 3탭 이내, 1 화면 1 액션.
4. **Deposit-state as source of truth**: 입금 상태머신(미등록 → 등록 → 이의제기 → 해결)이 모든 홈/알림/납부내역 UI의 단일 출처.
5. **Phase-gated scope**: Phase 1에서 포인트 테이블만 껍데기로 두고 로직은 Phase 2로 격리, 범위 팽창 방지.

### Decision Drivers (상위 3개)
1. **RLS 정합성**: v1 실패 원인. Auth 선택이 RLS 집행 가능성을 결정 → Supabase Auth 확정.
2. **고령 사용자 UX 안전성**: 잘못된 상태 전환은 금전 분쟁 유발 → 상태머신을 DB 제약으로 강제.
3. **초대 링크 보안**: 학부모 가입 경로가 단일하므로 토큰 위조/재사용이 치명적 → 1회용 + 서버 검증 + 해시 저장.

### Viable Options

#### Option A — Next.js 15 App Router + Supabase SSR (@supabase/ssr) [권장]
**Pros**
- RSC/Server Actions로 서버 세션 + RLS를 자연스럽게 연결
- `@supabase/ssr` 쿠키 기반 세션으로 미들웨어 가드 단순
- Realtime 구독을 클라이언트 컴포넌트에만 격리 가능
- 배포 타깃 Vercel과 정합

**Cons**
- Server Actions 신규 학습 필요
- Next 15 + React 19 일부 라이브러리 호환성 확인 필요

#### Option B — Next.js 14 Pages Router + Supabase Auth Helpers
**Pros**
- 안정적이고 예제 많음
- 레거시 팀이 익숙

**Cons**
- RSC 장점 포기, 데이터 패칭 층이 두꺼워짐
- `@supabase/auth-helpers`는 deprecated 경로 진입, 유지보수 리스크

#### Option C — Next.js 15 + NextAuth + Supabase DB
**Pros**
- v1 코드 일부 재사용 가능

**Cons**
- v1 실패 원인 그대로 재현. RLS 집행 불가, SERVICE_ROLE 의존.
- **채택 불가** (명시적 기각)

**결정: Option A 채택.** Option C는 원천 원인을 재현하므로 기각, Option B는 deprecated 경로 및 RSC 포기로 장기 유지보수 비용이 Option A보다 크다.

---

## 2. Work Objectives

1. Next.js 15 + Supabase Auth + RLS 기반 기초 골격 구축 (인증/역할 가드/미들웨어)
2. 초대 링크 기반 학부모 가입 플로우 (1회용 토큰, 서버 검증, 해시 저장)
3. 학생/학교-사업장/기본요금/이용정지 도메인 CRUD
4. 입금 상태머신 + 이의제기 + 알림 파이프라인(Realtime)
5. 장부(매출 요약 + 주유 기록) + 게시판(공지/문의)
6. 모바일 우선 UI 시스템 (18px/48px/카드 기반)
7. Phase 2 포인트 시스템 테이블 스텁 포함 (로직은 Phase 2)

---

## 3. Guardrails

### Must Have
- 모든 DB 접근은 RLS 통과. SERVICE_ROLE은 서버 전용 마이그레이션/크론에서만.
- `profiles.role`을 권한의 단일 출처로 사용. auth.uid() 조인 필수.
- 학부모는 이용금액/이용정지일 수정 불가 (RLS + UI 이중 차단).
- 학생 목록 기본 쿼리는 `is_active = true`만 반환.
- 입금 상태 전환은 DB 함수/트리거로만 허용 (클라이언트 직접 update 금지).
- 초대 토큰은 SHA-256 해시로 저장, 평문은 링크 URL에만 존재.
- 모바일 숫자 입력은 `inputMode="numeric"` + `pattern` 강제.

### Must NOT Have
- 테이블 기반 UI, hover 기반 기능, 3단계 초과 네비게이션
- SERVICE_ROLE 키의 클라이언트 번들 노출
- 학부모 뷰에서의 전체 매출/타 학생 데이터 접근
- Phase 1에 포인트 비즈니스 로직 포함
- 학생 하드 삭제 (inactive 전환만 허용)

---

## 4. Supabase 스키마 설계

### 4.1 핵심 테이블

#### `profiles`
`id uuid PK (auth.users.id 참조), role text CHECK (role IN ('ADMIN','PARENT')), display_name text, phone text, created_at timestamptz`
- Supabase Auth 트리거로 auth.users 생성 시 자동 insert
- **RLS**: 본인 SELECT/UPDATE. ADMIN은 자신이 초대한 PARENT만 SELECT.

#### `schools`
`id uuid PK, admin_id uuid FK→profiles.id, name text, default_fee int NOT NULL, created_at, is_active bool default true`
- 학교/사업장(버스기사별 소속)
- **RLS**: ADMIN은 자기 것 전체 CRUD. PARENT는 자기 자녀가 소속된 학교만 SELECT(name만 노출).

#### `students`
`id uuid PK, school_id uuid FK, parent_id uuid FK→profiles.id, name text, grade text, monthly_fee int NULL, payment_day smallint CHECK (1..31), suspended_until date NULL, is_active bool default true, created_at`
- `monthly_fee` NULL → `schools.default_fee` 적용(앱 레이어 helper + DB view)
- **RLS**: ADMIN(해당 학교 소유자)만 CRUD. PARENT는 자기 `parent_id`인 행만 SELECT. PARENT UPDATE 금지(컬럼 단위 정책).

#### `payments`
`id uuid PK, student_id uuid FK, amount int NOT NULL, paid_at date NOT NULL, method text, note text NULL, created_by uuid FK→profiles.id, created_at, period_year smallint, period_month smallint`
- 누적 계산 기반. 월별 정산은 `period_year/period_month`로 집계.
- **RLS**: ADMIN 해당 학교만 CRUD. PARENT 자녀 SELECT만.

#### `payment_disputes` (입금 상태머신)
`id uuid PK, payment_id uuid FK NULL, student_id uuid FK, initiator_role text CHECK ('PARENT','ADMIN'), status text CHECK ('REQUESTED','CONFIRMED','DISPUTED','RESOLVED'), parent_note text, admin_note text, period_year smallint, period_month smallint, created_at, updated_at`
- 상태 전환은 SECURITY DEFINER 함수 `fn_dispute_transition(id, next_status, actor, note)`로만.
- **RLS**: 관련 학생의 ADMIN 또는 PARENT만 SELECT. 직접 UPDATE 금지.

#### `invite_tokens`
`id uuid PK, token_hash text UNIQUE, target_role text CHECK ('PARENT','ADMIN'), issued_by uuid FK→profiles.id, expires_at timestamptz, used_at timestamptz NULL, used_by uuid NULL, created_at`
- URL에는 `id + 평문토큰`, DB에는 해시. 서버 함수로 검증 + 사용 처리.
- **RLS**: 발급자만 본인 토큰 SELECT. 검증/소비는 `fn_consume_invite(token)` RPC(public execute).

#### `fuel_records` (주유 기록)
`id uuid PK, admin_id uuid FK, amount int, liters numeric(6,2) NULL, station text NULL, refueled_at date, note text, created_at`
- **RLS**: 본인만 CRUD.

#### `monthly_revenue_view` (VIEW, 장부 매출 요약)
`admin_id, period_year, period_month, total_amount, student_count` — payments 집계.
- SECURITY INVOKER, RLS 상속.

#### `board_notices` (공지)
`id uuid PK, admin_id uuid FK, title text, body text, created_at`
- **RLS**: ADMIN 본인 CRUD. PARENT는 자기 자녀가 속한 학교 ADMIN의 공지만 SELECT.

#### `board_inquiries` (1:1 문의)
`id uuid PK, parent_id uuid FK, admin_id uuid FK, subject text, created_at`
- 하위 `board_inquiry_messages(inquiry_id, author_id, body, created_at)`
- **RLS**: 해당 parent_id 또는 admin_id 당사자만 SELECT/INSERT.

#### `notifications`
`id uuid PK, user_id uuid FK→profiles.id, kind text, ref_table text, ref_id uuid, title text, body text, read_at timestamptz NULL, created_at`
- payments/disputes/board 변경 시 트리거로 자동 insert.
- **RLS**: 본인만 SELECT/UPDATE(read_at).

### 4.2 Phase 2 대비 테이블 (Phase 1에 스키마만)

#### `points_accounts`
`profile_id uuid PK FK→profiles.id, balance int default 0, updated_at`

#### `points_ledger`
`id uuid PK, profile_id uuid FK, delta int, reason text CHECK ('INVITE','ATTENDANCE','SUBSCRIPTION','ADJUSTMENT'), ref_id uuid NULL, created_at`

#### `subscription_billing`
`id uuid PK, admin_id uuid FK, period_year smallint, period_month smallint, amount int, paid_from_points int, status text, created_at`

- Phase 1에서는 테이블 생성 + 기본 RLS(본인 SELECT)만. 트리거/함수는 Phase 2.

### 4.3 RLS 정책 핵심 규칙
1. 모든 테이블 `ENABLE ROW LEVEL SECURITY`, 기본 DENY.
2. ADMIN 판별: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')`.
3. 학부모-학생 매칭: `students.parent_id = auth.uid()`.
4. 학교 소유 확인: `schools.admin_id = auth.uid()`.
5. 상태 전환 테이블(`payment_disputes`)은 UPDATE/INSERT를 RPC로 한정, 일반 정책은 SELECT만.
6. 컬럼 단위 제약: `students.monthly_fee`, `suspended_until`은 PARENT UPDATE 차단 (트리거 OR 별도 UPDATE 정책에서 컬럼 비교).

---

## 5. 파일/폴더 구조 (Next.js 15 App Router)

```
/
├─ app/
│  ├─ (public)/
│  │  ├─ login/page.tsx                 # 아이디/비번 로그인
│  │  └─ invite/[token]/page.tsx        # 초대 링크 진입 → 가입 폼
│  ├─ (admin)/
│  │  ├─ layout.tsx                     # ADMIN 가드 + 하단 네비
│  │  ├─ home/page.tsx                  # 오늘예정/미입금/미확인 탭
│  │  ├─ students/
│  │  │  ├─ page.tsx
│  │  │  └─ [id]/page.tsx               # 입금 이력 + 정보 수정
│  │  ├─ ledger/page.tsx                # 월별 매출 + 주유
│  │  ├─ board/
│  │  │  ├─ notices/page.tsx
│  │  │  └─ inquiries/page.tsx
│  │  ├─ settings/page.tsx              # 학교/사업장 관리
│  │  └─ invite/new/page.tsx            # 초대 링크 생성
│  ├─ (parent)/
│  │  ├─ layout.tsx                     # PARENT 가드 + 하단 네비
│  │  ├─ home/page.tsx                  # 상태별 UI
│  │  ├─ payments/page.tsx              # 납부내역
│  │  └─ board/
│  │     ├─ notices/page.tsx
│  │     └─ inquiries/page.tsx
│  ├─ api/
│  │  └─ invite/consume/route.ts        # 서버 전용 RPC 프록시
│  ├─ layout.tsx
│  └─ globals.css
├─ lib/
│  ├─ supabase/
│  │  ├─ server.ts                      # createServerClient (@supabase/ssr)
│  │  ├─ client.ts                      # createBrowserClient
│  │  └─ types.ts                       # generated Database 타입
│  ├─ auth/
│  │  ├─ session.ts                     # getSession / requireRole
│  │  └─ id-email.ts                    # id ↔ email 변환
│  ├─ domain/
│  │  ├─ payments.ts                    # 상태머신 헬퍼
│  │  ├─ fees.ts                        # default_fee 우선순위
│  │  └─ invite.ts                      # 토큰 생성/해시
│  └─ ui/
│     └─ bottom-nav.tsx
├─ components/
│  ├─ ui/                               # 버튼/카드/입력 (18/48 토큰)
│  ├─ admin/
│  ├─ parent/
│  └─ shared/
├─ middleware.ts                        # Supabase 세션 쿠키 리프레시 + 역할 가드
├─ supabase/
│  └─ migrations/
│     ├─ 0001_init.sql
│     ├─ 0002_rls.sql
│     ├─ 0003_dispute_fn.sql
│     └─ 0004_phase2_stubs.sql
└─ types/
   └─ database.ts
```

### 라우팅 설계
- `(public)` → 로그인/초대 수락만, 세션 있으면 역할별 홈으로 리디렉션
- `(admin)` 라우트 그룹 layout에서 `requireRole('ADMIN')` 서버 가드
- `(parent)` 동일 패턴
- `middleware.ts`는 세션 쿠키 리프레시 + 루트(`/`) 역할별 분기만 담당

---

## 6. Phase별 Task Flow

### Phase 1 — 핵심 기능

**Step 1: 프로젝트 초기화 + Supabase 기초 (1-2일 분량)**
- Next.js 15 프로젝트 bootstrap, Tailwind 설정, ESLint, tsconfig strict
- Supabase 프로젝트 연결, `@supabase/ssr` 통합, `lib/supabase/{server,client}.ts`
- 디자인 토큰(font-size 18px 기준, touch 48px) Tailwind theme 확장
- 하단 네비 2종(ADMIN/PARENT), 공통 헤더 컴포넌트
- **Acceptance**: `/login` 렌더링, 세션 쿠키 기반 리디렉션 동작, `npm run build` 성공

**Step 2: 인증 + 초대 링크 플로우**
- 마이그레이션 0001: `profiles`, `invite_tokens` 테이블 + auth.users 트리거
- `lib/auth/id-email.ts`: 아이디 → `<id>@busdriver.app` 변환
- 로그인 페이지(아이디/비번) + Server Action 로그인 처리
- `fn_consume_invite(token)` RPC + `/invite/[token]` 수락 페이지 + 가입 폼
- 초대 생성 UI(유효기간 24h/3d/7d/30d, 역할 선택) + 공유 링크
- 미들웨어 세션 리프레시 + 역할 라우트 가드
- **Acceptance**: 발급된 초대 링크로 PARENT 가입 가능, 동일 링크 재사용 시 에러, 만료된 토큰 거부, ADMIN이 PARENT 라우트 접근 시 리디렉션

**Step 3: 학생/학교 도메인 + RLS**
- 마이그레이션 0002: `schools`, `students`, RLS 정책 전체, 컬럼 제약(PARENT UPDATE 차단)
- 설정 페이지: 학교/사업장 CRUD + 기본요금
- 학생관리 페이지: 카드 목록, 학교별 필터, 학생 상세(입금 이력/정보 수정)
- 기본요금 우선순위 헬퍼 `resolveFee(student)` (학생.monthly_fee ?? school.default_fee)
- inactive 학생 기본 제외 쿼리
- **Acceptance**: ADMIN이 학생 CRUD 가능, PARENT가 자기 자녀만 조회 가능, PARENT가 monthly_fee PATCH 시 RLS 거부(테스트), inactive 필터 기본 적용

**Step 4: 입금 + 상태머신 + Realtime 알림**
- 마이그레이션 0003: `payments`, `payment_disputes`, `fn_dispute_transition`, `notifications` + 트리거
- 바텀시트 `[➕]`: 입금등록/주유등록
- ADMIN 홈 3탭: 오늘예정/미입금(D+N)/미확인(요청+이의제기)
- PARENT 홈 상태별 UI (3상태) + `[입금확인요청]` / `[이의제기]`
- Supabase Realtime 구독(클라이언트): `notifications` insert → 토스트 + 뱃지
- 알림 전송(개별/전체) 서버 액션
- **Acceptance**: 입금등록 → PARENT 홈 상태 변화 확인, 이의제기 → ADMIN 미확인 탭 노출, 상태 전환 클라이언트 직접 UPDATE 차단 테스트, 알림 Realtime 수신 E2E 통과

**Step 5: 장부 + 게시판 + 주유**
- 마이그레이션 0002에 `fuel_records`, `board_notices`, `board_inquiries(+messages)` 추가
- 장부 페이지: `monthly_revenue_view` 기반 월별 카드 + 주유 기록 목록
- 주유 기록 추가 플로우
- 게시판(공지): ADMIN 작성, PARENT 조회
- 게시판(문의): PARENT 작성 → ADMIN 답변 스레드
- **Acceptance**: 장부 매출 금액 payments 합과 일치, 주유 CRUD 본인만, PARENT가 타 학교 공지 조회 시 RLS 거부, 문의 스레드 양방향 동작

**Step 6: UI/UX 마감 + QA + Phase 2 스텁**
- 마이그레이션 0004: `points_*`, `subscription_billing` 스키마만 + 기본 RLS
- 모든 입력 `inputMode="numeric"` 점검, 18px/48px 준수 감사
- 3단계 네비게이션 감사, 카드 기반 구조 점검
- Playwright E2E: 초대/로그인/입금/이의제기/게시판 핵심 시나리오
- reviewer-security, reviewer-ux 라운드 반영
- **Acceptance**: 핵심 시나리오 E2E 전부 그린, Lighthouse 모바일 접근성 90+, Phase 2 테이블 존재 확인 쿼리 통과

### Phase 2 — 포인트 시스템 (별도 계획 예정)
- 초대/출석체크 포인트 적립 트리거
- 구독료 자동 차감 파이프라인
- 관리자/학부모 포인트 내역 화면
- **본 계획에서는 스키마 스텁만 포함**

---

## 7. 기술적 리스크 및 대응

| # | 리스크 | 영향 | 대응 |
|---|---|---|---|
| 1 | 아이디 기반 로그인 + Supabase Auth 결합(Supabase는 email/phone 전제) | 로그인 실패/중복 | `<id>@busdriver.app` 고정 도메인 변환 + 중복 사전검사 RPC, 도메인 예약 |
| 2 | RLS 누락으로 데이터 노출 | 치명적 보안 사고 | 모든 테이블 RLS ENABLE을 마이그레이션 기본 템플릿에 포함, `pgtap` 또는 수동 RLS 테스트 스크립트 필수 |
| 3 | 상태머신 우회 (클라이언트가 payments/disputes 직접 UPDATE) | 분쟁/정합성 붕괴 | UPDATE 정책 자체를 거부, 오직 `fn_dispute_transition` RPC만 허용 |
| 4 | 초대 토큰 재사용/위조 | 미인가 가입 | 해시 저장, 1회용(used_at), 만료, RPC 내부 트랜잭션 |
| 5 | 고령 사용자 실수 조작 | 지원 부담 | 확인 모달 일관화, 큰 버튼, 되돌리기 토스트 |
| 6 | Next 15 + React 19 호환성 | 빌드/배포 차질 | 초기 1주 내 핵심 의존성 smoke, 문제 라이브러리는 교체 |
| 7 | Realtime 구독 누수 | 성능 저하 | 클라이언트 컴포넌트 마운트 시 구독, 언마운트 해제, 역할별 채널 분리 |
| 8 | `monthly_fee` NULL 해석 불일치 | 금액 오표시 | DB view에서 `COALESCE(monthly_fee, default_fee)` 계산, 클라이언트에서 재계산 금지 |
| 9 | 기존 저장소 히스토리 폐기 복구 불가 | 롤백 불능 | 삭제 전 별도 아카이브 브랜치 태깅(`archive/v1-final`) 권장 |
| 10 | Phase 2 테이블이 Phase 1 스코프 팽창 | 일정 지연 | Phase 2 테이블은 INSERT/UPDATE 트리거 없이 스텁만, 앱 코드 참조 금지 |

---

## 8. Success Criteria (Phase 1 수용 기준)

- [ ] `npm run build` + `npm run test:e2e` 모두 그린
- [ ] Supabase Auth 기반 로그인/로그아웃 동작, NextAuth 의존 0
- [ ] ADMIN/PARENT 역할 가드가 미들웨어 + 서버 컴포넌트 + RLS 삼중으로 적용됨을 테스트로 증명
- [ ] 초대 링크: 1회용, 만료, 해시 저장 3가지 모두 E2E로 검증
- [ ] 학생 목록 기본 쿼리에서 inactive 제외 확인 (SQL 로그 또는 단위 테스트)
- [ ] 입금 상태머신 4상태 전환이 RPC 경로로만 동작, 직접 UPDATE는 RLS로 거부됨을 테스트로 증명
- [ ] PARENT 뷰에서 `monthly_fee` / `suspended_until` UPDATE 시도 거부 테스트 통과
- [ ] 기본요금 우선순위(`monthly_fee ?? default_fee`) 단위 테스트 통과
- [ ] 모든 페이지 본문 글자 18px 이상, 인터랙티브 요소 48px 이상 (audit 리포트)
- [ ] 주요 기능 3단계 이내 접근 감사 통과
- [ ] Realtime 알림 수신 E2E 통과 (입금등록 → 학부모 토스트)
- [ ] Phase 2 테이블 4종 존재 + 기본 RLS enabled 쿼리 통과
- [ ] `archive/v1-final` 태그 존재 (히스토리 보존)

---

## 9. ADR (Architecture Decision Record)

**Decision**: Next.js 15 App Router + @supabase/ssr + Supabase Auth + RLS 기반 greenfield 재구축.

**Drivers**:
1. RLS 집행 가능성 (v1의 핵심 실패 원인 제거)
2. 고령 사용자 UX 안전성 (상태머신 DB 강제)
3. 초대 링크 보안

**Alternatives considered**:
- Next 14 Pages Router + auth-helpers: deprecated 경로, RSC 이점 포기
- Next 15 + NextAuth: v1 실패 원인 재현, 기각
- Remix/SvelteKit: 팀 학습 비용, 배포/Vercel 통합성 열세

**Why chosen**: Option A는 Supabase 세션 SSR 쿠키 통합이 가장 자연스럽고, Server Actions로 상태머신 RPC 호출을 서버 경계에 가둘 수 있어 클라이언트 우회 공격 표면을 최소화한다. Vercel 배포와도 정합.

**Consequences**:
- Next 15 + React 19 신규 스택 학습 필요
- `@supabase/ssr` 쿠키 경계 이해 필수
- 기존 v1 코드 재사용 불가(의도된 비용)

**Follow-ups**:
- Phase 2 포인트 시스템 세부 계획(별도 /plan 세션)
- pgtap 기반 RLS 테스트 도입 검토
- 카카오 알림톡 연동 여부 결정(현재 앱 내 알림만 전제)

---

## 10. Open Questions (미결정 사항 → open-questions.md에 반영)

1. 버스기사 가입이 초대 링크 외에도 관리자 승인 방식으로 열려야 하는가? — 초기 운영 진입장벽과 보안 사이 균형 결정 필요
2. 알림을 앱 내 Realtime만으로 충분한가, 카카오 알림톡/SMS까지 필요한가? — Phase 1 범위 영향
3. 이의제기 해결까지의 기간 제한(자동 만료)이 필요한가? — 분쟁 장기화 방지
4. 주유 기록에 사진 첨부가 필요한가? — Supabase Storage 도입 여부 결정
5. 초대 링크 공유 방식(카카오톡 공유 버튼 등) 기본 지원 범위 — Phase 1 포함 여부
6. 학부모 1인이 여러 자녀를 가진 경우 홈 UI의 카드 배치 기준 — 상태별 정렬 vs 자녀별 정렬
7. 아이디 정책(길이/허용문자/대소문자)과 변경 가능 여부
8. 기존 운영 데이터 마이그레이션이 필요한가, 완전 0부터 시작인가? — "전부 삭제" 전제 재확인 필요

---
