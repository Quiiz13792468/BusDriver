"use server";

import { revalidatePath } from 'next/cache';

import { requireSession } from '@/lib/auth/session';
import { assignStudentToRoute, createRoute, deleteRoute, updateRoute } from '@/lib/data/route';
import { updateStudent } from '@/lib/data/student';

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
  revalidatePath('/routes');
  return { status: 'success', message: '노선이 생성되었습니다.' };
}

export async function updateRouteAction(id: string, data: { name?: string; stops?: string[] }) {
  await requireSession('ADMIN');
  await updateRoute(id, data);
  revalidatePath('/routes');
}

export async function deleteRouteAction(id: string) {
  await requireSession('ADMIN');
  await deleteRoute(id);
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
  for (const id of ids) {
    // eslint-disable-next-line no-await-in-loop
    await assignStudentToRoute(id, routeId || null);
    await updateStudent(id, { pickupPoint: pickupPoint || null });
  }
  revalidatePath('/routes');
  return { status: 'success', message: '일괄 배정이 완료되었습니다.' };
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
  revalidatePath(`/routes/${routeId}`);
  revalidatePath('/routes');
  return { status: 'success', message: '정차 지점을 저장했습니다.' };
}

