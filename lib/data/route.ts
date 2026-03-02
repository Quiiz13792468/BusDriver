import 'server-only';

import crypto from 'node:crypto';

import type { RouteRecord, RouteStopRecord, StudentRecord } from '@/lib/data/types';
import { getStudentsBySchool, updateStudent } from '@/lib/data/student';
import { supaEnabled, restSelect, restInsert, restPatch, restDelete } from '@/lib/supabase/rest';

function ensureSupabase() {
  if (!supaEnabled()) {
    throw new Error('Supabase is not configured.');
  }
}

export async function createRoute(input: { schoolId: string; name: string; stops: string[] }) {
  ensureSupabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await restInsert('routes', [{ id, school_id: input.schoolId, name: input.name, created_at: now, updated_at: now }]);
  const stops = input.stops.map((name, idx) => ({ id: crypto.randomUUID(), route_id: id, name, position: idx }));
  if (stops.length) await restInsert('route_stops', stops);
  return (await getRouteById(id))!;
}

export async function updateRoute(id: string, patch: Partial<{ name: string; stops: string[] }>) {
  ensureSupabase();
  const current = await getRouteById(id);
  if (!current) throw new Error('Route not found');
  const now = new Date().toISOString();
  if (patch.name) await restPatch('routes', { id }, { name: patch.name, updated_at: now });
  if (patch.stops) {
    // Preserve existing coords when stop names match (e.g. on reorder)
    const coordsByName = new Map<string, { lat: number | null; lng: number | null }>();
    for (const s of current.stopRecords) {
      coordsByName.set(s.name, { lat: s.lat, lng: s.lng });
    }
    await restDelete('route_stops', { route_id: id });
    const rows = patch.stops.map((name, idx) => {
      const c = coordsByName.get(name);
      return { id: crypto.randomUUID(), route_id: id, name, position: idx, lat: c?.lat ?? null, lng: c?.lng ?? null };
    });
    if (rows.length) await restInsert('route_stops', rows);
  }
  return (await getRouteById(id))!;
}

export async function updateStopCoords(stopId: string, lat: number, lng: number): Promise<void> {
  ensureSupabase();
  await restPatch('route_stops', { id: stopId }, { lat, lng });
}

export async function deleteRoute(id: string) {
  ensureSupabase();
  const current = await getRouteById(id);
  if (!current) return;
  await restDelete('route_stops', { route_id: id });
  await restDelete('routes', { id });
}

export async function getRouteById(id: string) {
  ensureSupabase();
  const rows = await restSelect<any>('routes', { id }, { limit: 1 });
  const r = rows[0];
  if (!r) return null;
  const stops = await restSelect<any>('route_stops', { route_id: id }, { order: 'position.asc' });
  const stopRecords: RouteStopRecord[] = stops.map((s) => ({
    id: s.id,
    routeId: id,
    name: s.name,
    position: s.position,
    lat: s.lat ?? null,
    lng: s.lng ?? null,
    description: s.description ?? null,
  }));
  const rec: RouteRecord = { id: r.id, schoolId: r.school_id, name: r.name, stops: stops.map((s) => s.name), stopRecords, createdAt: r.created_at, updatedAt: r.updated_at };
  return rec;
}

export async function getRoutesBySchool(schoolId: string): Promise<RouteRecord[]> {
  ensureSupabase();
  const rows = await restSelect<any>('routes', { school_id: schoolId }, { order: 'name.asc', next: { tags: ['routes'] } });
  return Promise.all(rows.map(async (r) => {
    const stops = await restSelect<any>('route_stops', { route_id: r.id }, { order: 'position.asc', next: { tags: ['routes'] } });
    const stopRecords: RouteStopRecord[] = stops.map((s) => ({
      id: s.id,
      routeId: r.id,
      name: s.name,
      position: s.position,
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      description: s.description ?? null,
    }));
    return { id: r.id, schoolId: r.school_id, name: r.name, stops: stops.map((s) => s.name), stopRecords, createdAt: r.created_at, updatedAt: r.updated_at };
  }));
}

export async function getStudentsByRoute(routeId: string): Promise<StudentRecord[]> {
  const route = await getRouteById(routeId);
  if (!route) return [];
  const students = await getStudentsBySchool(route.schoolId);
  return students.filter((s) => s.routeId === routeId);
}

export async function assignStudentToRoute(studentId: string, routeId: string | null) {
  const route = routeId ? await getRouteById(routeId) : null;
  await updateStudent(studentId, { routeId });
  if (!route) return;
}
