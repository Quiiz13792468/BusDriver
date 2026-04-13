# Open Questions

## busdriver-superpower-overhaul - 2026-03-28

- [ ] **User UUID preservation during auth migration** -- Can Supabase Admin API create auth.users with specific UUIDs, or will new UUIDs be generated? If new UUIDs, all foreign keys across 13 tables must be remapped. This determines migration complexity.

- [ ] **Supabase project plan tier** -- Supabase Realtime has connection limits per plan (Free: 200 concurrent, Pro: 500). Confirm the project is on a paid plan if expecting concurrent parent users.

- [ ] **Kakao Maps API key scope** -- Current `.env.example` does not include `NEXT_PUBLIC_KAKAO_MAP_KEY`. Is a Kakao developer account already provisioned? The Places API (address search) may require a separate key or elevated permissions.

- [ ] **Web Push VAPID keys** -- Web Push requires VAPID key pair. These need to be generated and stored as environment variables. Decision: generate during setup or provide a setup script?

- [ ] **iOS Safari push support** -- Web Push on iOS requires Safari 16.4+ and the app must be installed to home screen. Are the target parents likely on iOS 16.4+? If not, push notifications will be Android-only and the in-app badge becomes the primary notification channel for iOS.

- [ ] **Existing password hashes during migration** -- Supabase Auth uses bcrypt internally. The current system also uses bcrypt via `bcryptjs`. Confirm: can we import existing bcrypt hashes directly into Supabase Auth, or must users reset passwords?

- [ ] **Admin multi-tenancy** -- Current schema has `admin_user_id` on `schools` and `parent_profiles`. Is this project intended for a single bus driver (single admin), or could multiple admins operate independently? This affects RLS policy design.

- [ ] **Payment deletion policy** -- `deletePaymentsBySchool()` exists in `lib/data/payment.ts`. Should payment records ever be hard-deleted, or should we add soft-delete to maintain audit trail?

- [ ] **Service worker update strategy** -- For PWA, how should the service worker handle updates? Options: auto-update silently, prompt user to reload, or skip-waiting. For non-tech-savvy users, auto-update is safest but can cause brief inconsistencies.

## busdriver-v2-greenfield - 2026-04-12

- [ ] **버스기사 가입 경로** — 초대 링크 외에 관리자 승인 기반 일반 가입을 허용할 것인가? 초기 운영 진입장벽과 보안 사이 균형에 영향.
- [ ] **알림 채널 범위** — Phase 1에서 앱 내 Realtime만 사용할지, 카카오 알림톡/SMS까지 포함할지. 포함 시 외부 서비스 계약/환경변수 필요.
- [ ] **이의제기 자동 만료** — 해결되지 않은 이의제기를 N일 후 자동 종결할지, 수동으로만 종결할지. 분쟁 장기화 방지 정책 필요.
- [ ] **주유 기록 사진 첨부** — 영수증 사진 첨부 기능 필요 여부. 필요 시 Supabase Storage 도입 + RLS 정책 추가.
- [ ] **초대 링크 공유 UX** — 카카오톡 공유 SDK, Web Share API, URL 복사 중 Phase 1 기본 지원 범위 결정.
- [ ] **다자녀 학부모 홈 UI** — 자녀 여러 명일 때 카드 정렬 기준(자녀별 vs 상태별) 및 액션 배치 기준.
- [ ] **아이디 정책** — 허용 문자/길이/대소문자 구분, 변경 가능 여부, 예약어 정책.
- [ ] **데이터 마이그레이션 여부** — "전부 삭제" 전제가 운영 데이터까지 포함인지 재확인. 일부 학생/입금 이력 이전 필요 시 별도 계획 필요.
- [ ] **v1 히스토리 보존 방식** — `archive/v1-final` 태그 외에 별도 저장소 백업이 필요한가(감사/법적 보관).
- [ ] **Next 15 + React 19 의존성 호환성** — 기존 사용 예정 라이브러리(sweetalert2, notiflix 등) 호환성 smoke 필요.
