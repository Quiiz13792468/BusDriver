-- 학부모 게시글 답변 알림 테이블
-- 관리자가 학부모 게시글에 댓글을 달면 알림 생성

CREATE TABLE IF NOT EXISTS board_notifications (
  id          uuid PRIMARY KEY,
  receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 알림 수신자 (학부모)
  post_id     uuid NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  comment_id  uuid REFERENCES board_comments(id) ON DELETE CASCADE, -- 어떤 댓글로 인한 알림인지
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_board_notifications_receiver ON board_notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_board_notifications_post     ON board_notifications(post_id);
