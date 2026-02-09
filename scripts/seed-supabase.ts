import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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

async function upsertSchools(rows: any[]) {
  try {
    await httpUpsert('schools', rows, 'id');
  } catch (err: any) {
    const msg = String(err?.message ?? '');
    if (msg.includes('admin_user_id') && msg.includes('schools')) {
      const fallback = rows.map(({ admin_user_id, ...rest }) => rest);
      console.log('schools.admin_user_id column not found, retrying without it...');
      await httpUpsert('schools', fallback, 'id');
      return;
    }
    throw err;
  }
}

async function main() {
  const now = '2025-01-15T09:00:00.000Z';
  const ids = {
    admin: '11111111-1111-1111-1111-111111111111',
    parent1: '22222222-2222-2222-2222-222222222222',
    parent2: '33333333-3333-3333-3333-333333333333',
    school1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    school2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    route1: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    route2: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    stop1: '12121212-1212-1212-1212-121212121212',
    stop2: '13131313-1313-1313-1313-131313131313',
    stop3: '14141414-1414-1414-1414-141414141414',
    stop4: '15151515-1515-1515-1515-151515151515',
    stop5: '16161616-1616-1616-1616-161616161616',
    student1: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    student2: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    student3: '99999999-9999-9999-9999-999999999999',
    post1: 'abababab-abab-abab-abab-abababababab',
    post2: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd',
    comment1: '01010101-0101-0101-0101-010101010101',
    comment2: '02020202-0202-0202-0202-020202020202',
    comment3: '03030303-0303-0303-0303-030303030303',
    alert1: '04040404-0404-0404-0404-040404040404',
    alert2: '05050505-0505-0505-0505-050505050505'
  };

  const adminHash = await bcrypt.hash('admin1234', 10);
  const parentHash = await bcrypt.hash('parent1234', 10);

  const users = [
    {
      id: ids.admin,
      email: 'admin@schoolbus.local',
      name: 'Admin User',
      phone: '010-1000-1000',
      password_hash: adminHash,
      role: 'ADMIN',
      created_at: now,
      updated_at: now
    },
    {
      id: ids.parent1,
      email: 'parent@schoolbus.local',
      name: 'Parent User',
      phone: '010-2000-2000',
      password_hash: parentHash,
      role: 'PARENT',
      created_at: now,
      updated_at: now
    },
    {
      id: ids.parent2,
      email: 'parent2@schoolbus.local',
      name: 'Parent Two',
      phone: '010-3000-3000',
      password_hash: parentHash,
      role: 'PARENT',
      created_at: now,
      updated_at: now
    }
  ];

  const parentProfiles = [
    {
      user_id: ids.parent1,
      address: 'Seoul',
      admin_user_id: ids.admin,
      created_at: now,
      updated_at: now
    },
    {
      user_id: ids.parent2,
      address: 'Incheon',
      admin_user_id: ids.admin,
      created_at: now,
      updated_at: now
    }
  ];

  const schools = [
    {
      id: ids.school1,
      name: 'Sample Elementary',
      address: 'Seoul, Korea',
      default_monthly_fee: 150000,
      note: 'Main district',
      admin_user_id: ids.admin,
      created_at: now,
      updated_at: now
    },
    {
      id: ids.school2,
      name: 'Sample Middle',
      address: 'Incheon, Korea',
      default_monthly_fee: 180000,
      note: 'West district',
      admin_user_id: ids.admin,
      created_at: now,
      updated_at: now
    }
  ];

  const routes = [
    {
      id: ids.route1,
      school_id: ids.school1,
      name: 'Morning Route A',
      created_at: now,
      updated_at: now
    },
    {
      id: ids.route2,
      school_id: ids.school2,
      name: 'Evening Route B',
      created_at: now,
      updated_at: now
    }
  ];

  const routeStops = [
    { id: ids.stop1, route_id: ids.route1, name: 'Main Gate', position: 0 },
    { id: ids.stop2, route_id: ids.route1, name: 'North Gate', position: 1 },
    { id: ids.stop3, route_id: ids.route1, name: 'Library', position: 2 },
    { id: ids.stop4, route_id: ids.route2, name: 'East Gate', position: 0 },
    { id: ids.stop5, route_id: ids.route2, name: 'West Gate', position: 1 }
  ];

  const students = [
    {
      id: ids.student1,
      school_id: ids.school1,
      parent_user_id: ids.parent1,
      name: 'Minsu Kim',
      guardian_name: 'Parent One',
      phone: '010-4000-4000',
      home_address: 'Seoul Mapo-gu',
      pickup_point: 'Main Gate',
      route_id: ids.route1,
      emergency_contact: '010-4111-4111',
      fee_amount: 150000,
      deposit_day: 5,
      is_active: true,
      suspended_at: null,
      notes: 'No allergies',
      created_at: now,
      updated_at: now
    },
    {
      id: ids.student2,
      school_id: ids.school1,
      parent_user_id: ids.parent1,
      name: 'Hana Kim',
      guardian_name: 'Parent One',
      phone: '010-5000-5000',
      home_address: 'Seoul Mapo-gu',
      pickup_point: 'North Gate',
      route_id: ids.route1,
      emergency_contact: '010-5111-5111',
      fee_amount: 150000,
      deposit_day: 10,
      is_active: true,
      suspended_at: null,
      notes: null,
      created_at: now,
      updated_at: now
    },
    {
      id: ids.student3,
      school_id: ids.school2,
      parent_user_id: ids.parent2,
      name: 'Jisoo Park',
      guardian_name: 'Parent Two',
      phone: '010-6000-6000',
      home_address: 'Incheon Bupyeong-gu',
      pickup_point: 'East Gate',
      route_id: ids.route2,
      emergency_contact: '010-6111-6111',
      fee_amount: 180000,
      deposit_day: null,
      is_active: false,
      suspended_at: '2025-02-01T00:00:00.000Z',
      notes: 'Paused until February',
      created_at: now,
      updated_at: now
    }
  ];

  const payments = [
    {
      id: 'pay-2025-01-student1',
      student_id: ids.student1,
      school_id: ids.school1,
      amount: 150000,
      target_year: 2025,
      target_month: 1,
      status: 'PAID',
      paid_at: '2025-01-05T02:00:00.000Z',
      memo: 'Auto transfer',
      created_at: now,
      updated_at: now
    },
    {
      id: 'pay-2025-02-student1',
      student_id: ids.student1,
      school_id: ids.school1,
      amount: 75000,
      target_year: 2025,
      target_month: 2,
      status: 'PARTIAL',
      paid_at: '2025-02-05T02:00:00.000Z',
      memo: 'Half payment',
      created_at: now,
      updated_at: now
    },
    {
      id: 'pay-2025-01-student2',
      student_id: ids.student2,
      school_id: ids.school1,
      amount: 150000,
      target_year: 2025,
      target_month: 1,
      status: 'PENDING',
      paid_at: null,
      memo: 'Awaiting payment',
      created_at: now,
      updated_at: now
    }
  ];

  const boardPosts = [
    {
      id: ids.post1,
      title: 'January Pickup Notice',
      content: 'Bus departs at 7:30 AM. Please arrive 5 minutes early.',
      author_id: ids.admin,
      school_id: ids.school1,
      parent_only: true,
      locked: false,
      created_at: now,
      updated_at: now
    },
    {
      id: ids.post2,
      title: 'Question about pickup point',
      content: 'Can we change the pickup point to the library entrance?',
      author_id: ids.parent1,
      school_id: ids.school1,
      parent_only: true,
      locked: false,
      created_at: now,
      updated_at: now
    }
  ];

  const boardComments = [
    {
      id: ids.comment1,
      post_id: ids.post2,
      author_id: ids.admin,
      content: 'Yes, please confirm with the driver in advance.',
      parent_comment_id: null,
      created_at: now,
      updated_at: now
    },
    {
      id: ids.comment2,
      post_id: ids.post2,
      author_id: ids.parent1,
      content: 'Understood, thank you.',
      parent_comment_id: ids.comment1,
      created_at: now,
      updated_at: now
    },
    {
      id: ids.comment3,
      post_id: ids.post1,
      author_id: ids.parent2,
      content: 'Thanks for the notice.',
      parent_comment_id: null,
      created_at: now,
      updated_at: now
    }
  ];

  const alerts = [
    {
      id: ids.alert1,
      student_id: ids.student2,
      school_id: ids.school1,
      year: 2025,
      month: 1,
      type: 'PAYMENT',
      status: 'PENDING',
      created_by: ids.admin,
      memo: 'Payment confirmation requested',
      created_at: now
    },
    {
      id: ids.alert2,
      student_id: ids.student3,
      school_id: ids.school2,
      year: 2025,
      month: 2,
      type: 'ROUTE_CHANGE',
      status: 'RESOLVED',
      created_by: ids.parent2,
      memo: 'Changed pickup to East Gate',
      created_at: now
    }
  ];

  console.log('Upserting users...');
  await httpUpsert('users', users, 'id');
  console.log('Upserting parent_profiles...');
  await httpUpsert('parent_profiles', parentProfiles, 'user_id');
  console.log('Upserting schools...');
  await upsertSchools(schools);
  console.log('Upserting routes...');
  await httpUpsert('routes', routes, 'id');
  console.log('Upserting route_stops...');
  await httpUpsert('route_stops', routeStops, 'id');
  console.log('Upserting students...');
  await httpUpsert('students', students, 'id');
  console.log('Upserting payments...');
  await httpUpsert('payments', payments, 'id');
  console.log('Upserting board_posts...');
  await httpUpsert('board_posts', boardPosts, 'id');
  console.log('Upserting board_comments...');
  await httpUpsert('board_comments', boardComments, 'id');
  console.log('Upserting alerts...');
  await httpUpsert('alerts', alerts, 'id');

  console.log('Supabase seed completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
