/**
 * REST API wrapper using Service Role key.
 * For new code, prefer using createAdminClient() from @/lib/supabase/admin.ts
 * This file is maintained for backward compatibility.
 */
import 'server-only';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function baseUrl(path: string) {
  return `${SUPABASE_URL!.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function supaEnabled() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE);
}

export async function restSelect<T>(table: string, query: Record<string, string | number | null | undefined>, opts?: { order?: string; limit?: number; next?: { revalidate?: number | false; tags?: string[] } }) {
  const params = new URLSearchParams();
  params.set('select', '*');
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (v === null) {
      params.set(k, 'is.null');
    } else {
      params.set(k, `eq.${v}`);
    }
  }
  if (opts?.order) params.set('order', opts.order);
  if (opts?.limit) params.set('limit', String(opts.limit));
  const url = baseUrl(`/rest/v1/${table}?${params.toString()}`);
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json'
    },
    ...(opts?.next ? { next: opts.next } : {})
  });
  if (!res.ok) throw new Error(`Supabase select ${table} failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T[];
}

export async function restCount(
  table: string,
  query: Record<string, string | number | null | undefined>
): Promise<number> {
  const params = new URLSearchParams();
  params.set('select', '*');
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (v === null) {
      params.set(k, 'is.null');
    } else {
      params.set(k, `eq.${v}`);
    }
  }
  params.set('limit', '1');
  const url = baseUrl(`/rest/v1/${table}?${params.toString()}`);
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'count=exact',
      Range: '0-0'
    }
  });
  if (!res.ok) throw new Error(`Supabase count ${table} failed: ${res.status} ${res.statusText}`);
  // Content-Range: 0-0/TOTAL
  const range = res.headers.get('content-range') ?? '';
  const total = parseInt(range.split('/')[1] ?? '0', 10);
  return isNaN(total) ? 0 : total;
}

export async function restSelectPaginated<T>(
  table: string,
  query: Record<string, string | number | null | undefined>,
  page: number,
  pageSize: number,
  opts?: { order?: string; next?: { revalidate?: number | false; tags?: string[] } }
): Promise<{ data: T[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const offset = (page - 1) * pageSize;
  const params = new URLSearchParams();
  params.set('select', '*');
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (v === null) {
      params.set(k, 'is.null');
    } else {
      params.set(k, `eq.${v}`);
    }
  }
  if (opts?.order) params.set('order', opts.order);
  params.set('limit', String(pageSize));
  params.set('offset', String(offset));
  const url = baseUrl(`/rest/v1/${table}?${params.toString()}`);
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'count=exact'
    },
    ...(opts?.next ? { next: opts.next } : {})
  });
  if (!res.ok) throw new Error(`Supabase paginated select ${table} failed: ${res.status} ${res.statusText}`);
  const range = res.headers.get('content-range') ?? '';
  const total = parseInt(range.split('/')[1] ?? '0', 10);
  const safeTotal = isNaN(total) ? 0 : total;
  const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize));
  const data = (await res.json()) as T[];
  return { data, total: safeTotal, page, pageSize, totalPages };
}

export async function restSelectIn<T>(
  table: string,
  field: string,
  values: string[],
  opts?: { next?: { revalidate?: number | false; tags?: string[] } }
): Promise<T[]> {
  if (values.length === 0) return [];
  const params = new URLSearchParams();
  params.set('select', '*');
  params.set(field, `in.(${values.map((v) => `"${v}"`).join(',')})`);
  const url = baseUrl(`/rest/v1/${table}?${params.toString()}`);
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json'
    },
    ...(opts?.next ? { next: opts.next } : {})
  });
  if (!res.ok) throw new Error(`Supabase selectIn ${table} failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T[];
}

export async function restInsert<T>(table: string, rows: T | T[], opts?: { upsert?: boolean; onConflict?: string }) {
  const params = new URLSearchParams();
  if (opts?.upsert) {
    params.set('on_conflict', opts.onConflict ?? 'id');
    // merge-duplicates to upsert
  }
  const url = baseUrl(`/rest/v1/${table}${params.toString() ? `?${params.toString()}` : ''}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert ${table} failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return (await res.json()) as any[];
}

export async function restPatch(table: string, match: Record<string, string>, patch: Record<string, any>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(match)) params.set(k, `eq.${v}`);
  const url = baseUrl(`/rest/v1/${table}?${params.toString()}`);
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(patch)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase patch ${table} failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return (await res.json()) as any[];
}

export async function restDelete(table: string, match: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(match)) params.set(k, `eq.${v}`);
  const url = baseUrl(`/rest/v1/${table}?${params.toString()}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`
    }
  });
  if (!res.ok) throw new Error(`Supabase delete ${table} failed: ${res.status} ${res.statusText}`);
}
