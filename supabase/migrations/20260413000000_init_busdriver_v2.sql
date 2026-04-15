-- =============================================================================
-- BusDriver v2 — 초기 스키마 마이그레이션
-- 생성일: 2026-04-13
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
-- citext: 대소문자 구분 없는 텍스트 타입 (login_id 중복 방지)
-- pgcrypto는 Supabase에 이미 설치되어 있으나 extensions 스키마에 있으므로
-- gen_random_bytes 대신 gen_random_uuid() 기반 토큰 생성 사용
CREATE EXTENSION IF NOT EXISTS citext;

-- =============================================================================
-- 2. 공통 헬퍼 함수 (테이블 생성 전)
-- =============================================================================

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 초대 토큰 생성 함수 (UUID 2개 합성 → 64자 hex, pgcrypto 불필요)
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

-- =============================================================================
-- 3. 테이블 정의 (의존성 순서)
-- =============================================================================

-- profiles: auth.users 1:1 연결
CREATE TABLE public.profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text        NOT NULL CHECK (role IN ('ADMIN', 'DRIVER', 'PARENT')),
  login_id      citext      NOT NULL UNIQUE,
  full_name     text        NOT NULL,
  phone         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS '앱 사용자 프로필. auth.users 1:1 연결';

-- schools: DRIVER가 소유하는 학교
CREATE TABLE public.schools (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_driver_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  name             text        NOT NULL,
  default_fee      integer     NOT NULL DEFAULT 0 CHECK (default_fee >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.schools IS 'DRIVER가 관리하는 학교. default_fee가 학생 custom_fee보다 우선';

-- students: 학생 정보
CREATE TABLE public.students (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  school_id       uuid        REFERENCES public.schools(id) ON DELETE SET NULL,
  name            text        NOT NULL,
  phone           text,
  parent_name     text,
  parent_phone    text,
  ride_type       text        NOT NULL DEFAULT 'BOTH' CHECK (ride_type IN ('MORNING', 'AFTERNOON', 'BOTH')),
  start_date      date,
  end_date        date,
  payment_day     integer     CHECK (payment_day BETWEEN 1 AND 31),
  custom_fee      integer     CHECK (custom_fee >= 0),
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.students IS '학생 정보. school.default_fee가 custom_fee보다 우선';

-- student_parents: 학부모-학생 N:M 연결 (한 학부모가 여러 자녀)
CREATE TABLE public.student_parents (
  student_id        uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  linked_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, parent_profile_id)
);
COMMENT ON TABLE public.student_parents IS '학부모-학생 N:M. 한 학부모가 여러 자녀를 가질 수 있음';

-- invite_tokens: 초대 링크 (DRIVER가 생성)
CREATE TABLE public.invite_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        NOT NULL UNIQUE DEFAULT public.generate_invite_token(),
  role        text        NOT NULL CHECK (role IN ('DRIVER', 'PARENT')),
  created_by  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_student_id uuid  REFERENCES public.students(id) ON DELETE SET NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  used_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_expires_range
    CHECK (expires_at > created_at AND expires_at <= created_at + interval '7 days')
);
COMMENT ON TABLE public.invite_tokens IS 'DRIVER가 생성하는 초대 링크. role=PARENT이면 target_student_id로 자녀 자동 바인딩';

-- payments: 입금 기록 (PENDING → DISPUTED → CONFIRMED)
CREATE TABLE public.payments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid        NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  driver_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount           integer     NOT NULL CHECK (amount > 0),
  paid_at          date        NOT NULL,
  status           text        NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING', 'DISPUTED', 'CONFIRMED')),
  created_by_role  text        NOT NULL CHECK (created_by_role IN ('DRIVER', 'PARENT')),
  created_by       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  last_action_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_action_role text        CHECK (last_action_role IN ('DRIVER', 'PARENT')),
  memo             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.payments IS '입금 기록. PENDING→DISPUTED→CONFIRMED 상태 전이. 양방향 합의 필요';

-- payment_events: 입금 상태 변경 이력 (자동 기록)
CREATE TABLE public.payment_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  uuid        NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  actor_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  actor_role  text        NOT NULL CHECK (actor_role IN ('DRIVER', 'PARENT')),
  action      text        NOT NULL CHECK (action IN ('CREATED', 'DISPUTED', 'RESUBMITTED', 'CONFIRMED')),
  amount      integer,
  memo        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.payment_events IS '입금 상태 변경 이력. payments 트리거로 자동 기록';

-- fuel_records: 주유 내역 (DRIVER 전용)
CREATE TABLE public.fuel_records (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  fueled_at   date        NOT NULL,
  amount      integer     NOT NULL CHECK (amount > 0),
  memo        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- board_posts: 공지 (DRIVER 작성)
CREATE TABLE public.board_posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  school_id   uuid        REFERENCES public.schools(id) ON DELETE SET NULL,
  title       text        NOT NULL,
  content     text        NOT NULL,
  audience    text        NOT NULL DEFAULT 'ALL' CHECK (audience IN ('ALL', 'SCHOOL')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- board_messages: 1:1 채팅 (DRIVER ↔ PARENT)
CREATE TABLE public.board_messages (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  parent_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  sender_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  content           text        NOT NULL,
  tagged_student_id uuid        REFERENCES public.students(id) ON DELETE SET NULL,
  reply_to_id       uuid        REFERENCES public.board_messages(id) ON DELETE SET NULL,
  is_read           boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.board_messages IS 'DRIVER-PARENT 1:1 채팅. reply_to_id 원본 삭제 시 SET NULL';

-- notifications: 알림
CREATE TABLE public.notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind        text        NOT NULL CHECK (kind IN (
                'PAYMENT_CONFIRM_REQUEST',
                'PAYMENT_DISPUTE',
                'PAYMENT_CONFIRMED',
                'BOARD_REPLY',
                'BOARD_NOTICE'
              )),
  ref_id      uuid,
  ref_table   text,
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.notifications IS 'ref_table로 ref_id 대상 테이블 구분';

-- auth_login_audit: 로그인 이력
CREATE TABLE public.auth_login_audit (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  login_id    text,
  role        text,
  success     boolean     NOT NULL,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

-- updated_at 자동 갱신
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TRIGGER trg_fuel_records_updated_at
  BEFORE UPDATE ON public.fuel_records
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE TRIGGER trg_board_posts_updated_at
  BEFORE UPDATE ON public.board_posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- payments: driver_id 자동 세팅 (PARENT가 INSERT할 때 위변조 방지)
CREATE OR REPLACE FUNCTION public.tg_payments_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id uuid;
  v_actor_role text;
BEGIN
  -- driver_id를 학생 정보에서 강제 세팅
  SELECT driver_id INTO v_driver_id FROM public.students WHERE id = NEW.student_id;
  IF v_driver_id IS NULL THEN
    RAISE EXCEPTION 'student not found: %', NEW.student_id;
  END IF;
  NEW.driver_id := v_driver_id;

  -- created_by, created_by_role 검증
  NEW.created_by := auth.uid();
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
  NEW.created_by_role := v_actor_role;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_before_insert
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payments_before_insert();

-- payments: 상태 전이 검증 + payment_events 자동 기록
CREATE OR REPLACE FUNCTION public.tg_payments_state_machine()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_role text;
  v_action     text;
BEGIN
  SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();

  -- 상태 전이 규칙 검증
  IF OLD.status = 'CONFIRMED' THEN
    RAISE EXCEPTION '확정된 입금은 변경할 수 없습니다.';
  END IF;

  IF OLD.status = 'PENDING' AND NEW.status NOT IN ('DISPUTED', 'CONFIRMED') THEN
    RAISE EXCEPTION 'PENDING 상태에서는 DISPUTED 또는 CONFIRMED로만 전이 가능합니다.';
  END IF;

  IF OLD.status = 'DISPUTED' AND NEW.status NOT IN ('PENDING', 'CONFIRMED') THEN
    RAISE EXCEPTION 'DISPUTED 상태에서는 PENDING 또는 CONFIRMED로만 전이 가능합니다.';
  END IF;

  -- last_action 기록
  NEW.last_action_by := auth.uid();
  NEW.last_action_role := v_actor_role;

  -- 전이 action 결정
  IF OLD.status = 'PENDING' AND NEW.status = 'DISPUTED' THEN
    v_action := 'DISPUTED';
  ELSIF OLD.status = 'DISPUTED' AND NEW.status = 'PENDING' THEN
    v_action := 'RESUBMITTED';
  ELSIF NEW.status = 'CONFIRMED' THEN
    v_action := 'CONFIRMED';
  ELSE
    v_action := 'RESUBMITTED';
  END IF;

  -- payment_events 자동 기록
  INSERT INTO public.payment_events (payment_id, actor_id, actor_role, action, amount, memo)
  VALUES (NEW.id, auth.uid(), v_actor_role, v_action, NEW.amount, NEW.memo);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payments_state_machine
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.tg_payments_state_machine();

-- payments INSERT 후 payment_events CREATED 기록
CREATE OR REPLACE FUNCTION public.tg_payments_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.payment_events (payment_id, actor_id, actor_role, action, amount, memo)
  VALUES (NEW.id, NEW.created_by, NEW.created_by_role, 'CREATED', NEW.amount, NEW.memo);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_payments_after_insert
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payments_after_insert();

-- =============================================================================
-- 5. 역할 헬퍼 함수 (SECURITY DEFINER)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'DRIVER'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_parent()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'PARENT'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_school(p_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.schools
    WHERE id = p_school_id AND owner_driver_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE id = p_student_id AND driver_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_parent_of_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_parents
    WHERE student_id = p_student_id AND parent_profile_id = auth.uid()
  );
$$;

-- 실효 이용금액: 학교 default_fee 우선, 없으면 학생 custom_fee
CREATE OR REPLACE FUNCTION public.effective_fee_for_student(p_student_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    CASE
      WHEN sc.default_fee IS NOT NULL AND sc.default_fee > 0 THEN sc.default_fee
      ELSE COALESCE(s.custom_fee, 0)
    END
  FROM public.students s
  LEFT JOIN public.schools sc ON sc.id = s.school_id
  WHERE s.id = p_student_id;
$$;

-- =============================================================================
-- 6. RLS 활성화
-- =============================================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_parents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_login_audit   ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. RLS 정책
-- =============================================================================

-- ── profiles ──────────────────────────────────────────────────────────────────
-- 자신의 프로필 조회
CREATE POLICY "profiles: self read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- DRIVER는 자신의 학생의 학부모 프로필 조회 가능
CREATE POLICY "profiles: driver reads parent profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_driver() AND
    EXISTS (
      SELECT 1 FROM public.student_parents sp
      JOIN public.students s ON s.id = sp.student_id
      WHERE sp.parent_profile_id = profiles.id
        AND s.driver_id = auth.uid()
    )
  );

-- PARENT는 자녀의 DRIVER 프로필 조회 가능 (설정 화면 "버스기사 전화")
CREATE POLICY "profiles: parent reads driver profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_parent() AND
    EXISTS (
      SELECT 1 FROM public.student_parents sp
      JOIN public.students s ON s.id = sp.student_id
      WHERE sp.parent_profile_id = auth.uid()
        AND s.driver_id = profiles.id
    )
  );

-- 자신의 프로필 수정
CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- profiles INSERT: consume_invite_token RPC 내부에서만 (SECURITY DEFINER)
CREATE POLICY "profiles: insert via rpc only"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ── schools ───────────────────────────────────────────────────────────────────
CREATE POLICY "schools: driver crud own"
  ON public.schools FOR ALL
  USING (owner_driver_id = auth.uid());

CREATE POLICY "schools: parent read linked"
  ON public.schools FOR SELECT
  USING (
    public.is_parent() AND
    EXISTS (
      SELECT 1 FROM public.student_parents sp
      JOIN public.students s ON s.id = sp.student_id
      WHERE sp.parent_profile_id = auth.uid()
        AND s.school_id = schools.id
    )
  );

-- ── students ──────────────────────────────────────────────────────────────────
CREATE POLICY "students: driver crud own"
  ON public.students FOR ALL
  USING (driver_id = auth.uid());

CREATE POLICY "students: parent read own children"
  ON public.students FOR SELECT
  USING (
    public.is_parent() AND
    EXISTS (
      SELECT 1 FROM public.student_parents
      WHERE student_id = students.id AND parent_profile_id = auth.uid()
    )
  );

-- ── student_parents ───────────────────────────────────────────────────────────
CREATE POLICY "student_parents: driver read"
  ON public.student_parents FOR SELECT
  USING (
    public.is_driver() AND
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_parents.student_id AND driver_id = auth.uid()
    )
  );

CREATE POLICY "student_parents: parent read own"
  ON public.student_parents FOR SELECT
  USING (parent_profile_id = auth.uid());

-- INSERT는 RPC(consume_invite_token) 또는 DRIVER가 직접 수행
CREATE POLICY "student_parents: driver insert"
  ON public.student_parents FOR INSERT
  WITH CHECK (
    public.is_driver() AND
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_parents.student_id AND driver_id = auth.uid()
    )
  );

CREATE POLICY "student_parents: driver delete"
  ON public.student_parents FOR DELETE
  USING (
    public.is_driver() AND
    EXISTS (
      SELECT 1 FROM public.students
      WHERE id = student_parents.student_id AND driver_id = auth.uid()
    )
  );

-- ── invite_tokens ─────────────────────────────────────────────────────────────
CREATE POLICY "invite_tokens: driver crud own"
  ON public.invite_tokens FOR ALL
  USING (created_by = auth.uid());

-- anon이 토큰 소비 시 존재 여부 확인용 (consume_invite_token RPC가 SECURITY DEFINER로 처리)
CREATE POLICY "invite_tokens: anon read valid"
  ON public.invite_tokens FOR SELECT
  TO anon
  USING (used_at IS NULL AND expires_at > now());

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE POLICY "payments: driver crud own"
  ON public.payments FOR ALL
  USING (driver_id = auth.uid());

CREATE POLICY "payments: parent read own children"
  ON public.payments FOR SELECT
  USING (
    public.is_parent() AND
    public.is_parent_of_student(student_id)
  );

CREATE POLICY "payments: parent insert own children"
  ON public.payments FOR INSERT
  WITH CHECK (
    public.is_parent() AND
    public.is_parent_of_student(student_id)
  );

CREATE POLICY "payments: parent update status (dispute)"
  ON public.payments FOR UPDATE
  USING (
    public.is_parent() AND
    public.is_parent_of_student(student_id) AND
    status IN ('PENDING', 'DISPUTED')
  );

-- ── payment_events ────────────────────────────────────────────────────────────
CREATE POLICY "payment_events: driver read own"
  ON public.payment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_events.payment_id AND p.driver_id = auth.uid()
    )
  );

CREATE POLICY "payment_events: parent read own children"
  ON public.payment_events FOR SELECT
  USING (
    public.is_parent() AND
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_events.payment_id
        AND public.is_parent_of_student(p.student_id)
    )
  );

-- ── fuel_records ──────────────────────────────────────────────────────────────
CREATE POLICY "fuel_records: driver crud own"
  ON public.fuel_records FOR ALL
  USING (driver_id = auth.uid());

-- ── board_posts ───────────────────────────────────────────────────────────────
CREATE POLICY "board_posts: driver crud own"
  ON public.board_posts FOR ALL
  USING (driver_id = auth.uid());

CREATE POLICY "board_posts: parent read linked school"
  ON public.board_posts FOR SELECT
  USING (
    public.is_parent() AND (
      audience = 'ALL' OR
      (audience = 'SCHOOL' AND EXISTS (
        SELECT 1 FROM public.student_parents sp
        JOIN public.students s ON s.id = sp.student_id
        WHERE sp.parent_profile_id = auth.uid()
          AND s.school_id = board_posts.school_id
      ))
    )
  );

-- ── board_messages ────────────────────────────────────────────────────────────
CREATE POLICY "board_messages: driver read own conversations"
  ON public.board_messages FOR ALL
  USING (driver_id = auth.uid());

CREATE POLICY "board_messages: parent read own conversations"
  ON public.board_messages FOR ALL
  USING (parent_id = auth.uid());

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE POLICY "notifications: user read own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications: user update own (mark read)"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ── auth_login_audit ──────────────────────────────────────────────────────────
CREATE POLICY "auth_login_audit: admin only"
  ON public.auth_login_audit FOR ALL
  USING (public.is_admin());

-- anon INSERT 허용 (로그인 시도 기록)
CREATE POLICY "auth_login_audit: anon insert"
  ON public.auth_login_audit FOR INSERT
  TO anon
  WITH CHECK (true);

-- =============================================================================
-- 8. RPC 함수
-- =============================================================================

-- 초대 토큰 소비 + profiles 생성
-- 사용 흐름:
--   1. 클라이언트: supabase.auth.signUp({ email, password }) → auth.uid() 획득
--   2. 클라이언트: supabase.rpc('consume_invite_token', {...}) 호출
CREATE OR REPLACE FUNCTION public.consume_invite_token(
  p_token      text,
  p_login_id   text,
  p_full_name  text,
  p_phone      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_token_row  public.invite_tokens%ROWTYPE;
  v_profile_id uuid := auth.uid();
  v_result     jsonb;
BEGIN
  -- 인증 확인
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'auth_required' USING ERRCODE = 'P0001';
  END IF;

  -- 토큰 잠금 (경쟁 방지)
  SELECT * INTO v_token_row
  FROM public.invite_tokens
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'token_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_token_row.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'token_already_used' USING ERRCODE = 'P0003';
  END IF;

  IF v_token_row.expires_at < now() THEN
    RAISE EXCEPTION 'token_expired' USING ERRCODE = 'P0004';
  END IF;

  -- profiles 생성
  INSERT INTO public.profiles (id, role, login_id, full_name, phone)
  VALUES (v_profile_id, v_token_row.role, p_login_id, p_full_name, p_phone);

  -- PARENT이고 target_student_id가 있으면 자녀 바인딩
  IF v_token_row.role = 'PARENT' AND v_token_row.target_student_id IS NOT NULL THEN
    INSERT INTO public.student_parents (student_id, parent_profile_id)
    VALUES (v_token_row.target_student_id, v_profile_id)
    ON CONFLICT (student_id, parent_profile_id) DO NOTHING;
  END IF;

  -- 토큰 소진 처리
  UPDATE public.invite_tokens
  SET used_at = now(), used_by = v_profile_id
  WHERE id = v_token_row.id;

  v_result := jsonb_build_object(
    'profile_id', v_profile_id,
    'role', v_token_row.role
  );

  RETURN v_result;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'login_id_taken' USING ERRCODE = '23505';
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_invite_token(text, text, text, text)
  TO anon, authenticated;

-- =============================================================================
-- 9. 인덱스
-- =============================================================================

-- profiles
CREATE INDEX idx_profiles_role ON public.profiles (role);

-- schools
CREATE INDEX idx_schools_owner ON public.schools (owner_driver_id);

-- students
CREATE INDEX idx_students_driver_active ON public.students (driver_id, is_active);
CREATE INDEX idx_students_school_active  ON public.students (school_id, is_active);

-- student_parents
CREATE INDEX idx_student_parents_parent ON public.student_parents (parent_profile_id);

-- invite_tokens
CREATE INDEX idx_invite_tokens_creator ON public.invite_tokens (created_by, used_at);

-- payments
CREATE INDEX idx_payments_driver_date   ON public.payments (driver_id, paid_at DESC);
CREATE INDEX idx_payments_student_date  ON public.payments (student_id, paid_at DESC);
CREATE INDEX idx_payments_status        ON public.payments (status) WHERE status <> 'CONFIRMED';

-- payment_events
CREATE INDEX idx_payment_events_payment ON public.payment_events (payment_id, created_at);

-- fuel_records
CREATE INDEX idx_fuel_records_driver ON public.fuel_records (driver_id, fueled_at DESC);

-- board_posts
CREATE INDEX idx_board_posts_driver  ON public.board_posts (driver_id, created_at DESC);
CREATE INDEX idx_board_posts_school  ON public.board_posts (school_id, created_at DESC);

-- board_messages
CREATE INDEX idx_board_messages_conv ON public.board_messages (driver_id, parent_id, created_at DESC);
CREATE INDEX idx_board_messages_reply ON public.board_messages (reply_to_id);

-- notifications
CREATE INDEX idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- =============================================================================
-- 완료
-- =============================================================================
