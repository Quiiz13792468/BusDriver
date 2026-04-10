-- invite_tokens 테이블에 target_role 컬럼 추가
-- 관리자가 학부모용/버스기사용 링크를 구분해서 발급하기 위함

ALTER TABLE public.invite_tokens
  ADD COLUMN IF NOT EXISTS target_role text NOT NULL DEFAULT 'PARENT';

COMMENT ON COLUMN public.invite_tokens.target_role IS '초대 대상 역할: PARENT(학부모) | DRIVER(버스기사)';
