-- RLS Policies for BusDriver
-- Uses auth.uid() (Supabase native) matched against users.auth_user_id.
--
-- Role resolution helper:
--   get_my_role()     -> 'ADMIN' | 'PARENT' | NULL
--   get_my_legacy_id() -> users.id (UUID) of the currently authenticated user
--
-- Prerequisites:
--   - Run migrations/2026_03_29_link_users_to_auth.sql first (adds auth_user_id column)
--   - All users must be migrated via scripts/migrate-users-to-supabase-auth.ts

-- ============================================================
-- Helper functions
-- ============================================================

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role::text FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Returns the legacy users.id UUID of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_my_legacy_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE IF EXISTS public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.parent_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schools            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.routes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.route_stops        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.board_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.board_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.board_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invite_tokens      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Drop existing policies before recreating (idempotent)
-- ============================================================

-- users
DROP POLICY IF EXISTS users_read_own         ON public.users;
DROP POLICY IF EXISTS users_update_own       ON public.users;
DROP POLICY IF EXISTS admin_users_all        ON public.users;

-- parent_profiles
DROP POLICY IF EXISTS parent_profiles_read_own   ON public.parent_profiles;
DROP POLICY IF EXISTS parent_profiles_update_own ON public.parent_profiles;
DROP POLICY IF EXISTS admin_parent_profiles_all  ON public.parent_profiles;

-- schools
DROP POLICY IF EXISTS parent_schools_r     ON public.schools;
DROP POLICY IF EXISTS admin_schools_all    ON public.schools;

-- routes
DROP POLICY IF EXISTS parent_routes_r      ON public.routes;
DROP POLICY IF EXISTS admin_routes_all     ON public.routes;

-- route_stops
DROP POLICY IF EXISTS parent_route_stops_r ON public.route_stops;
DROP POLICY IF EXISTS admin_route_stops_all ON public.route_stops;

-- students
DROP POLICY IF EXISTS parent_students_r    ON public.students;
DROP POLICY IF EXISTS admin_students_all   ON public.students;

-- payments
DROP POLICY IF EXISTS parent_payments_r    ON public.payments;
DROP POLICY IF EXISTS admin_payments_all   ON public.payments;

-- board_posts
DROP POLICY IF EXISTS board_posts_r        ON public.board_posts;
DROP POLICY IF EXISTS board_posts_insert   ON public.board_posts;
DROP POLICY IF EXISTS board_posts_update_own ON public.board_posts;
DROP POLICY IF EXISTS admin_board_posts_all ON public.board_posts;
DROP POLICY IF EXISTS parent_board_posts_r  ON public.board_posts;
DROP POLICY IF EXISTS parent_board_posts_w  ON public.board_posts;

-- board_comments
DROP POLICY IF EXISTS board_comments_r       ON public.board_comments;
DROP POLICY IF EXISTS board_comments_insert  ON public.board_comments;
DROP POLICY IF EXISTS board_comments_update_own ON public.board_comments;
DROP POLICY IF EXISTS admin_board_comments_all ON public.board_comments;
DROP POLICY IF EXISTS parent_board_comments_r  ON public.board_comments;
DROP POLICY IF EXISTS parent_board_comments_w  ON public.board_comments;

-- alerts
DROP POLICY IF EXISTS parent_alerts_r      ON public.alerts;
DROP POLICY IF EXISTS admin_alerts_all     ON public.alerts;

-- board_notifications
DROP POLICY IF EXISTS notifications_read_own   ON public.board_notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.board_notifications;
DROP POLICY IF EXISTS admin_notifications_all  ON public.board_notifications;

-- invite_tokens
DROP POLICY IF EXISTS invite_tokens_admin_manage ON public.invite_tokens;
DROP POLICY IF EXISTS invite_tokens_anon_select  ON public.invite_tokens;

-- ============================================================
-- users table
-- ============================================================

-- Users can read their own row
CREATE POLICY users_read_own ON public.users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Users can update their own row (not role or auth_user_id)
CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ADMIN can do everything on users
CREATE POLICY admin_users_all ON public.users
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- ============================================================
-- parent_profiles table
-- ============================================================

-- Parents can read their own profile
CREATE POLICY parent_profiles_read_own ON public.parent_profiles
  FOR SELECT
  USING (user_id = public.get_my_legacy_id());

-- Parents can update their own profile
CREATE POLICY parent_profiles_update_own ON public.parent_profiles
  FOR UPDATE
  USING (user_id = public.get_my_legacy_id())
  WITH CHECK (user_id = public.get_my_legacy_id());

-- ADMIN can do everything on parent_profiles
CREATE POLICY admin_parent_profiles_all ON public.parent_profiles
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- ============================================================
-- schools table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_schools_all ON public.schools
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- PARENT can read all schools (needed for displaying school names)
CREATE POLICY parent_schools_r ON public.schools
  FOR SELECT
  USING (public.get_my_role() = 'PARENT');

-- ============================================================
-- routes table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_routes_all ON public.routes
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- PARENT can read all routes
CREATE POLICY parent_routes_r ON public.routes
  FOR SELECT
  USING (public.get_my_role() = 'PARENT');

-- ============================================================
-- route_stops table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_route_stops_all ON public.route_stops
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- PARENT can read all route stops
CREATE POLICY parent_route_stops_r ON public.route_stops
  FOR SELECT
  USING (public.get_my_role() = 'PARENT');

-- ============================================================
-- students table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_students_all ON public.students
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- PARENT can only read their own children (matched by legacy users.id)
CREATE POLICY parent_students_r ON public.students
  FOR SELECT
  USING (
    public.get_my_role() = 'PARENT'
    AND parent_user_id = public.get_my_legacy_id()
  );

-- ============================================================
-- payments table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_payments_all ON public.payments
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- PARENT can read payments for their own students
CREATE POLICY parent_payments_r ON public.payments
  FOR SELECT
  USING (
    public.get_my_role() = 'PARENT'
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = payments.student_id
        AND s.parent_user_id = public.get_my_legacy_id()
    )
  );

-- ============================================================
-- board_posts table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_board_posts_all ON public.board_posts
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- Any authenticated user can read posts
CREATE POLICY board_posts_r ON public.board_posts
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert posts where author_id matches their legacy id
CREATE POLICY board_posts_insert ON public.board_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = public.get_my_legacy_id()
  );

-- Users can update their own posts
CREATE POLICY board_posts_update_own ON public.board_posts
  FOR UPDATE
  USING (author_id = public.get_my_legacy_id())
  WITH CHECK (author_id = public.get_my_legacy_id());

-- ============================================================
-- board_comments table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_board_comments_all ON public.board_comments
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- Any authenticated user can read comments
CREATE POLICY board_comments_r ON public.board_comments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert comments where author_id matches their legacy id
CREATE POLICY board_comments_insert ON public.board_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = public.get_my_legacy_id()
  );

-- Users can update their own comments
CREATE POLICY board_comments_update_own ON public.board_comments
  FOR UPDATE
  USING (author_id = public.get_my_legacy_id())
  WITH CHECK (author_id = public.get_my_legacy_id());

-- ============================================================
-- alerts table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_alerts_all ON public.alerts
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- PARENT can read alerts for their own students
CREATE POLICY parent_alerts_r ON public.alerts
  FOR SELECT
  USING (
    public.get_my_role() = 'PARENT'
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = alerts.student_id
        AND s.parent_user_id = public.get_my_legacy_id()
    )
  );

-- ============================================================
-- board_notifications table
-- ============================================================

-- ADMIN can do everything
CREATE POLICY admin_notifications_all ON public.board_notifications
  FOR ALL
  USING (public.get_my_role() = 'ADMIN');

-- Users can read their own notifications (receiver_id = legacy users.id)
CREATE POLICY notifications_read_own ON public.board_notifications
  FOR SELECT
  USING (receiver_id = public.get_my_legacy_id());

-- Users can update their own notifications (e.g. mark as read)
CREATE POLICY notifications_update_own ON public.board_notifications
  FOR UPDATE
  USING (receiver_id = public.get_my_legacy_id())
  WITH CHECK (receiver_id = public.get_my_legacy_id());

-- ============================================================
-- invite_tokens table
-- ============================================================

-- ADMIN can insert new tokens and read all tokens they created
CREATE POLICY invite_tokens_admin_manage ON public.invite_tokens
  FOR ALL
  USING (public.get_my_role() = 'ADMIN')
  WITH CHECK (public.get_my_role() = 'ADMIN');

-- Anonymous users can read invite tokens (needed for signup link validation)
-- The token column is unguessable (random), so SELECT alone is safe
CREATE POLICY invite_tokens_anon_select ON public.invite_tokens
  FOR SELECT
  USING (true);
