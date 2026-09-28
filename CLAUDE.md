# BusDriver — school bus management web app

> **응답 언어: 한국어.** J에게 하는 모든 답변은 한국어로 쓴다 (이 파일이 영어여도). 영어는 코드와 명령어 안에서만.

Mobile-first web app where bus drivers (age 50–80) and parents (age 50–70) manage students, payments, and fuel for school buses.
Shared rules are in the parent `../CLAUDE.md`.
Domain rules and data structures: `AGENTS.md`; review criteria: `REVIEW.md`; task list: `Todo.md`.
Progress log (Obsidian): `E:\Work\Brain\10_Projects\BusDriver\BusDriver MOC.md`

## Commands

```bash
npm run dev      # dev server (Next.js)
npm run build    # production build
npm run lint     # ESLint
npm run seed     # DB seed (requires .env.local)
```

## Architecture
- **Stack**: Next.js 14 App Router + Supabase Auth + Supabase DB
- **Directories**: `src/app/(app)/` — authenticated DRIVER screens, `src/app/(auth)/` — login
- **Auth**: Supabase Auth directly (NextAuth removed)
- **Triple permission guard**: middleware + server components + RLS

## Roles
| Role | Description |
|------|------|
| DRIVER | Core user (bus driver), full access |
| PARENT | Parent; can only view their children and file disputes |
| ADMIN | Service operator (Phase 2) |

- Determined by `profiles.role`, combined with `auth.uid()` + RLS

## UI/UX principles
- Mobile first; main users are elderly / not IT-savvy
- Text at least 18px, touch targets at least 48px
- Primary action buttons pinned to the bottom when possible
- Prefer cards/lists over tables

## CSS tokens (globals.css)
```css
--header-h: 56px; --bottom-nav-h: 64px; --ad-banner-h: 50px;
--control-height: 48px; --space-card: 12px;
/* .pb-nav-safe = bottom-nav-h + ad-banner-h + safe-area */
```

## Forbidden patterns
- Table cell text wrapping vertically — `whitespace-nowrap` required
- Content overlapping header/tab bar — `pt-[--header-h]` + `pb-nav-safe` required
- Card padding `p-4` or larger (rejected without a reason)

## Task management
- Every issue/feature/bug is added to `Todo.md` and marked when done
- After finishing: self-verify → `npm run build` → `git push`

## Agent workflow
- General feature: `project-lead → planner → architect → developer → qa-verifier`
- UI change: include `→ design-principal`
- DB/permissions: include `→ supabase-architect → reviewer-security`

# Extra working rules for this project

## Korean file header comments
**First line of every new source file: a one-line Korean comment stating its role.**
- TypeScript/JavaScript: `// 사용자 인증 상태를 관리하는 Context Provider`
- Python: `# KIS API 호출을 비동기로 래핑하는 클라이언트`
- SQL: `-- 일별 집계 결과를 저장하는 머티리얼라이즈드 뷰`
- Place it directly under required directives (`'use client'`, `'use server'`, shebang). Skip config files (`*.config.ts`, `package.json`, etc.).

Why: agents read files selectively. A one-line header lets the next session navigate without rereading whole files.

## Plan + checklist + context notes
**Before any non-trivial task, produce three artifacts; don't start coding without them.**
- **Plan** — what we're building and why.
- **Checklist** (`checklist.md`) — concrete tasks as checkboxes, ticked as you go.
- **Context notes** (`context-notes.md`) — decisions made during the work and their reasons, appended continuously.

If the user gives only a plan and asks you to start coding, ask: "체크리스트와 컨텍스트 노트를 먼저 만들까요?"

## Semantic commits
**Commit when one logical change is complete; don't wait to be asked.**
- Test: "Can I describe this commit in one sentence?" If not, split it.
- Good: "auth 미들웨어 추가". Bad: "auth 추가하고 UI도 고치고 버그도 수정" (split into 3).
- Don't accumulate unrelated edits; don't commit just to commit. For throwaway prototypes, group loosely. The point is reversibility.
