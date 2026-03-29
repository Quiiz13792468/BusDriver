import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Service role client - bypasses RLS. Use only for admin server actions.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Helper: run a function with admin privileges
 * Usage: const result = await withAdmin(client => client.from('users').select());
 */
export async function withAdmin<T>(
  fn: (client: ReturnType<typeof createAdminClient>) => Promise<T>
): Promise<T> {
  const client = createAdminClient();
  return fn(client);
}
