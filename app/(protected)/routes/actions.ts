"use server";

import crypto from 'node:crypto';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getRoutePath, type DirectionsStop } from '@/lib/kakao-directions';

import { requireSession } from '@/lib/auth/session';
import { assignStudentToRoute, createRoute, deleteRoute, updateRoute } from '@/lib/data/route';
import { updateStudent } from '@/lib/data/student';
import { restInsert, restPatch, restDelete } from '@/lib/supabase/rest';

type ActionResponse = {
  status: 'success' | 'error';
  message: string;
};

export async function createRouteAction(_prev: ActionResponse | undefined, formData: FormData): Promise<ActionResponse> {
  await requireSession('ADMIN');
  const schoolId = formData.get('schoolId');
  const name = formData.get('name');
  const stopsRaw = (formData.get('stops') as string) || '';
  if (typeof schoolId !== 'string' || typeof name !== 'string' || !name.trim()) {
    return { status: 'error', message: '입력값을 확인해주세요.' };
  }
  const stops = stopsRaw
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  await createRoute({ schoolId, name: name.trim(), stops });
  revalidateTag('routes');
  revalidatePath('/routes');
  return { status: 'success', message: '노선이 생성되었습니다.' };
}

export async function updateRouteAction(id: string, data: { name?: string; stops?: string[] }) {
  await requireSession('ADMIN');
  await updateRoute(id, data);
  revalidateTag('routes');
  revalidatePath('/routes');
}

export async function deleteRouteAction(id: string) {
  await requireSession('ADMIN');
  await deleteRoute(id);
  revalidateTag('routes');
  revalidatePath('/routes');
}

export async function assignStudentToRouteAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession('ADMIN');
  const studentId = formData.get('studentId');
  const routeId = (formData.get('routeId') as string) || '';
  const pickupPoint = (formData.get('pickupPoint') as string) || '';
  if (typeof studentId !== 'string') {
    return { status: 'error', message: '입력값을 확인해주세요.' };
  }
  await assignStudentToRoute(studentId, routeId || null);
  await updateStudent(studentId, { pickupPoint: pickupPoint || null });
  revalidateTag('routes');
  revalidateTag('students');
  revalidatePath('/routes');
  return { status: 'success', message: '배정이 완료되었습니다.' };
}

export async function assignStudentsBulkToRouteAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession('ADMIN');
  const routeId = (formData.get('routeId') as string) || '';
  const pickupPoint = (formData.get('pickupPoint') as string) || '';
  const idsRaw = (formData.get('studentIds') as string) || '';
  const ids: string[] = idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return { status: 'error', message: '학생을 선택해주세요.' };
  await Promise.all(
    ids.map((id) =>
      assignStudentToRoute(id, routeId || null)
        .then(() => updateStudent(id, { pickupPoint: pickupPoint || null }))
    )
  );
  revalidateTag('routes');
  revalidateTag('students');
  revalidatePath('/routes');
  return { status: 'success', message: '일괄 배정이 완료되었습니다.' };
}

export async function reorderRouteStops(routeId: string, stops: Array<{ id: string; position: number }>) {
  await requireSession('ADMIN');
  if (!routeId || !routeId.trim()) {
    throw new Error('routeId is required');
  }
  // route 소속 검증 후 병렬 업데이트
  await Promise.all(
    stops.map((stop) =>
      restPatch('route_stops', { id: stop.id, route_id: routeId }, { position: stop.position })
    )
  );
  revalidatePath(`/routes/${routeId}`);
}

export async function addRouteStop(routeId: string, data: { name: string; lat: number; lng: number; position: number; description?: string }) {
  await requireSession('ADMIN');
  if (!routeId || !routeId.trim()) {
    throw new Error('routeId is required');
  }
  const id = crypto.randomUUID();
  await restInsert('route_stops', [{
    id,
    route_id: routeId,
    name: data.name,
    lat: data.lat,
    lng: data.lng,
    position: data.position,
    description: data.description ?? null,
  }]);
  revalidatePath(`/routes/${routeId}`);
  return id;
}

export async function deleteRouteStop(routeId: string, stopId: string) {
  await requireSession('ADMIN');
  if (!routeId || !routeId.trim()) {
    throw new Error('routeId is required');
  }
  if (!stopId || !stopId.trim()) {
    throw new Error('stopId is required');
  }
  await restDelete('route_stops', { id: stopId });
  revalidatePath(`/routes/${routeId}`);
}

export async function updateRouteStop(stopId: string, routeId: string, data: { name?: string; lat?: number; lng?: number; description?: string }) {
  await requireSession('ADMIN');
  if (!stopId || !stopId.trim()) {
    throw new Error('stopId is required');
  }
  if (!routeId || !routeId.trim()) {
    throw new Error('routeId is required');
  }
  await restPatch('route_stops', { id: stopId }, data);
  revalidatePath(`/routes/${routeId}`);
}

export async function saveRouteStopsAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession('ADMIN');
  const routeId = formData.get('routeId');
  const stopsRaw = formData.get('stops');
  if (typeof routeId !== 'string' || typeof stopsRaw !== 'string') {
    return { status: 'error', message: '입력값을 확인해주세요.' };
  }
  let stops: string[] = [];
  try {
    const parsed = JSON.parse(stopsRaw) as string[];
    stops = parsed.map((s) => s.trim()).filter(Boolean);
  } catch {
    return { status: 'error', message: '정차 지점 데이터 형식이 올바르지 않습니다.' };
  }
  await updateRoute(routeId, { stops });
  revalidateTag('routes');
  revalidatePath(`/routes/${routeId}`);
  revalidatePath('/routes');
  return { status: 'success', message: '정차 지점을 저장했습니다.' };
}

export async function getRoutePathAction(stops: DirectionsStop[]): Promise<{ lat: number; lng: number }[]> {
  return getRoutePath(stops);
}
