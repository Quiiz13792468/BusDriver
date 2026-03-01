-- 학부모 초대 토큰 테이블
-- 관리자가 발급하는 1회용 가입 링크 관리

CREATE TABLE IF NOT EXISTS invite_tokens (
  id         uuid PRIMARY KEY,
  token      text NOT NULL UNIQUE,         -- URL에 사용되는 랜덤 토큰
  admin_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used       boolean NOT NULL DEFAULT false,
  used_by    uuid REFERENCES users(id) ON DELETE SET NULL, -- 가입한 학부모 ID
  used_at    timestamptz,
  expires_at timestamptz NOT NULL,         -- 생성 후 24시간 또는 7일
  created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_token    ON invite_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_admin_id ON invite_tokens(admin_id);
