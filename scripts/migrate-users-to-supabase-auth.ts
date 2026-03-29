/**
 * Migration script: custom users table -> Supabase Auth
 *
 * Prerequisites:
 *   - Run migrations/2026_03_29_link_users_to_auth.sql on your Supabase project first
 *   - Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Run: npx tsx scripts/migrate-users-to-supabase-auth.ts
 *
 * This script is IDEMPOTENT - safe to re-run.
 *
 * ROLLBACK:
 *   - If migration fails, auth_user_id column in users table will have NULLs
 *   - NextAuth continues working until auth_user_id is populated
 *   - To rollback completely: ALTER TABLE users DROP COLUMN auth_user_id;
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Minimal dotenv loader (no dotenv package dependency)
function loadDotenv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_\.]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let [, key, val] = m as unknown as [string, string, string];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {}
}

loadDotenv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

interface LegacyUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  password_hash: string;
  role: 'ADMIN' | 'PARENT';
  auth_user_id: string | null;
}

async function migrateUsers() {
  console.log('=== BusDriver: Migrating users to Supabase Auth ===\n');

  // 1. Fetch all legacy users
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, email, name, phone, password_hash, role, auth_user_id');

  if (fetchError) {
    console.error('Failed to fetch users:', fetchError.message);
    process.exit(1);
  }

  const legacyUsers = users as LegacyUser[];
  console.log(`Found ${legacyUsers.length} users to migrate\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of legacyUsers) {
    // Skip already-migrated users (idempotent)
    if (user.auth_user_id) {
      console.log(`  SKIP     ${user.email} (already migrated: ${user.auth_user_id})`);
      skipped++;
      continue;
    }

    try {
      // Note: the original bcrypt password_hash cannot be transferred to Supabase Auth.
      // A random temporary password is assigned; users must reset via "Forgot password".
      const tempPassword =
        Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) +
        Math.random().toString(36).toUpperCase().slice(2);

      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
          legacy_id: user.id,
          phone: user.phone
        }
      });

      if (createError) {
        // User already exists in auth.users - link by email lookup
        if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
          console.log(`  EXISTS   ${user.email} - linking by email lookup`);
          const { data: existingList, error: listError } = await supabase.auth.admin.listUsers();
          if (listError) {
            console.error(`  FAILED   ${user.email}: could not list auth users: ${listError.message}`);
            failed++;
            continue;
          }
          const existing = existingList?.users?.find(u => u.email === user.email);
          if (!existing) {
            console.error(`  FAILED   ${user.email}: exists in auth but could not find by email`);
            failed++;
            continue;
          }
          const { error: updateError } = await supabase
            .from('users')
            .update({ auth_user_id: existing.id })
            .eq('id', user.id);
          if (updateError) {
            console.error(`  FAILED   ${user.email}: update auth_user_id failed: ${updateError.message}`);
            failed++;
            continue;
          }
          console.log(`  LINKED   ${user.email} -> ${existing.id}`);
          migrated++;
          continue;
        }

        console.error(`  FAILED   ${user.email}: ${createError.message}`);
        failed++;
        continue;
      }

      // Link the newly-created auth user back to the legacy row
      const { error: updateError } = await supabase
        .from('users')
        .update({ auth_user_id: authData.user.id })
        .eq('id', user.id);

      if (updateError) {
        console.error(`  FAILED   ${user.email}: update auth_user_id failed: ${updateError.message}`);
        // The auth user was created but not linked - log the auth ID for manual recovery
        console.error(`           Auth user created: ${authData.user.id} - link manually if needed`);
        failed++;
        continue;
      }

      console.log(`  MIGRATED ${user.email} -> ${authData.user.id} (role: ${user.role})`);
      migrated++;
    } catch (err) {
      console.error(`  ERROR    ${user.email}:`, err);
      failed++;
    }
  }

  console.log('\n=== Migration Summary ===');
  console.log(`  Migrated : ${migrated}`);
  console.log(`  Skipped  : ${skipped} (already done)`);
  console.log(`  Failed   : ${failed}`);

  if (failed > 0) {
    console.log('\nWARNING: Some users failed. Re-run this script to retry failed users.');
    console.log('Failed users still have auth_user_id = NULL and remain on NextAuth until retried.');
    process.exit(1);
  }

  console.log('\nMigration complete!');
  console.log('\nNEXT STEPS:');
  console.log('1. Send password reset emails to all migrated users via Supabase Dashboard');
  console.log('   (Authentication -> Users -> select user -> Send password reset)');
  console.log('2. Apply updated RLS policies: migrations/supabase_policies.sql');
  console.log('3. Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local for client-side auth');
}

migrateUsers().catch((err) => {
  console.error(err);
  process.exit(1);
});
