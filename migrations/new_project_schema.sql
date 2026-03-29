-- ============================================================
-- BusDriver — New Supabase Project Schema
-- 생성일: 2026-03-29
--
-- 기존 스키마 대비 주요 개선사항:
--   1. custom users 테이블 제거 → profiles 테이블 (auth.users 직접 연동)
--   2. payments.id: text → uuid  (crypto.randomUUID() 코드와 일치)
--   3. board_notifications.receiver_id → user_id  (realtime.ts 코드 버그 수정)
--   4. students.school_id: NOT NULL → NULL 허용 (미배정 학생 지원)
--   5. alerts에 updated_at 컬럼 추가
--   6. 모든 테이블에 gen_random_uuid() 기본값
--   7. FK 제약 조건 추가
--   8. CHECK 제약 조건 추가 (month 1-12, deposit_day 1-31)
--   9. 성능 인덱스 추가 (13개)
--  10. updated_at 자동 갱신 트리거
--  11. RLS: auth.uid() 직접 사용 (legacy bridge 불필요)
--  12. parent_profiles.student_name/student_phone 제거 (students 테이블과 중복)
-- ============================================================


-- ============================================================
-- 0. ENUM 타입
-- ============================================================

CREATE TYPE public.user_role       AS ENUM ('ADMIN', 'PARENT');
CREATE TYPE public.alert_type      AS ENUM ('PAYMENT', 'INQUIRY', 'ROUTE_CHANGE');
CREATE TYPE public.alert_status    AS ENUM ('PENDING', 'RESOLVED');
CREATE TYPE public.payment_status  AS ENUM ('PAID', 'PARTIAL', 'UNPAID');


-- ============================================================
-- 1. updated_at 자동 갱신 함수 (트리거용)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- 2. profiles  (기존 users 테이블 대체)
--    auth.users 에 연결되는 앱 전용 프로필
-- ============================================================

CREATE TABLE public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL DEFAULT '',
  role        user_role   NOT NULL DEFAULT 'PARENT',
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 신규 사용자 가입 시 profiles 자동 생성 (Supabase Auth 트리거)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'PARENT')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 3. schools
-- ============================================================

CREATE TABLE public.schools (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  address             text,
  default_monthly_fee integer     NOT NULL DEFAULT 0,
  admin_user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 4. routes
-- ============================================================

CREATE TABLE public.routes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   uuid        NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_routes_school_id ON public.routes(school_id);


-- ============================================================
-- 5. route_stops
-- ============================================================

CREATE TABLE public.route_stops (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id    uuid    NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name        text    NOT NULL,
  position    integer NOT NULL,
  lat         double precision,
  lng         double precision,
  description text
);

CREATE INDEX idx_route_stops_route_position ON public.route_stops(route_id, position);


-- ============================================================
-- 6. students
--    school_id: NULL 허용 (미배정 학생 지원)
-- ============================================================

CREATE TABLE public.students (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         uuid        REFERENCES public.schools(id) ON DELETE SET NULL,  -- NULL 허용
  parent_user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  name              text        NOT NULL,
  guardian_name     text        NOT NULL DEFAULT '',
  phone             text,
  home_address      text,
  pickup_point      text,
  route_id          uuid        REFERENCES public.routes(id) ON DELETE SET NULL,
  emergency_contact text,
  fee_amount        integer     NOT NULL DEFAULT 0,
  deposit_day       integer     CHECK (deposit_day BETWEEN 1 AND 31),
  is_active         boolean     NOT NULL DEFAULT true,
  suspended_at      timestamptz,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_students_school_id      ON public.students(school_id);
CREATE INDEX idx_students_parent_user_id ON public.students(parent_user_id);


-- ============================================================
-- 7. payments
--    id: uuid 타입으로 수정 (기존 text → uuid)
-- ============================================================

CREATE TABLE public.payments (
  id            uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid            NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id     uuid            NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  amount        integer         NOT NULL,
  target_year   integer         NOT NULL,
  target_month  integer         NOT NULL CHECK (target_month BETWEEN 1 AND 12),
  status        payment_status  NOT NULL DEFAULT 'PAID',
  paid_at       timestamptz,
  memo          text,
  created_at    timestamptz     NOT NULL DEFAULT now(),
  updated_at    timestamptz     NOT NULL DEFAULT now()
);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_payments_student_id           ON public.payments(student_id);
CREATE INDEX idx_payments_school_id            ON public.payments(school_id);
CREATE INDEX idx_payments_school_year_month    ON public.payments(school_id, target_year, target_month);
CREATE INDEX idx_payments_year_month           ON public.payments(target_year, target_month);


-- ============================================================
-- 8. alerts
--    updated_at 컬럼 추가 (기존 스키마 누락)
-- ============================================================

CREATE TABLE public.alerts (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid         NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id   uuid         NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  year        integer      NOT NULL,
  month       integer      NOT NULL CHECK (month BETWEEN 1 AND 12),
  type        alert_type   NOT NULL,
  status      alert_status NOT NULL DEFAULT 'PENDING',
  created_by  uuid         NOT NULL REFERENCES auth.users(id),
  memo        text,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()   -- 기존 스키마 누락 → 추가
);

CREATE TRIGGER alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_alerts_school_status ON public.alerts(school_id, status);
CREATE INDEX idx_alerts_student_id    ON public.alerts(student_id);


-- ============================================================
-- 9. board_posts
-- ============================================================

CREATE TABLE public.board_posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  content          text        NOT NULL,
  author_id        uuid        NOT NULL REFERENCES auth.users(id),
  school_id        uuid        REFERENCES public.schools(id) ON DELETE SET NULL,
  parent_only      boolean     NOT NULL DEFAULT true,
  locked           boolean     NOT NULL DEFAULT false,
  target_parent_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count       integer     NOT NULL DEFAULT 0,
  comment_count    integer     NOT NULL DEFAULT 0,
  last_comment_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER board_posts_updated_at
  BEFORE UPDATE ON public.board_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_board_posts_school_created  ON public.board_posts(school_id, created_at DESC);
CREATE INDEX idx_board_posts_target_parent   ON public.board_posts(target_parent_id) WHERE target_parent_id IS NOT NULL;


-- ============================================================
-- 10. board_comments
-- ============================================================

CREATE TABLE public.board_comments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           uuid        NOT NULL REFERENCES public.board_posts(id) ON DELETE CASCADE,
  author_id         uuid        NOT NULL REFERENCES auth.users(id),
  content           text        NOT NULL,
  parent_comment_id uuid        REFERENCES public.board_comments(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER board_comments_updated_at
  BEFORE UPDATE ON public.board_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_board_comments_post_id ON public.board_comments(post_id);


-- ============================================================
-- 11. board_notifications
--     receiver_id → user_id 로 변경 (realtime.ts 코드와 일치)
-- ============================================================

CREATE TABLE public.board_notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- 기존 receiver_id → user_id
  post_id     uuid        NOT NULL REFERENCES public.board_posts(id)    ON DELETE CASCADE,
  comment_id  uuid        REFERENCES public.board_comments(id) ON DELETE CASCADE,
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_notifications_user_unread
  ON public.board_notifications(user_id, is_read)
  WHERE is_read = false;


-- ============================================================
-- 12. invite_tokens
-- ============================================================

CREATE TABLE public.invite_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        NOT NULL UNIQUE,
  admin_id    uuid        NOT NULL REFERENCES auth.users(id),
  used        boolean     NOT NULL DEFAULT false,
  used_by     uuid        REFERENCES auth.users(id),
  used_at     timestamptz,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 13. parent_profiles  (초대 수락 시 임시 정보 저장)
--     student_name / student_phone 제거 (students 테이블과 중복)
-- ============================================================

CREATE TABLE public.parent_profiles (
  user_id       uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  address       text,
  admin_user_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER parent_profiles_updated_at
  BEFORE UPDATE ON public.parent_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- 14. auth_login_audit  (로그인 감사 로그)
-- ============================================================

CREATE TABLE public.auth_login_audit (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  role        text,
  success     boolean     NOT NULL,
  reason      text        NOT NULL DEFAULT '',
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  source      text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_login_audit_user_id ON public.auth_login_audit(user_id);
CREATE INDEX idx_auth_login_audit_occurred ON public.auth_login_audit(occurred_at DESC);


-- ============================================================
-- 15. RLS 활성화
-- ============================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_login_audit    ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 16. RLS 헬퍼 함수
--     신규 구조에서는 auth.uid() 직접 사용 → bridge 불필요
-- ============================================================

-- 현재 사용자의 role 반환
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 하위 호환: get_my_legacy_id() = auth.uid() (bridge 불필요)
CREATE OR REPLACE FUNCTION public.get_my_legacy_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT auth.uid();
$$;


-- ============================================================
-- 17. RLS 정책
-- ============================================================

-- profiles
CREATE POLICY profiles_read_own   ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY admin_profiles_all  ON public.profiles FOR ALL   USING (public.get_my_role() = 'ADMIN');

-- schools
CREATE POLICY admin_schools_all ON public.schools FOR ALL    USING (public.get_my_role() = 'ADMIN');
CREATE POLICY parent_schools_r  ON public.schools FOR SELECT USING (public.get_my_role() = 'PARENT');

-- routes
CREATE POLICY admin_routes_all ON public.routes FOR ALL    USING (public.get_my_role() = 'ADMIN');
CREATE POLICY parent_routes_r  ON public.routes FOR SELECT USING (public.get_my_role() = 'PARENT');

-- route_stops
CREATE POLICY admin_route_stops_all ON public.route_stops FOR ALL    USING (public.get_my_role() = 'ADMIN');
CREATE POLICY parent_route_stops_r  ON public.route_stops FOR SELECT USING (public.get_my_role() = 'PARENT');

-- students
CREATE POLICY admin_students_all ON public.students FOR ALL USING (public.get_my_role() = 'ADMIN');
CREATE POLICY parent_students_r  ON public.students FOR SELECT
  USING (public.get_my_role() = 'PARENT' AND parent_user_id = auth.uid());

-- payments
CREATE POLICY admin_payments_all ON public.payments FOR ALL USING (public.get_my_role() = 'ADMIN');
CREATE POLICY parent_payments_r  ON public.payments FOR SELECT
  USING (
    public.get_my_role() = 'PARENT'
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = payments.student_id AND s.parent_user_id = auth.uid()
    )
  );

-- alerts
CREATE POLICY admin_alerts_all ON public.alerts FOR ALL USING (public.get_my_role() = 'ADMIN');
CREATE POLICY parent_alerts_r  ON public.alerts FOR SELECT
  USING (
    public.get_my_role() = 'PARENT'
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = alerts.student_id AND s.parent_user_id = auth.uid()
    )
  );

-- board_posts
CREATE POLICY admin_board_posts_all    ON public.board_posts FOR ALL    USING (public.get_my_role() = 'ADMIN');
CREATE POLICY board_posts_r            ON public.board_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY board_posts_insert       ON public.board_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());
CREATE POLICY board_posts_update_own   ON public.board_posts FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- board_comments
CREATE POLICY admin_board_comments_all  ON public.board_comments FOR ALL    USING (public.get_my_role() = 'ADMIN');
CREATE POLICY board_comments_r          ON public.board_comments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY board_comments_insert     ON public.board_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());
CREATE POLICY board_comments_update_own ON public.board_comments FOR UPDATE USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- board_notifications
CREATE POLICY admin_notifications_all  ON public.board_notifications FOR ALL    USING (public.get_my_role() = 'ADMIN');
CREATE POLICY notifications_read_own   ON public.board_notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON public.board_notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- invite_tokens
CREATE POLICY invite_tokens_admin_manage ON public.invite_tokens FOR ALL    USING (public.get_my_role() = 'ADMIN') WITH CHECK (public.get_my_role() = 'ADMIN');
CREATE POLICY invite_tokens_anon_select  ON public.invite_tokens FOR SELECT USING (true);

-- parent_profiles
CREATE POLICY parent_profiles_read_own   ON public.parent_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY parent_profiles_update_own ON public.parent_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY admin_parent_profiles_all  ON public.parent_profiles FOR ALL   USING (public.get_my_role() = 'ADMIN');

-- auth_login_audit (서비스 롤만 INSERT 가능, 사용자는 자신의 로그 조회 가능)
CREATE POLICY audit_read_own ON public.auth_login_audit FOR SELECT USING (user_id = auth.uid());


-- ============================================================
-- 18. Realtime 활성화 (Supabase 대시보드에서도 설정 필요)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_notifications;


-- ============================================================
-- 완료
-- ============================================================
-- 적용 후 앱 코드에서 변경 필요한 사항:
--   1. lib/auth/session.ts : users 테이블 → profiles 테이블 참조 제거
--      (이미 auth.uid() 기반으로 동작하므로 대부분 변경 불필요)
--   2. lib/supabase/rest.ts 사용 시 'users' → 'profiles' 테이블명 확인
--   3. board_notifications 쿼리의 user_id 컬럼은 이미 코드와 일치 ✓
--   4. payments.id가 uuid이므로 restSelectIn 등 IN 필터 동작 확인 ✓
-- ============================================================
