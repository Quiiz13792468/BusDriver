-- RLS 정책 템플릿 (ADMIN/PARENT 역할 기반)
-- 주의: Supabase Auth를 쓰지 않는 경우, 기본 anon/service 키로는 아래 정책의 역할/사용자 식별이 되지 않습니다.
-- supabase-edge 또는 커스텀 JWT(역할, user_id 포함)를 발급해 사용하세요.

-- 공통: RLS 활성화
alter table if exists users enable row level security;
alter table if exists parent_profiles enable row level security;
alter table if exists schools enable row level security;
alter table if exists routes enable row level security;
alter table if exists route_stops enable row level security;
alter table if exists students enable row level security;
alter table if exists payments enable row level security;
alter table if exists board_posts enable row level security;
alter table if exists board_comments enable row level security;
alter table if exists alerts enable row level security;

-- 헬퍼: JWT에서 role/user_id 추출 (Supabase에서는 auth.jwt() 사용 가능)
-- 예: (auth.jwt() ->> 'role') = 'ADMIN'
-- 예: (auth.jwt() ->> 'user_id') = students.parent_user_id

-- ADMIN: 모든 권한 허용
create policy admin_users_all on users
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_parent_profiles_all on parent_profiles
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_schools_all on schools
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_routes_all on routes
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_route_stops_all on route_stops
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_students_all on students
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_payments_all on payments
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_board_posts_all on board_posts
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_board_comments_all on board_comments
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

create policy admin_alerts_all on alerts
  for all using ((auth.jwt() ->> 'role') = 'ADMIN');

-- PARENT: 자신의 데이터만 접근
-- students: parent_user_id가 본인인 행만
create policy parent_students_rw on students
  for select using ((auth.jwt() ->> 'role') = 'PARENT' and (auth.jwt() ->> 'user_id') = parent_user_id)
  with check ((auth.jwt() ->> 'role') = 'PARENT' and (auth.jwt() ->> 'user_id') = parent_user_id);

-- payments: 자녀의 결제만
create policy parent_payments_r on payments
  for select using (
    (auth.jwt() ->> 'role') = 'PARENT' and
    exists (
      select 1 from students s
      where s.id = payments.student_id and s.parent_user_id = (auth.jwt() ->> 'user_id')
    )
  );

-- board_posts: 읽기 전체(또는 학교 제한 필요시 수정), 쓰기는 작성자 = 본인
create policy parent_board_posts_r on board_posts
  for select using ((auth.jwt() ->> 'role') = 'PARENT');

create policy parent_board_posts_w on board_posts
  for insert with check ((auth.jwt() ->> 'role') = 'PARENT' and (auth.jwt() ->> 'user_id') = author_id);

-- board_comments: 읽기 전체, 쓰기는 작성자 = 본인
create policy parent_board_comments_r on board_comments
  for select using ((auth.jwt() ->> 'role') = 'PARENT');

create policy parent_board_comments_w on board_comments
  for insert with check ((auth.jwt() ->> 'role') = 'PARENT' and (auth.jwt() ->> 'user_id') = author_id);

-- alerts: 본인 자녀 관련만 읽기
create policy parent_alerts_r on alerts
  for select using (
    (auth.jwt() ->> 'role') = 'PARENT' and
    exists (
      select 1 from students s
      where s.id = alerts.student_id and s.parent_user_id = (auth.jwt() ->> 'user_id')
    )
  );

-- schools/routes/route_stops: 읽기 허용(필요 시 학교 기준 제한 정책 별도 추가)
create policy parent_schools_r on schools for select using ((auth.jwt() ->> 'role') = 'PARENT');
create policy parent_routes_r on routes for select using ((auth.jwt() ->> 'role') = 'PARENT');
create policy parent_route_stops_r on route_stops for select using ((auth.jwt() ->> 'role') = 'PARENT');

-- anon 차단 예(선택): 모든 테이블에서 anon은 접근 불가
-- revoke all on table ... from anon;  -- 권한 레벨로도 차단 가능

