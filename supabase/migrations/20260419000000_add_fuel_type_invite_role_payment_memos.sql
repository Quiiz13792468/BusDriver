-- =============================================================================
-- 마이그레이션: fuel_type/price_per_liter, invite target_role, payment_memos
-- =============================================================================

-- 1. fuel_records에 유종(fuel_type) + 리터당가격(price_per_liter) 컬럼 추가
ALTER TABLE public.fuel_records
  ADD COLUMN IF NOT EXISTS fuel_type      text CHECK (fuel_type IN ('GASOLINE', 'DIESEL')),
  ADD COLUMN IF NOT EXISTS price_per_liter integer;

-- 2. invite_tokens에 target_role 컬럼 추가 (이미 있으면 skip)
ALTER TABLE public.invite_tokens
  ADD COLUMN IF NOT EXISTS target_role text
    CHECK (target_role IN ('DRIVER', 'PARENT'))
    DEFAULT 'PARENT';

-- 3. payment_memos 테이블 신규 생성
CREATE TABLE IF NOT EXISTS public.payment_memos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id   uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  sender_role  text NOT NULL CHECK (sender_role IN ('DRIVER', 'PARENT')),
  sender_name  text NOT NULL,
  content      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_memos_payment
  ON public.payment_memos (payment_id, created_at);

-- RLS 활성화
ALTER TABLE public.payment_memos ENABLE ROW LEVEL SECURITY;

-- DRIVER: 자신이 담당하는 학생의 결제에 대한 메모 read/write
CREATE POLICY payment_memos_driver_read ON public.payment_memos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.payments p
      JOIN public.students s ON s.id = p.student_id
      WHERE p.id = payment_memos.payment_id
        AND s.driver_id = auth.uid()
    )
  );

CREATE POLICY payment_memos_driver_insert ON public.payment_memos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.payments p
      JOIN public.students s ON s.id = p.student_id
      WHERE p.id = payment_memos.payment_id
        AND s.driver_id = auth.uid()
    )
    AND sender_role = 'DRIVER'
  );

-- PARENT: 자신의 자녀 결제에 대한 메모 read/write
CREATE POLICY payment_memos_parent_read ON public.payment_memos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.payments p
      JOIN public.student_parents sp ON sp.student_id = p.student_id
      WHERE p.id = payment_memos.payment_id
        AND sp.parent_profile_id = auth.uid()
    )
  );

CREATE POLICY payment_memos_parent_insert ON public.payment_memos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.payments p
      JOIN public.student_parents sp ON sp.student_id = p.student_id
      WHERE p.id = payment_memos.payment_id
        AND sp.parent_profile_id = auth.uid()
    )
    AND sender_role = 'PARENT'
  );

-- =============================================================================
-- 완료
-- =============================================================================
