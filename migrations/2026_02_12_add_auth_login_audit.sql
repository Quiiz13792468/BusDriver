create table if not exists auth_login_audit (
  id uuid primary key,
  email text not null,
  role text,
  success boolean not null,
  reason text not null,
  user_id uuid references users(id) on delete set null,
  source text,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_auth_login_audit_occurred_at on auth_login_audit(occurred_at desc);
create index if not exists idx_auth_login_audit_email on auth_login_audit(email);
