# BusDriver Superpower Overhaul Plan

**Created:** 2026-03-28
**Scope:** 4-phase overhaul across ~50+ files
**Estimated complexity:** HIGH
**Base branch:** main (43f8643)

---

## Context

BusDriver is a school bus management system (Next.js 14 App Router + TypeScript + Supabase + Tailwind/shadcn) serving bus drivers (ADMIN, age 50-80) and parents (PARENT, age 50-70). The codebase is functional but has critical architectural gaps: auth uses NextAuth credentials instead of Supabase Auth (blocking RLS enforcement), payment logic lacks fee hierarchy and cumulative tracking, no real-time features exist, and Kakao Maps integration is incomplete.

**Current architecture snapshot:**
- Auth: NextAuth.js JWT via `lib/auth/options.ts` with bcrypt against custom `users` table
- DB access: Raw Supabase REST via `lib/supabase/rest.ts` using SERVICE_ROLE_KEY (bypasses RLS)
- Session: `lib/auth/session.ts` uses `getServerSession(authOptions)`
- Middleware: `middleware.ts` uses `withAuth` from `next-auth/middleware`
- Providers: `components/providers.tsx` wraps with `SessionProvider` + `QueryClientProvider`
- 13 DB tables, RLS policies written in `migrations/supabase_policies.sql` but not enforced (SERVICE_ROLE bypasses them)

---

## Work Objectives

1. Replace NextAuth with Supabase Auth so RLS policies can actually enforce per-user data isolation
2. Complete the payment system with fee hierarchy, cumulative tracking, and shortage auto-calculation
3. Add real-time capabilities via Supabase Realtime for notifications and live updates
4. Finish Kakao Maps integration with a proper route builder
5. Optimize performance with React Server Components, Suspense, and streaming
6. Polish mobile UX to match AGENTS.md requirements (18px min font, 48px buttons, bottom-fixed actions)

---

## Guardrails

### Must Have
- Zero data loss during auth migration (existing users must be migrated)
- Parents can ONLY see their own children's data after RLS enforcement
- Payment fee hierarchy: school default_monthly_fee > student fee_amount
- All interactive elements min 48px touch target
- SweetAlert2 for critical confirmations
- Works on mobile Chrome/Safari as primary target

### Must NOT Have
- Breaking changes to the DB schema (additive migrations only, backfill existing data)
- Desktop-only features or hover-dependent interactions
- Direct exposure of SUPABASE_SERVICE_ROLE_KEY to the client
- Complex multi-step wizards (one primary action per screen)

---

## Phase 1: Foundation (Auth Migration + RLS Enforcement)

**Scope:** L (Large) -- most files touched, highest risk
**Goal:** Replace NextAuth with Supabase Auth; enforce RLS so parents see only their data.

### Step 1.1: Install Supabase client libraries and configure

**Files to create:**
- `lib/supabase/server.ts` -- Server-side Supabase client using `@supabase/ssr` with cookie-based auth
- `lib/supabase/client.ts` -- Browser-side Supabase client using `@supabase/ssr`
- `lib/supabase/middleware.ts` -- Supabase session refresh helper for middleware

**Files to modify:**
- `package.json` -- Add `@supabase/supabase-js`, `@supabase/ssr`; remove `next-auth`, `bcryptjs`, `@types/bcryptjs`
- `.env.example` -- Replace NEXTAUTH_SECRET/NEXTAUTH_URL with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

**Acceptance criteria:**
- [ ] `createServerClient()` returns authenticated Supabase client in Server Components
- [ ] `createBrowserClient()` returns authenticated Supabase client in Client Components
- [ ] Existing `lib/supabase/rest.ts` still works (keep as fallback during migration)

### Step 1.2: Migrate user accounts to Supabase Auth

**Files to create:**
- `scripts/migrate-users-to-supabase-auth.ts` -- One-time migration script that:
  1. Reads all rows from `users` table
  2. Creates corresponding `auth.users` entries via Supabase Admin API
  3. Stores `role` in `auth.users.raw_user_meta_data`
  4. Maps old `users.id` to new `auth.users.id` (or preserves UUIDs if possible)
  5. Updates all foreign keys (students.parent_user_id, board_posts.author_id, etc.)

- `migrations/2026_03_28_link_users_to_auth.sql` -- SQL migration to add `auth_user_id` column to `users` table as transition bridge

**Acceptance criteria:**
- [ ] Migration script is idempotent (can re-run safely)
- [ ] All existing users can log in with same email/password via Supabase Auth
- [ ] Role metadata is preserved (ADMIN/PARENT)
- [ ] Foreign key references remain valid

### Step 1.3: Replace auth flow (login, signup, session, middleware)

**Files to modify:**
- `app/(auth)/login/LoginClient.tsx` -- Replace NextAuth `signIn('credentials')` with `supabase.auth.signInWithPassword()`
- `app/(auth)/login/page.tsx` -- Adapt server component for Supabase session check
- `app/(auth)/signup/SignupClient.tsx` -- Replace `/api/signup` call with `supabase.auth.signUp()` + role metadata
- `middleware.ts` -- Replace `withAuth` from next-auth with Supabase session refresh via `@supabase/ssr`
- `lib/auth/session.ts` -- Replace `getServerSession(authOptions)` with `supabase.auth.getUser()`
- `components/providers.tsx` -- Remove `SessionProvider` from next-auth; keep `QueryClientProvider`
- `components/sign-out-button.tsx` -- Replace NextAuth `signOut()` with `supabase.auth.signOut()`
- `app/(protected)/layout.tsx` -- Update session retrieval to use new `requireSession()`

**Files to delete:**
- `lib/auth/options.ts` -- NextAuth config (no longer needed)
- `app/api/auth/[...nextauth]/route.ts` -- NextAuth API route
- `app/api/signup/route.ts` -- Custom signup endpoint (replaced by Supabase Auth)
- `pages/_document.tsx` -- Legacy pages directory file

**Acceptance criteria:**
- [ ] Login works with email/password via Supabase Auth
- [ ] Signup creates user in `auth.users` with role in metadata
- [ ] `requireSession()` returns typed session with `id`, `email`, `role`
- [ ] Middleware redirects unauthenticated users to `/login`
- [ ] Middleware redirects non-ADMIN from `/admin` to `/dashboard`
- [ ] Sign-out clears Supabase session and redirects to `/login`
- [ ] Session timeout: 30-min inactivity auto-logout per AGENTS.md

### Step 1.4: Switch data layer from SERVICE_ROLE to per-user client

**Files to modify:**
- `lib/supabase/rest.ts` -- Deprecate; keep for admin-only server actions that need service role
- `lib/data/payment.ts` -- Use per-user Supabase client instead of `restSelect`/`restInsert`
- `lib/data/student.ts` -- Same
- `lib/data/school.ts` -- Same
- `lib/data/board.ts` -- Same
- `lib/data/board-notifications.ts` -- Same
- `lib/data/alert.ts` -- Same
- `lib/data/route.ts` -- Same
- `lib/data/user.ts` -- Same
- `lib/data/invite.ts` -- Same

**Acceptance criteria:**
- [ ] PARENT user queries automatically filtered by RLS (only sees own children's data)
- [ ] ADMIN user queries return all data
- [ ] No Supabase REST calls use SERVICE_ROLE_KEY except explicit admin operations
- [ ] All existing functionality works identically

### Step 1.5: Activate and verify RLS policies

**Files to modify:**
- `migrations/supabase_policies.sql` -- Update policies to use `auth.uid()` instead of `auth.jwt() ->> 'user_id'`; add missing policies for `parent_profiles`, `board_notifications`, `invite_tokens`

**Files to create:**
- `scripts/verify-rls.ts` -- Test script that:
  1. Creates a test PARENT user
  2. Attempts to read another parent's students (must fail)
  3. Attempts to read own students (must succeed)
  4. Attempts to read all payments (must only return own children's)

**Acceptance criteria:**
- [ ] RLS is enabled on all 13 tables
- [ ] PARENT can only SELECT their own students (via `parent_user_id = auth.uid()`)
- [ ] PARENT can only SELECT payments for their own students
- [ ] PARENT can read board_posts but only insert where `author_id = auth.uid()`
- [ ] ADMIN has full CRUD on all tables
- [ ] Verification script passes

### Risks & Mitigations (Phase 1)
| Risk | Impact | Mitigation |
|------|--------|------------|
| User migration fails mid-way | Users locked out | Idempotent script with rollback; keep NextAuth as fallback until verified |
| UUID mismatch after migration | Broken foreign keys | Preserve original UUIDs when creating auth.users entries |
| RLS too restrictive | Admin can't operate | Test admin policies first; use service role as explicit escape hatch for admin server actions |
| Session cookie size exceeds limits | Auth failures | Use Supabase PKCE flow (stores in httpOnly cookies via @supabase/ssr) |

---

## Phase 2: Core Features (Payment System + Admin Dashboard)

**Scope:** M (Medium)
**Goal:** Complete payment logic with fee hierarchy and build the 3-tap payment registration flow.

### Step 2.1: Implement fee hierarchy and cumulative payment tracking

**Files to modify:**
- `lib/data/payment.ts` -- Add:
  - `getEffectiveFee(student, school)` -- returns school.defaultMonthlyFee if set > 0, else student.feeAmount
  - `getCumulativePayments(studentId, year, month)` -- sum of all PAID + PARTIAL for that month
  - `getShortage(studentId, year, month)` -- effectiveFee - cumulativePayments
  - Refactor `recordPayment()` to auto-calculate shortage and set status based on cumulative total
- `lib/data/types.ts` -- Add `PaymentSummary` type with `effectiveFee`, `totalPaid`, `shortage` fields

**Files to modify (UI):**
- `app/(protected)/dashboard/page.tsx` -- Use `getEffectiveFee()` for shortage calculation instead of raw `st.feeAmount`
- `app/(protected)/payments/page.tsx` -- Use `getEffectiveFee()` in summary calculations
- `app/(protected)/dashboard/_components/shortage-request-form.tsx` -- Display effective fee and auto-calculated shortage

**Acceptance criteria:**
- [ ] Fee hierarchy enforced: if school.defaultMonthlyFee > 0, it overrides student.feeAmount
- [ ] Multiple partial payments in same month are summed cumulatively
- [ ] Shortage = effectiveFee - sum(all payments for that student+month)
- [ ] Payment status auto-updates: PAID when cumulative >= effectiveFee, PARTIAL otherwise
- [ ] Existing payment data renders correctly with new logic

### Step 2.2: Build admin quick-payment registration (3-tap flow)

**Files to create:**
- `app/(protected)/dashboard/_components/quick-payment-dialog.tsx` -- SweetAlert2-based dialog:
  1. Tap 1: Student search (searchable select, shows student name + school)
  2. Tap 2: Payment type radio (full/partial) + amount (auto-filled with effective fee, editable) + memo
  3. Tap 3: Confirm and save
  - Auto-fills current year/month
  - Shows cumulative status for selected student
  - Fixed at bottom of screen on mobile

**Files to modify:**
- `app/(protected)/dashboard/page.tsx` (AdminDashboard) -- Add floating action button that opens QuickPaymentDialog
- `app/(protected)/dashboard/actions.ts` -- Add `quickRecordPayment` server action
- `components/searchable-select.tsx` -- Ensure it meets 48px touch targets and 18px font

**Acceptance criteria:**
- [ ] Admin can register a payment in 3 taps from dashboard
- [ ] Student search filters as-you-type (debounced, min 48px list items)
- [ ] Amount auto-fills with effective fee (school > student hierarchy)
- [ ] After save, dashboard payment list refreshes via `revalidatePath`
- [ ] SweetAlert2 confirmation before final save
- [ ] Works on mobile (dialog is bottom-sheet style, not centered modal)

### Step 2.3: Complete parent monthly payment status UI

**Files to modify:**
- `app/(protected)/dashboard/page.tsx` (ParentDashboard) -- Refactor the 12-month grid to:
  - Use `getEffectiveFee()` for accurate status
  - Show cumulative paid amount vs effective fee as progress bar
  - Color-code: green (paid), amber (partial), gray (unpaid), red (overdue for past months)
  - Each month card is min 48px tap target
  - Current month highlighted with warm blue border

**Acceptance criteria:**
- [ ] Parent sees 12-month grid with accurate paid/unpaid/partial status
- [ ] Progress bar shows paid/effectiveFee ratio visually
- [ ] Past months with shortage show red indicator
- [ ] "Request payment confirmation" button works for each month
- [ ] All text >= 18px, all buttons >= 48px

### Risks & Mitigations (Phase 2)
| Risk | Impact | Mitigation |
|------|--------|------------|
| Fee hierarchy breaks existing data | Wrong amounts displayed | Add `getEffectiveFee()` as pure function; existing data untouched |
| SweetAlert2 blocks server component rendering | Hydration errors | QuickPaymentDialog is client component; use server actions for data |
| Searchable select too slow with many students | Bad UX | Client-side filtering with virtualization if > 100 students |

---

## Phase 3: Real-time + Kakao Maps

**Scope:** M (Medium)
**Goal:** Add Supabase Realtime for live notifications and complete Kakao Maps route builder.

### Step 3.1: Set up Supabase Realtime subscriptions

**Files to create:**
- `lib/supabase/realtime.ts` -- Helper hooks:
  - `useRealtimePayments(studentIds)` -- listens to `payments` table changes for given students
  - `useRealtimeAlerts(userId)` -- listens to `alerts` table for new entries
  - `useRealtimeBoardNotifications(userId)` -- listens to `board_notifications` for unread count
- `components/realtime-provider.tsx` -- Client component that wraps protected layout with Realtime subscriptions

**Files to modify:**
- `components/layout/protected-shell.tsx` -- Integrate RealtimeProvider
- `components/layout/mobile-alert-bell.tsx` -- Update badge count in real-time (no page refresh needed)
- `components/dashboard-auto-refresh.tsx` -- Replace polling with Realtime subscription

**Acceptance criteria:**
- [ ] When admin records a payment, parent dashboard updates within 2 seconds without refresh
- [ ] Alert bell badge updates in real-time when new alert/notification arrives
- [ ] Board notification count updates when admin replies to parent's post
- [ ] Realtime connections clean up on component unmount
- [ ] Graceful fallback if Realtime connection drops (retry with backoff)

### Step 3.2: Implement Web Push notifications

**Files to create:**
- `public/sw.js` -- Service worker for push notifications
- `lib/push/subscribe.ts` -- Client-side push subscription logic
- `lib/push/send.ts` -- Server-side push notification sender (via web-push library)
- `app/api/push/subscribe/route.ts` -- API endpoint to store push subscriptions
- `migrations/2026_03_28_push_subscriptions.sql` -- New table: `push_subscriptions(id, user_id, endpoint, keys, created_at)`

**Files to modify:**
- `app/(protected)/dashboard/page.tsx` -- Add push notification opt-in prompt (non-blocking)
- `app/(protected)/dashboard/actions.ts` -- Trigger push notification when payment is confirmed
- `app/(protected)/board/actions.ts` -- Trigger push notification when comment is posted on user's thread

**Acceptance criteria:**
- [ ] Users prompted to enable push notifications (one-time, dismissible)
- [ ] Payment confirmation triggers push to relevant parent
- [ ] New board comment triggers push to post author
- [ ] Push notification opens the app to the relevant page when tapped
- [ ] Works on mobile Chrome and Safari (iOS 16.4+)

### Step 3.3: Complete Kakao Maps route builder

**Files to modify:**
- `components/kakao-map.tsx` -- Enhance with:
  - Drag-and-drop marker repositioning (touch-friendly, min 48px drag handle)
  - Polyline connecting stops in order
  - Address search integration (Kakao Places API)
  - Stop info overlay on tap (name, description, edit button)
- `components/route-stops-editor.tsx` -- Add:
  - Reorderable stop list with drag handles (48px touch targets)
  - Sync between list order and map marker numbers
  - "Add stop from map" button (tap map to place new stop)
- `components/route-map-section.tsx` -- Wire up map and editor together

**Files to modify:**
- `app/(protected)/routes/[id]/page.tsx` -- Full route detail page with map + stop editor
- `app/(protected)/routes/actions.ts` -- Server actions for saving stop coordinates and order
- `app/(protected)/dashboard/route/page.tsx` -- Parent route view (read-only map with their child's stop highlighted)

**Acceptance criteria:**
- [ ] Admin can add, remove, and reorder stops on a route
- [ ] Stops display as numbered markers connected by polyline on Kakao Map
- [ ] Admin can drag markers to reposition (saves lat/lng)
- [ ] Admin can search for addresses and place stops by address
- [ ] Parent sees read-only map with their child's pickup stop highlighted
- [ ] Map is responsive, works on mobile (touch gestures for pan/zoom)

### Risks & Mitigations (Phase 3)
| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase Realtime requires RLS (Phase 1) | Blocked | Phase 3 depends on Phase 1 completion |
| Web Push not supported on older iOS | Some parents can't get notifications | Fall back to in-app notification badge (already exists) |
| Kakao Maps API rate limits | Map fails to load | Cache map tiles; lazy-load map component |
| Drag-and-drop poor on mobile | Can't reorder stops | Provide up/down arrow buttons as alternative to drag |

---

## Phase 4: UX Polish + Performance

**Scope:** M (Medium)
**Goal:** Optimize for the target audience (50-80 year old bus drivers and parents on mobile).

### Step 4.1: React Server Components + Suspense + Streaming

**Files to modify:**
- `app/(protected)/dashboard/page.tsx` -- Split into:
  - Instant shell (greeting, nav cards) rendered immediately
  - Payment list wrapped in `<Suspense fallback={<Skeleton />}>`
  - Yearly stats wrapped in separate `<Suspense>`
- `app/(protected)/payments/page.tsx` -- Same pattern: instant controls, streaming data tables
- `app/(protected)/schools/[id]/page.tsx` -- Suspense for student list
- `app/(protected)/board/page.tsx` -- Suspense for post list

**Files to create:**
- `components/skeletons/payment-list-skeleton.tsx`
- `components/skeletons/student-list-skeleton.tsx`
- `components/skeletons/post-list-skeleton.tsx`

**Acceptance criteria:**
- [ ] Dashboard shows greeting + nav within 200ms (streaming shell)
- [ ] Data sections load progressively with skeleton fallbacks
- [ ] No full-page loading spinners
- [ ] Lighthouse Performance score >= 80 on mobile

### Step 4.2: Optimistic updates for key interactions

**Files to modify:**
- `app/(protected)/dashboard/_components/quick-payment-dialog.tsx` -- Optimistic update: payment appears in list immediately, reverts on error
- `app/(protected)/board/_components/comment-form.tsx` -- Optimistic comment insertion
- `components/request-payment-button.tsx` -- Optimistic state change (button -> "requested" badge)

**Acceptance criteria:**
- [ ] Payment registration feels instant (< 100ms perceived)
- [ ] Comment appears immediately after submit
- [ ] Error case: optimistic update reverts with toast notification
- [ ] No double-submission possible (button disabled during mutation)

### Step 4.3: Mobile UX audit and fixes

**Files to modify (as needed, audit-driven):**
- All page components -- Ensure min 18px font throughout
- All interactive components -- Ensure min 48px touch targets
- `components/layout/mobile-bottom-nav.tsx` -- Verify proper safe-area-inset-bottom
- `components/layout/protected-shell.tsx` -- Ensure no content hidden behind bottom nav
- `app/(protected)/payments/page.tsx` -- Replace desktop-only table sections with mobile card layout (already partially done in dashboard)
- `app/(protected)/schools/[id]/page.tsx` -- Mobile card layout for student list
- Any remaining hover-only interactions -- Convert to tap/click

**Files to create:**
- `app/manifest.json` -- PWA manifest for "Add to Home Screen" support
- `public/icons/` -- App icons (192x192, 512x512)

**Acceptance criteria:**
- [ ] Every page passes manual mobile audit: 18px min font, 48px min buttons, no hover-only features
- [ ] Bottom nav does not overlap page content
- [ ] Payments page uses card layout on mobile (not horizontal-scroll table)
- [ ] "Add to Home Screen" works (PWA manifest valid)
- [ ] Colors match AGENTS.md: pastel + low-saturation, warm blue/green primary
- [ ] One primary action per screen enforced

### Step 4.4: Session management per AGENTS.md

**Files to modify:**
- `middleware.ts` -- Implement 30-minute inactivity timeout:
  - Track last activity timestamp in cookie
  - On each request, check if > 30 min since last activity
  - If so, clear session and redirect to `/login`
  - Otherwise, update timestamp
- `lib/supabase/server.ts` -- Configure Supabase Auth session to 24-hour max age

**Acceptance criteria:**
- [ ] User auto-logged-out after 30 minutes of inactivity
- [ ] Active users stay logged in up to 24 hours
- [ ] Session refresh happens transparently (no user action needed)

### Risks & Mitigations (Phase 4)
| Risk | Impact | Mitigation |
|------|--------|------------|
| Suspense boundaries cause layout shift | Jarring UX | Use skeleton components that match final layout dimensions |
| Optimistic updates complex with Supabase | Inconsistent state | Use React Query's `useMutation` with `onMutate`/`onError` rollback |
| PWA service worker caches stale pages | Users see old data | Use network-first caching strategy; version the SW |

---

## Task Flow (Dependency Graph)

```
Phase 1 (Foundation)
  1.1 Install Supabase client libs
    -> 1.2 Migrate users to Supabase Auth
      -> 1.3 Replace auth flow
        -> 1.4 Switch data layer to per-user client
          -> 1.5 Activate and verify RLS

Phase 2 (Core Features) -- depends on Phase 1.3+
  2.1 Fee hierarchy + cumulative tracking (can start after 1.4)
    -> 2.2 Quick payment dialog (depends on 2.1)
  2.3 Parent payment status UI (can start after 2.1)

Phase 3 (Real-time + Maps) -- depends on Phase 1.5
  3.1 Supabase Realtime (depends on 1.5)
  3.2 Web Push (can start after 1.3)
  3.3 Kakao Maps (independent, can start anytime)

Phase 4 (UX Polish) -- can start partially alongside Phase 2/3
  4.1 Suspense/streaming (independent)
  4.2 Optimistic updates (depends on 2.2, 3.1)
  4.3 Mobile UX audit (independent)
  4.4 Session management (depends on 1.3)
```

---

## Success Criteria (Overall)

1. **Auth:** NextAuth fully removed; all auth via Supabase Auth; `next-auth` not in package.json
2. **RLS:** Parent user cannot access another parent's student/payment data (verified by script)
3. **Payments:** Fee hierarchy enforced; shortage auto-calculated; admin registers payment in <= 3 taps
4. **Real-time:** Payment confirmation pushes to parent within 2 seconds
5. **Maps:** Admin can build routes with stops on Kakao Map; parent sees their child's route
6. **Performance:** Lighthouse mobile score >= 80; dashboard loads shell within 200ms
7. **Mobile UX:** 100% of pages pass accessibility audit (18px font, 48px buttons, no hover-only)
8. **Session:** 30-min inactivity logout; 24-hour max session

---

## Files Summary

### Files to Create (~15)
- `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`
- `lib/supabase/realtime.ts`
- `lib/push/subscribe.ts`, `lib/push/send.ts`
- `scripts/migrate-users-to-supabase-auth.ts`, `scripts/verify-rls.ts`
- `migrations/2026_03_28_link_users_to_auth.sql`, `migrations/2026_03_28_push_subscriptions.sql`
- `app/api/push/subscribe/route.ts`
- `app/(protected)/dashboard/_components/quick-payment-dialog.tsx`
- `components/realtime-provider.tsx`
- `components/skeletons/payment-list-skeleton.tsx`, `components/skeletons/student-list-skeleton.tsx`, `components/skeletons/post-list-skeleton.tsx`
- `public/sw.js`, `app/manifest.json`

### Files to Modify (~25)
- `package.json`, `.env.example`, `middleware.ts`
- `lib/auth/session.ts`
- `lib/data/payment.ts`, `lib/data/student.ts`, `lib/data/school.ts`, `lib/data/board.ts`, `lib/data/board-notifications.ts`, `lib/data/alert.ts`, `lib/data/route.ts`, `lib/data/user.ts`, `lib/data/invite.ts`, `lib/data/types.ts`
- `lib/supabase/rest.ts`
- `app/(auth)/login/LoginClient.tsx`, `app/(auth)/signup/SignupClient.tsx`
- `app/(protected)/layout.tsx`, `app/(protected)/dashboard/page.tsx`, `app/(protected)/payments/page.tsx`
- `app/(protected)/dashboard/actions.ts`, `app/(protected)/board/actions.ts`
- `components/providers.tsx`, `components/sign-out-button.tsx`, `components/kakao-map.tsx`, `components/route-stops-editor.tsx`, `components/searchable-select.tsx`
- `components/layout/protected-shell.tsx`, `components/layout/mobile-alert-bell.tsx`
- `components/dashboard-auto-refresh.tsx`, `components/request-payment-button.tsx`
- `migrations/supabase_policies.sql`

### Files to Delete (~4)
- `lib/auth/options.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/signup/route.ts`
- `pages/_document.tsx`
