const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function baseUrl(path: string) {
  return `${SUPABASE_URL!.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function supaEnabled() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE);
}

export async function restSelect<T>(table: string, query: Record<string, string | number | null | undefined>, opts?: { order?: string; limit?: number }) {
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
      apikey: SERVICE_ROLE!,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json'
    }
  } as any);
  if (!res.ok) throw new Error(`Supabase select ${table} failed: ${res.status} ${res.statusText}`);
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
      apikey: SERVICE_ROLE!,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  } as any);
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
      apikey: SERVICE_ROLE!,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(patch)
  } as any);
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
      apikey: SERVICE_ROLE!,
      Authorization: `Bearer ${SERVICE_ROLE}`
    }
  } as any);
  if (!res.ok) throw new Error(`Supabase delete ${table} failed: ${res.status} ${res.statusText}`);
}

