"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { recordPayment } from "@/lib/data/payment";
import { createSchool, deleteSchool, updateSchool } from "@/lib/data/school";
import { createStudent, getStudentsBySchool, updateStudent } from "@/lib/data/student";
import {
  paymentRecordSchema,
  schoolFormSchema,
  studentAssignSchema,
  studentFormSchema,
  studentUnassignSchema,
  studentUpdateSchema
} from "@/lib/validation";

type ActionResponse = {
  status: "success" | "error";
  message: string;
};

const INPUT_ERROR_MESSAGE = "입력값을 확인해주세요.";
const SCHOOL_CREATED_MESSAGE = "학교가 생성되었습니다.";
const STUDENT_CREATED_MESSAGE = "학생이 추가되었습니다.";
const PAYMENT_RECORDED_MESSAGE = "입금 기록이 저장되었습니다.";
const STUDENT_UPDATED_MESSAGE = "학생 정보가 업데이트되었습니다.";
const STUDENT_ASSIGNED_MESSAGE = "학생이 배정되었습니다.";
const STUDENT_UNASSIGNED_MESSAGE = "학생 배정을 해제했습니다.";
const SCHOOL_UPDATED_MESSAGE = "학교 정보가 업데이트되었습니다.";
const SCHOOL_DELETED_MESSAGE = "학교가 삭제되었습니다.";
const SCHOOL_DELETE_BLOCKED_MESSAGE = "등록된 학생이 있어 학교를 삭제할 수 없습니다.";

export async function createSchoolAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession("ADMIN");

  const raw = {
    name: formData.get("name"),
    address: (formData.get("address") as string) || undefined,
    defaultMonthlyFee: formData.get("defaultMonthlyFee"),
    note: (formData.get("note") as string) || undefined
  } as const;

  const parsed = schoolFormSchema.safeParse({
    ...raw,
    defaultMonthlyFee:
      raw.defaultMonthlyFee && raw.defaultMonthlyFee !== ""
        ? Number(raw.defaultMonthlyFee)
        : undefined
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? INPUT_ERROR_MESSAGE
    };
  }

  await createSchool(parsed.data);
  revalidatePath("/schools");
  return { status: "success", message: SCHOOL_CREATED_MESSAGE };
}

export async function updateSchoolAction(
  id: string,
  data: {
    defaultMonthlyFee?: number;
    note?: string | null;
  }
) {
  await requireSession("ADMIN");
  await updateSchool(id, data);
  revalidatePath(`/schools/${id}`);
}

export async function updateSchoolFormAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession("ADMIN");

  const raw = {
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    address: (formData.get("address") as string) || undefined,
    defaultMonthlyFee: formData.get("defaultMonthlyFee"),
    note: (formData.get("note") as string) || undefined
  } as const;

  const parsed = schoolFormSchema.safeParse({
    name: raw.name,
    address: raw.address,
    defaultMonthlyFee:
      raw.defaultMonthlyFee && raw.defaultMonthlyFee !== ""
        ? Number(raw.defaultMonthlyFee)
        : undefined,
    note: raw.note
  });

  if (!parsed.success || !raw.schoolId || typeof raw.schoolId !== "string") {
    return {
      status: "error",
      message: parsed.success ? INPUT_ERROR_MESSAGE : parsed.error.errors[0]?.message ?? INPUT_ERROR_MESSAGE
    };
  }

  await updateSchool(raw.schoolId, {
    name: parsed.data.name,
    address: parsed.data.address ?? null,
    defaultMonthlyFee: parsed.data.defaultMonthlyFee ?? 0,
    note: parsed.data.note ?? null
  });

  revalidatePath("/schools");
  revalidatePath(`/schools/${raw.schoolId}`);
  return { status: "success", message: SCHOOL_UPDATED_MESSAGE };
}

export async function deleteSchoolAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession("ADMIN");
  const schoolId = formData.get("schoolId");
  if (!schoolId || typeof schoolId !== "string") {
    return { status: "error", message: INPUT_ERROR_MESSAGE };
  }

  const students = await getStudentsBySchool(schoolId);
  if (students.length > 0) {
    return { status: "error", message: SCHOOL_DELETE_BLOCKED_MESSAGE };
  }

  await deleteSchool(schoolId);
  revalidatePath("/schools");
  revalidatePath("/routes");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { status: "success", message: SCHOOL_DELETED_MESSAGE };
}

export async function createStudentAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession("ADMIN");

  const raw = {
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    guardianName: formData.get("guardianName"),
    phone: (formData.get("phone") as string) || undefined,
    homeAddress: (formData.get("homeAddress") as string) || undefined,
    pickupPoint: (formData.get("pickupPoint") as string) || undefined,
    routeId: (formData.get("routeId") as string) || undefined,
    emergencyContact: (formData.get("emergencyContact") as string) || undefined,
    feeAmount: formData.get("feeAmount"),
    depositDay: formData.get("depositDay"),
    notes: (formData.get("notes") as string) || undefined
  } as const;

  const parsed = studentFormSchema.safeParse({
    ...raw,
    feeAmount:
      raw.feeAmount && raw.feeAmount !== "" ? Number(raw.feeAmount) : undefined,
    depositDay: raw.depositDay && raw.depositDay !== "" ? Number(raw.depositDay) : undefined
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? INPUT_ERROR_MESSAGE
    };
  }

  const schoolId = parsed.data.schoolId ? String(parsed.data.schoolId) : null;
  await createStudent({ ...parsed.data, schoolId });
  if (schoolId) {
    revalidatePath(`/schools/${schoolId}`);
  } else {
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard");
  }
  return { status: "success", message: STUDENT_CREATED_MESSAGE };
}

export async function updateStudentStatusAction(
  studentId: string,
  schoolId: string,
  params: { isActive: boolean; suspendedAt?: Date | null }
) {
  await requireSession("ADMIN");
  await updateStudent(studentId, params);
  revalidatePath(`/schools/${schoolId}`);
}

export async function assignStudentToSchoolAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession("ADMIN");

  const parsed = studentAssignSchema.safeParse({
    studentId: formData.get("studentId"),
    schoolId: formData.get("schoolId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? INPUT_ERROR_MESSAGE
    };
  }

  await updateStudent(parsed.data.studentId, {
    schoolId: parsed.data.schoolId,
    routeId: null,
    pickupPoint: null
  });

  revalidatePath(`/schools/${parsed.data.schoolId}`);
  revalidatePath("/dashboard/students");
  return { status: "success", message: STUDENT_ASSIGNED_MESSAGE };
}

export async function unassignStudentFromSchoolAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession("ADMIN");

  const parsed = studentUnassignSchema.safeParse({
    studentId: formData.get("studentId"),
    schoolId: formData.get("schoolId")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? INPUT_ERROR_MESSAGE
    };
  }

  await updateStudent(parsed.data.studentId, {
    schoolId: null,
    routeId: null,
    pickupPoint: null
  });

  revalidatePath(`/schools/${parsed.data.schoolId}`);
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard");
  return { status: "success", message: STUDENT_UNASSIGNED_MESSAGE };
}

export async function recordPaymentAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession("ADMIN");

  const paidAtRaw = formData.get("paidAt");
  const paidAtParsed = typeof paidAtRaw === "string" ? parseDateInput(paidAtRaw) : null;
  if (paidAtRaw && !paidAtParsed) {
    return {
      status: "error",
      message: "입금 일자를 올바르게 입력해주세요."
    };
  }

  const baseDate = paidAtParsed ?? new Date();

  const raw = {
    studentId: formData.get("studentId"),
    schoolId: formData.get("schoolId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
    targetYear: baseDate.getFullYear(),
    targetMonth: baseDate.getMonth() + 1,
    paidAt: formData.get("status") === "PENDING" ? null : paidAtParsed ?? null,
    memo: (formData.get("memo") as string) || undefined
  } as const;

  const parsed = paymentRecordSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
    status: raw.status
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? INPUT_ERROR_MESSAGE
    };
  }

  if (parsed.data.amount > 0 && parsed.data.status === "PENDING") {
    return {
      status: "error",
      message: "미입금은 입금 금액이 0원일 때만 선택할 수 있습니다."
    };
  }

  await recordPayment(parsed.data);
  revalidatePath(`/schools/${parsed.data.schoolId}`);
  revalidatePath("/payments");
  return { status: "success", message: PAYMENT_RECORDED_MESSAGE };
}

function parseDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("-");
  if (parts.length !== 3) return null;
  const [yearRaw, monthRaw, dayRaw] = parts;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return candidate;
}

export async function updateStudentInfoAction(
  _prev: ActionResponse | undefined,
  formData: FormData
): Promise<ActionResponse> {
  await requireSession("ADMIN");

  const raw = {
    studentId: formData.get("studentId"),
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    guardianName: formData.get("guardianName"),
    phone: (formData.get("phone") as string) || undefined,
    homeAddress: (formData.get("homeAddress") as string) || undefined,
    pickupPoint: (formData.get("pickupPoint") as string) || undefined,
    routeId: (formData.get("routeId") as string) || undefined,
    emergencyContact: (formData.get("emergencyContact") as string) || undefined,
    feeAmount: formData.get("feeAmount"),
    suspendedAt: (formData.get("suspendedAt") as string) || undefined,
    depositDay: formData.get("depositDay"),
    notes: (formData.get("notes") as string) || undefined
  } as const;

  const parsed = studentUpdateSchema.safeParse({
    ...raw,
    feeAmount:
      raw.feeAmount && raw.feeAmount !== "" ? Number(raw.feeAmount) : undefined,
    depositDay: raw.depositDay && raw.depositDay !== "" ? Number(raw.depositDay) : undefined
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.errors[0]?.message ?? INPUT_ERROR_MESSAGE
    };
  }

  const { studentId, schoolId, suspendedAt, routeId, pickupPoint, depositDay, ...rest } = parsed.data as any;
  await updateStudent(studentId, {
    ...rest,
    routeId: routeId && String(routeId).length > 0 ? routeId : null,
    pickupPoint: routeId && String(routeId).length > 0 ? (pickupPoint || null) : null,
    depositDay: depositDay ?? null,
    suspendedAt: suspendedAt ? new Date(suspendedAt) : null
  });
  if (schoolId) {
    revalidatePath(`/schools/${schoolId}`);
  } else {
    revalidatePath("/dashboard/students");
  }
  return { status: "success", message: STUDENT_UPDATED_MESSAGE };
}
