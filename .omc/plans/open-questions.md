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
