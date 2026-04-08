# DESIGN.md

## Purpose

셔틀콕 앱의 디자인 시스템, 화면 구조, 고령자 UX 기준을 정의한다.
design-principal, reviewer-ux, developer가 공통 기준으로 참조한다.

---

## Design Philosophy

Apple Design 레퍼런스를 기반으로 한국어 앱(고령자 우선, 모바일 우선, 라이트 모드 고정)에 맞게 적용한다.

- **명료함 우선**: 정보 위계를 색상 계층으로 표현. 장식 요소 최소화.
- **라이트 모드 고정**: 다크 모드 미지원. 흰색/연한 회색 배경 교차로 섹션 구분.
- **반투명 글라스**: 상단 헤더, 하단 탭바는 `backdrop-filter: blur` + 반투명 배경으로 콘텐츠 맥락 유지.
- **브랜드 액센트**: `#0D9488` (teal) — 인터랙티브 요소(버튼, 링크, 포커스 링) 전용.
- **elevation**: 카드에 border 없음, background 계층 차이와 shadow로 깊이 표현.

---

## Color Palette (라이트 모드)

### 배경 계층

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|----|------|
| Page background | `--page-bg` | `#f5f5f7` | 전체 페이지 배경 |
| Surface | `--surface` | `#ffffff` | 카드, 모달, 패널 |
| Surface raised | `--surface-raised` | `#f0f0f2` | 입력 필드, 배지, 툴팁 |
| Surface high | `--surface-high` | `#e8e8ea` | 호버 상태, 눌린 상태 |

### 테두리

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|----|------|
| Border | `--border` | `rgba(0,0,0,0.08)` | 컨테이너 구분선 |
| Border line | `--border-line` | `rgba(0,0,0,0.14)` | 입력 필드 테두리 |

### 텍스트

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|----|------|
| Primary ink | `--ink` | `#1d1d1f` | 주요 텍스트 |
| Muted | `--muted` | `rgba(0,0,0,0.56)` | 보조 텍스트, 레이블 |
| Faint | `--faint` | `rgba(0,0,0,0.36)` | 힌트, 플레이스홀더 |

### 브랜드 액센트 (teal)

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|----|------|
| Accent | `--accent` | `#0d9488` | 버튼, 링크, 활성 탭 |
| Accent dark | `--accent-dark` | `#0f766e` | 버튼 hover, 지도 마커 |
| Accent light | `--accent-light` | `#ccfbf1` | 활성 pill 배경, tint |

### 상태 색상

| 상태 | 텍스트 색상 | 배경 색상 |
|------|------------|----------|
| 완납 | `green-600` | `green-50` |
| 부분입금 | `amber-600` | `amber-50` |
| 미입금 | `red-600` | `red-50` |

---

## Tailwind 토큰 (sp.*)

`tailwind.config.ts`의 `sp.*` 네임스페이스는 CSS 변수와 대응된다.

| Tailwind 클래스 | 값 |
|----------------|----|
| `bg-sp-bg` | `#f5f5f7` |
| `bg-sp-surface` | `#ffffff` |
| `bg-sp-raised` | `#f0f0f2` |
| `bg-sp-high` | `#e8e8ea` |
| `border-sp-border` | `rgba(0,0,0,0.08)` |
| `border-sp-line` | `rgba(0,0,0,0.14)` |
| `text-sp-text` | `#1d1d1f` |
| `text-sp-muted` | `rgba(0,0,0,0.56)` |
| `text-sp-faint` | `rgba(0,0,0,0.36)` |
| `text-sp-green` | `#0d9488` (teal 브랜드) |

---

## Shadow

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|----|------|
| Card shadow | `--shadow-card` | `rgba(0,0,0,0.08) 0px 2px 16px 0px` | 카드, 패널 |
| Nav shadow | `--shadow-nav` | `rgba(0,0,0,0.06) 0px 1px 0px` | 헤더/탭바 하단 구분 |

---

## Border Radius

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|----|------|
| Card | `--radius-card` | `16px` | 카드, 모달, 패널 |
| Control / Button | `--radius-control` | `500px` (pill) | 버튼, 검색 입력 |
| Soft | `--radius-soft` | `10px` | 입력 필드, 배지 |

---

## Spacing

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|----|------|
| Card padding | `--space-card-pad` | `clamp(14px, 1.6vw, 20px)` | 카드 내부 패딩 |
| Card compact | `--space-card-compact` | `clamp(10px, 1.2vw, 14px)` | 컴팩트 카드 패딩 |
| Grid gap | — | `12px` | 카드 그리드 간격 |

---

## Layout Tokens

| 토큰 | CSS 변수 | 값 | 용도 |
|------|----------|----|------|
| Header height | `--header-h` | `56px` | 모바일 상단 헤더 고정 높이 |
| Bottom nav height | `--bottom-nav-h` | `64px` | 모바일 하단 탭바 고정 높이 |
| Control height | `--control-height` | `48px` | 버튼, 입력 필드 최소 높이 |

### Safe area 유틸리티

```css
.pb-nav-safe {
  padding-bottom: calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px));
}
```

모바일 본문 하단 패딩에 사용. 고정 `pb-24` 대신 이 클래스를 사용해야 한다.

---

## Component Styles

### Card

- `background: var(--surface)` — 흰색
- border 없음 (elevation은 shadow로만)
- `box-shadow: var(--shadow-card)`
- `border-radius: var(--radius-card)` (16px)

### Button (primary)

- `background: var(--accent)` — teal
- `color: #ffffff`
- `border-radius: var(--radius-control)` — pill
- `min-height: var(--control-height)` — 48px
- hover: `var(--accent-dark)`

### Button (outline)

- `border: 1.5px solid var(--accent)` — teal 테두리
- `color: var(--accent)`
- `background: transparent`
- hover: `rgba(13,148,136,0.06)` 배경

### Input / Select

- `background: var(--surface-raised)`
- `border: 1px solid var(--border-line)`
- `border-radius: var(--radius-soft)` (10px)
- `min-height: var(--control-height)` (48px)
- focus: `border-color: var(--accent)`, `box-shadow: 0 0 0 3px rgba(13,148,136,0.15)`

### Navigation (Header)

- `background: rgba(255,255,255,0.85)`
- `backdrop-filter: saturate(180%) blur(20px)`
- 하단 구분: `border-bottom: 1px solid var(--border)`
- height: `var(--header-h)` (56px)

### Navigation (Bottom Tab)

- `background: rgba(255,255,255,0.90)`
- `backdrop-filter: blur`
- 상단 구분: `border-top: 1px solid var(--border)`
- height: `var(--bottom-nav-h)` (64px) + safe-area
- Active tab: teal 텍스트 (`var(--accent)`) + `rgba(13,148,136,0.10)` pill 배경
- Inactive tab: `var(--faint)` 색상

### Badge

- `background: var(--surface-raised)`
- `border: 1px solid var(--border-line)`
- `color: var(--muted)`
- `border-radius: 999px`

---

## Typography

> 폰트 크기와 굵기는 기존 구현을 유지한다. 아래는 기준 가이드라인.

| 역할 | 최소 크기 | 비고 |
|------|----------|------|
| 본문 | 18px (html font-size: 20px 기준 0.9rem) | 고령자 가독성 |
| 레이블 | 16px | 입력 필드 레이블 |
| 버튼 텍스트 | 14px (0.875rem) | 최소 기준 |
| 헤더 타이틀 | 18px (1rem 이상) | |

폰트 패밀리: `"Apple SD Gothic Neo", "Malgun Gothic", "Nanum Gothic", system-ui, -apple-system, "Segoe UI", sans-serif`

---

## 고령자 UX 기준 (필수)

주요 사용자: 버스기사 50~80대, 학부모 40~60대

- 글자 크기: 본문 최소 18px, 레이블/설명 최소 16px
- 버튼/터치 영역: 최소 48px × 48px
- 한 화면에 주요 액션 1개 우선 배치
- hover 기반 기능, 숨겨진 기능 금지
- 경고/오류는 화면에 명확히 드러낼 것
- 주요 CTA 버튼: 화면 하단 고정 우선
- 복잡한 테이블보다 카드/리스트 중심 구조 우선
- 숫자 입력 시 숫자 키패드 유도 (`inputMode="numeric"`)

---

## 화면 구조

### 모바일 레이아웃

```
┌──────────────────────────────┐
│  상단 헤더 (fixed/sticky)     │  height: var(--header-h) = 56px
│  rgba(255,255,255,0.85) blur  │
├──────────────────────────────┤
│                              │
│  본문 콘텐츠 (스크롤 가능)    │  padding-bottom: pb-nav-safe
│                              │
├──────────────────────────────┤
│  하단 탭바 (fixed)            │  height: var(--bottom-nav-h) = 64px
│  rgba(255,255,255,0.90) blur  │  + safe-area-inset-bottom
└──────────────────────────────┘
```

헤더와 탭바가 콘텐츠 영역과 **절대 겹치지 않아야 한다.**
- 본문: `pb-nav-safe` 클래스로 하단 패딩 확보
- 고정 값(`pb-24` 등) 사용 금지

### 게시판 상세 (iMessage 레이아웃)

```
┌──────────────────────────────┐
│  protected-shell 상단 헤더    │  position: sticky, var(--header-h)
├──────────────────────────────┤
│  채팅 헤더 (shrink-0)         │  뒤로가기 + 상대방 이름
├──────────────────────────────┤
│                              │
│  채팅 메시지 영역 (flex-1)    │  overflow-y-auto, overflow-x-hidden
│  배경: var(--page-bg)         │
│                              │
├──────────────────────────────┤
│  메시지 입력창 (shrink-0)     │  + safe-area 하단
├──────────────────────────────┤
│  하단 탭바 (fixed)            │  var(--bottom-nav-h)
└──────────────────────────────┘
```

- 가로/세로 스크롤 대화 영역 외 일체 금지
- `overflow-x-hidden` 채팅 영역에 명시

---

## 기술 스택

- Next.js App Router
- TypeScript
- Supabase (Auth / DB / Storage)
- shadcn/ui + Tailwind CSS
- 모바일 우선 (Mobile First)
