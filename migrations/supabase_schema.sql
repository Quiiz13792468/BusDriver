-- Supabase (PostgreSQL) schema for Bus project
-- Enums
create type role_enum as enum ('ADMIN','PARENT');
create type payment_status as enum ('PENDING','PAID','PARTIAL');
create type alert_type as enum ('PAYMENT','INQUIRY','ROUTE_CHANGE');
create type alert_status as enum ('PENDING','RESOLVED');

-- Users
create table if not exists users (
  id uuid primary key,
  email text not null unique,
  name text,
  phone text,
  password_hash text not null,
  role role_enum not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- Parent profile
create table if not exists parent_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  address text,
  student_name text,
  student_phone text,
  admin_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- Schools
create table if not exists schools (
  id uuid primary key,
  name text not null,
  address text,
  default_monthly_fee integer not null default 0,
  note text,
  admin_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- Routes
create table if not exists routes (
  id uuid primary key,
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

-- Route stops (ordered)
create table if not exists route_stops (
  id uuid primary key,
  route_id uuid not null references routes(id) on delete cascade,
  name text not null,
  position integer not null
);
create index if not exists idx_route_stops_route_pos on route_stops(route_id, position);

-- Students
create table if not exists students (
  id uuid primary key,
  school_id uuid references schools(id) on delete restrict,
  parent_user_id uuid references users(id) on delete set null,
  name text not null,
  guardian_name text not null,
  phone text,
  home_address text,
  pickup_point text,
  route_id uuid references routes(id) on delete set null,
  emergency_contact text,
  fee_amount integer not null default 0,
  deposit_day integer,
  is_active boolean not null default true,
  suspended_at timestamptz,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
create index if not exists idx_students_school on students(school_id);
create index if not exists idx_students_parent on students(parent_user_id);
create index if not exists idx_students_route on students(route_id);

-- Payments
create table if not exists payments (
  id text primary key,
  student_id uuid not null references students(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  amount integer not null,
  target_year integer not null,
  target_month integer not null,
  status payment_status not null,
  paid_at timestamptz,
  memo text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
create index if not exists idx_payments_student on payments(student_id);
create index if not exists idx_payments_school_month on payments(school_id, target_year, target_month);

-- Board posts
create table if not exists board_posts (
  id uuid primary key,
  title text not null,
  content text not null,
  author_id uuid not null references users(id) on delete set null,
  school_id uuid references schools(id) on delete set null,
  target_parent_id uuid references users(id) on delete set null,
  parent_only boolean not null default true,
  locked boolean not null default false,
  view_count integer not null default 0,
  comment_count integer not null default 0,
  last_comment_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
create index if not exists idx_board_posts_school on board_posts(school_id);

-- Board comments
create table if not exists board_comments (
  id uuid primary key,
  post_id uuid not null references board_posts(id) on delete cascade,
  author_id uuid not null references users(id) on delete set null,
  content text not null,
  parent_comment_id uuid references board_comments(id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null
);
create index if not exists idx_board_comments_post on board_comments(post_id);

-- Alerts
create table if not exists alerts (
  id uuid primary key,
  student_id uuid not null references students(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  year integer not null,
  month integer not null,
  type alert_type not null,
  status alert_status not null,
  created_by uuid not null references users(id) on delete set null,
  memo text,
  created_at timestamptz not null
);
create index if not exists idx_alerts_school_month on alerts(school_id, year, month);

-- Safe backfill for existing deployments
alter table if exists users add column if not exists name text;
alter table if exists users add column if not exists phone text;
alter table if exists parent_profiles add column if not exists student_name text;
alter table if exists parent_profiles add column if not exists student_phone text;
alter table if exists board_posts add column if not exists target_parent_id uuid references users(id) on delete set null;
alter table if exists board_posts add column if not exists view_count integer default 0;
alter table if exists board_posts add column if not exists comment_count integer default 0;
alter table if exists board_posts add column if not exists last_comment_at timestamptz;
