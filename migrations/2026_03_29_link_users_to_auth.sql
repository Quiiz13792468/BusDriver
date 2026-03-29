-- Migration: Bridge existing custom users table with Supabase auth.users
-- Run this AFTER Supabase Auth is configured and before running the migration script.

-- Add auth_user_id column to users table for migration bridge
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON public.users(auth_user_id);

-- After migration, this view helps auth lookups
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  u.id as legacy_id,
  u.auth_user_id,
  u.email,
  u.name,
  u.phone,
  u.role,
  u.created_at
FROM public.users u
WHERE u.auth_user_id IS NOT NULL;
