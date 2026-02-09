import fs from 'node:fs';
import path from 'node:path';

// Minimal dotenv loader
function loadDotenv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_\.]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let [, key, val] = m as unknown as [string, string, string];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {}
}

loadDotenv();

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

async function httpUpsert(table: string, rows: any[], onConflict: string) {
  if (!rows.length) return;
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  } as any);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed upsert ${table}: ${res.status} ${res.statusText} - ${text}`);
  }
}

function parseCsv(file: string) {
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ''));
    rows.push(obj);
  }
  return { headers, rows };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQ = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

function toInt(v: string) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function toBool(v: string) {
  if (!v) return null;
  return /^true$/i.test(v);
}

function toNull(v: string) {
  return v === '' ? null : v;
}

function readIfExists(file: string) {
  const p = path.resolve(process.cwd(), file);
  return fs.existsSync(p) ? p : null;
}

async function main() {
  const order: Array<{ file: string; table: string; onConflict: string; map: (r: any) => any }> = [
    {
      file: 'export/users.csv',
      table: 'users',
      onConflict: 'id',
      map: (r) => ({
        id: r.id,
        email: r.email,
        name: toNull(r.name),
        phone: toNull(r.phone),
        password_hash: r.password_hash,
        role: r.role,
        created_at: r.created_at,
        updated_at: r.updated_at
      })
    },
    {
      file: 'export/parent_profiles.csv',
      table: 'parent_profiles',
      onConflict: 'user_id',
      map: (r) => ({
        user_id: r.user_id,
        address: toNull(r.address),
        admin_user_id: toNull(r.admin_user_id),
        created_at: r.created_at,
        updated_at: r.updated_at
      })
    },
    {
      file: 'export/schools.csv',
      table: 'schools',
      onConflict: 'id',
      map: (r) => ({
        id: r.id,
        name: r.name,
        address: toNull(r.address),
        default_monthly_fee: toInt(r.default_monthly_fee),
        note: toNull(r.note),
        admin_user_id: toNull(r.admin_user_id),
        created_at: r.created_at,
        updated_at: r.updated_at
      })
    },
    {
      file: 'export/routes.csv',
      table: 'routes',
      onConflict: 'id',
      map: (r) => ({
        id: r.id,
        school_id: r.school_id,
        name: r.name,
        created_at: r.created_at,
        updated_at: r.updated_at
      })
    },
    {
      file: 'export/route_stops.csv',
      table: 'route_stops',
      onConflict: 'id',
      map: (r) => ({ id: r.id, route_id: r.route_id, name: r.name, position: toInt(r.position) })
    },
    {
      file: 'export/students.csv',
      table: 'students',
      onConflict: 'id',
      map: (r) => ({
        id: r.id,
        school_id: r.school_id,
        parent_user_id: toNull(r.parent_user_id),
        name: r.name,
        guardian_name: r.guardian_name,
        phone: toNull(r.phone),
        home_address: toNull(r.home_address),
        pickup_point: toNull(r.pickup_point),
        route_id: toNull(r.route_id),
        emergency_contact: toNull(r.emergency_contact),
        fee_amount: toInt(r.fee_amount),
        deposit_day: r.deposit_day === '' ? null : toInt(r.deposit_day),
        is_active: toBool(r.is_active),
        suspended_at: toNull(r.suspended_at),
        notes: toNull(r.notes),
        created_at: r.created_at,
        updated_at: r.updated_at
      })
    },
    {
      file: 'export/payments.csv',
      table: 'payments',
      onConflict: 'id',
      map: (r) => ({
        id: r.id,
        student_id: r.student_id,
        school_id: r.school_id,
        amount: toInt(r.amount),
        target_year: toInt(r.target_year),
        target_month: toInt(r.target_month),
        status: r.status,
        paid_at: toNull(r.paid_at),
        memo: toNull(r.memo),
        created_at: r.created_at ?? r.paid_at ?? null,
        updated_at: r.updated_at ?? r.paid_at ?? null
      })
    },
    {
      file: 'export/board_posts.csv',
      table: 'board_posts',
      onConflict: 'id',
      map: (r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        author_id: r.author_id,
        school_id: toNull(r.school_id),
        parent_only: toBool(r.parent_only),
        locked: toBool(r.locked),
        created_at: r.created_at,
        updated_at: r.updated_at
      })
    },
    {
      file: 'export/board_comments.csv',
      table: 'board_comments',
      onConflict: 'id',
      map: (r) => ({
        id: r.id,
        post_id: r.post_id,
        author_id: r.author_id,
        content: r.content,
        parent_comment_id: toNull(r.parent_comment_id),
        created_at: r.created_at,
        updated_at: r.updated_at
      })
    },
    {
      file: 'export/alerts.csv',
      table: 'alerts',
      onConflict: 'id',
      map: (r) => ({
        id: r.id,
        student_id: r.student_id,
        school_id: r.school_id,
        year: toInt(r.year),
        month: toInt(r.month),
        type: r.type,
        status: r.status,
        created_by: r.created_by,
        memo: toNull(r.memo),
        created_at: r.created_at
      })
    }
  ];

  for (const step of order) {
    const p = readIfExists(step.file);
    if (!p) {
      console.log(`Skip (not found): ${step.file}`);
      continue;
    }
    const { rows } = parseCsv(p);
    if (!rows.length) {
      console.log(`Skip (empty): ${step.file}`);
      continue;
    }
    const mapped = rows.map(step.map);
    console.log(`Upserting ${mapped.length} rows into ${step.table}...`);
    await httpUpsert(step.table, mapped, step.onConflict);
    console.log(`Done: ${step.table}`);
  }

  console.log('Supabase import completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

