"use server";

import { revalidatePath } from 'next/cache';

import { requireSession } from '@/lib/auth/session';
import { createAlert, createRouteChangeAlert, resolveAlert } from '@/lib/data/alert';
import { createBoardPost } from '@/lib/data/board';
import { getStudentById, updateStudent } from '@/lib/data/student';

type ActionResponse =
  | {
      status: 'success';
      message: string;
    }
  | {
      status: 'error';
      message: string;
    }
  | {
      status: 'idle';
      message: string;
    };

const INPUT_ERROR_MESSAGE = '입력값을 확인해주세요.';
const DATE_ERROR_MESSAGE = '년도 또는 월 정보가 올바르지 않습니다.';
const SUCCESS_MESSAGE = '입금 확인 요청이 접수되었습니다.';
const SHORTAGE_REQUEST_MESSAGE = '입금 확인 요청을 전송했습니다.';

export async function requestPaymentCheckAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  const session = await requireSession('PARENT');
  const user = session.user!;

  const studentId = formData.get('studentId');
  const schoolId = formData.get('schoolId');
  const year = Number(formData.get('year'));
  const month = Number(formData.get('month'));

  if (typeof studentId !== 'string' || typeof schoolId !== 'string') {
    return { status: 'error', message: INPUT_ERROR_MESSAGE };
  }

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return { status: 'error', message: DATE_ERROR_MESSAGE };
  }

  const student = await getStudentById(studentId);
  const studentName = student?.name ?? '학생';
  const parentName = user.name ?? '학부모';
  const monthLabel = String(month).padStart(2, '0');
  const alertMessage = `${studentName}학생의 학부모${parentName}가 ${year}-${monthLabel}월 입금확인요청했습니다.`;

  await createAlert({
    studentId,
    schoolId,
    year,
    month,
    type: 'PAYMENT',
    createdBy: user.id,
    memo: alertMessage
  });

  await createBoardPost({
    title: `${year}년 ${monthLabel}월 입금 확인 요청`,
    content: alertMessage,
    authorId: user.id,
    schoolId,
    parentOnly: true
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/alerts');
  revalidatePath('/board');

  return { status: 'success', message: SUCCESS_MESSAGE };
}

export async function resolveAlertAction(id: string) {
  await requireSession('ADMIN');
  await resolveAlert(id);
  revalidatePath('/dashboard/alerts');
  revalidatePath('/dashboard');
}

export async function changePickupPointAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  const session = await requireSession('PARENT');
  const user = session.user!;

  const studentId = formData.get('studentId');
  const schoolId = formData.get('schoolId');
  const pickupPoint = (formData.get('pickupPoint') as string) || '';
  const routeId = ((formData.get('routeId') as string) || '').trim() || null;

  if (typeof studentId !== 'string' || typeof schoolId !== 'string') {
    return { status: 'error', message: INPUT_ERROR_MESSAGE };
  }

  const current = await getStudentById(studentId);
  if (!current) {
    return { status: 'error', message: '학생 정보를 찾을 수 없습니다.' };
  }

  await updateStudent(studentId, { pickupPoint: routeId ? (pickupPoint || null) : null, routeId });
  await createRouteChangeAlert({
    studentId,
    schoolId,
    createdBy: user.id,
    before: current.pickupPoint,
    after: pickupPoint
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/alerts');

  return { status: 'success', message: '탑승지점을 변경했습니다.' };
}

export async function requestShortagePaymentAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  const session = await requireSession('ADMIN');
  const year = Number(formData.get('year'));
  const month = Number(formData.get('month'));
  const studentIds = formData.getAll('studentIds').filter((v): v is string => typeof v === 'string');

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return { status: 'error', message: DATE_ERROR_MESSAGE };
  }
  if (studentIds.length === 0) {
    return { status: 'error', message: '선택된 학생이 없습니다.' };
  }

  for (const studentId of studentIds) {
    const student = await getStudentById(studentId);
    if (!student || !student.parentUserId) continue;
    const monthLabel = String(month).padStart(2, '0');
    const message = `${student.name}학생의 ${year}년 ${monthLabel}월 입금 확인 요청입니다. 미납 금액을 확인 후 입금 부탁드립니다.`;
    await createBoardPost({
      title: `${year}년 ${monthLabel}월 입금 확인 요청`,
      content: message,
      authorId: session.user!.id,
      schoolId: student.schoolId,
      parentOnly: true,
      targetParentId: student.parentUserId
    });
  }

  revalidatePath('/board');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/shortages');

  return { status: 'success', message: SHORTAGE_REQUEST_MESSAGE };
}
