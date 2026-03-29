"use server";

import { revalidatePath, revalidateTag } from 'next/cache';

import { requireSession } from '@/lib/auth/session';
import { createAlert, createRouteChangeAlert, resolveAlert } from '@/lib/data/alert';
import { createBoardPost } from '@/lib/data/board';
import { recordPayment } from '@/lib/data/payment';
import { getStudentById, getStudentsByIds, updateStudent } from '@/lib/data/student';
import type { PaymentStatus } from '@/lib/data/types';

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
  if (!student) {
    return { status: 'error', message: '학생 정보를 찾을 수 없습니다.' };
  }
  // 소유 확인: 해당 학생이 요청한 학부모의 자녀인지 검증
  if (student.parentUserId !== session.id) {
    return { status: 'error', message: '권한이 없습니다.' };
  }
  const studentName = student.name;
  const parentName = session.name ?? '학부모';
  const monthLabel = String(month).padStart(2, '0');
  const alertMessage = `${studentName}학생의 학부모${parentName}가 ${year}-${monthLabel}월 입금확인요청했습니다.`;

  await createAlert({
    studentId,
    schoolId,
    year,
    month,
    type: 'PAYMENT',
    createdBy: session.id,
    memo: alertMessage
  });

  await createBoardPost({
    title: `${year}년 ${monthLabel}월 입금 확인 요청`,
    content: alertMessage,
    authorId: session.id,
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
  revalidateTag('alerts');
}

export async function changePickupPointAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  const session = await requireSession('PARENT');

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
  // 소유 확인: 해당 학생이 요청한 학부모의 자녀인지 검증
  if (current.parentUserId !== session.id) {
    return { status: 'error', message: '권한이 없습니다.' };
  }

  await updateStudent(studentId, { pickupPoint: routeId ? (pickupPoint || null) : null, routeId });
  await createRouteChangeAlert({
    studentId,
    schoolId,
    createdBy: session.id,
    before: current.pickupPoint,
    after: pickupPoint
  });

  revalidateTag('students');
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

  // 배치 조회로 N+1 해결
  const allStudents = await getStudentsByIds(studentIds);
  const studentMap = new Map(allStudents.map(s => [s.id, s]));

  const posts = studentIds.flatMap((studentId) => {
    const student = studentMap.get(studentId);
    if (!student || !student.parentUserId) return [];
    const monthLabel = String(month).padStart(2, '0');
    const message = `${student.name}학생의 ${year}년 ${monthLabel}월 입금 확인 요청입니다. 미납 금액을 확인 후 입금 부탁드립니다.`;
    return [createBoardPost({
      title: `${year}년 ${monthLabel}월 입금 확인 요청`,
      content: message,
      authorId: session.id,
      schoolId: student.schoolId,
      parentOnly: true,
      targetParentId: student.parentUserId
    })];
  });
  await Promise.allSettled(posts);

  revalidatePath('/board');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/shortages');

  return { status: 'success', message: SHORTAGE_REQUEST_MESSAGE };
}

export async function quickRecordPayment(input: {
  studentId: string;
  schoolId: string;
  amount: number;
  targetYear: number;
  targetMonth: number;
  status: PaymentStatus;
  memo: string | null;
}) {
  await requireSession('ADMIN');
  await recordPayment(input);
  revalidatePath('/dashboard');
  revalidatePath('/payments');
}
