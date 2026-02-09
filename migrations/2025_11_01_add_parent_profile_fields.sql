alter table if exists users add column if not exists name text;
alter table if exists users add column if not exists phone text;
alter table if exists parent_profiles add column if not exists student_name text;
alter table if exists parent_profiles add column if not exists student_phone text;
