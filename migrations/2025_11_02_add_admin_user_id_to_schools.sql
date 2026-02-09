alter table if exists schools
  add column if not exists admin_user_id uuid references users(id) on delete set null;

create index if not exists idx_schools_admin_user on schools(admin_user_id);
