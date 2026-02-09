import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요.'),
  password: z.string().min(6, '6자 이상 비밀번호를 입력해주세요.'),
  role: z.enum(['ADMIN', 'PARENT'], {
    errorMap: () => ({ message: '역할을 선택해주세요.' })
  })
});

export const schoolFormSchema = z.object({
  name: z.string().min(1, '학교명을 입력해주세요.'),
  address: z.string().optional().or(z.literal('')),
  defaultMonthlyFee: z
    .number({ invalid_type_error: '숫자를 입력해주세요.' })
    .int()
    .nonnegative('0 이상 금액을 입력해주세요.')
    .optional(),
  note: z.string().optional().or(z.literal(''))
});

export const studentFormSchema = z.object({
  schoolId: z.string().uuid().optional().or(z.literal('')),
  name: z.string().min(1, '학생 이름을 입력해주세요.'),
  guardianName: z.string().min(1, '보호자 이름을 입력해주세요.'),
  phone: z.string().optional().or(z.literal('')),
  homeAddress: z.string().optional().or(z.literal('')),
  pickupPoint: z.string().optional().or(z.literal('')),
  routeId: z.string().uuid().optional().or(z.literal('')),
  emergencyContact: z.string().optional().or(z.literal('')),
  feeAmount: z
    .number({ invalid_type_error: '숫자를 입력해주세요.' })
    .int()
    .nonnegative('0 이상 금액을 입력해주세요.')
    .optional(),
  depositDay: z
    .number({ invalid_type_error: '숫자를 입력해주세요.' })
    .int('정수를 입력해주세요.')
    .min(1)
    .max(31)
    .optional(),
  notes: z.string().optional().or(z.literal(''))
});

export const studentUpdateSchema = studentFormSchema.extend({
  studentId: z.string().uuid(),
  suspendedAt: z.string().optional().or(z.literal(''))
});

export const studentAssignSchema = z.object({
  studentId: z.string().uuid(),
  schoolId: z.string().uuid()
});

export const studentUnassignSchema = z.object({
  studentId: z.string().uuid(),
  schoolId: z.string().uuid()
});

export const paymentRecordSchema = z.object({
  studentId: z.string().uuid(),
  schoolId: z.string().uuid(),
  amount: z
    .number({ invalid_type_error: '숫자를 입력해주세요.' })
    .int('정수를 입력해주세요.')
    .nonnegative('0 이상 금액을 입력해주세요.'),
  targetYear: z.number().min(2000).max(2100),
  targetMonth: z.number().min(1).max(12),
  status: z.enum(['PAID', 'PENDING', 'PARTIAL']),
  paidAt: z.date().optional().nullable(),
  memo: z.string().optional().or(z.literal(''))
});

export const boardPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  content: z.string().min(1, '내용을 입력해주세요.'),
  schoolId: z.string().uuid().optional().or(z.literal('')),
  parentOnly: z.boolean().optional()
});

export const commentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1, '댓글 내용을 입력해주세요.'),
  parentCommentId: z.string().uuid().optional()
});

export const signupSchema = z
  .object({
    email: z.string().email('올바른 이메일을 입력해주세요.'),
    name: z.string().min(1, '사용자 이름을 입력해주세요.'),
    password: z.string().min(6, '6자 이상 비밀번호를 입력해주세요.'),
    role: z.enum(['ADMIN', 'PARENT'], { errorMap: () => ({ message: '역할을 선택해주세요.' }) }),
    adminEmail: z.string().email('담당 기사님(관리자) 이메일을 입력해주세요.').optional(),
    studentName: z.string().min(1, '학생 이름을 입력해주세요.').optional(),
    studentPhone: z.string().min(1, '학생 전화번호를 입력해주세요.').optional(),
    parentPhone: z.string().min(1, '학부모 전화번호를 입력해주세요.').optional()
  })
  .refine((v) => (v.role === 'PARENT' ? !!v.adminEmail : true), {
    message: '학부모는 담당 기사님(관리자) 이메일이 필요합니다.',
    path: ['adminEmail']
  })
  .refine((v) => (v.role === 'PARENT' ? !!v.studentName : true), {
    message: '학부모는 학생 이름이 필요합니다.',
    path: ['studentName']
  })
  .refine((v) => (v.role === 'PARENT' ? !!v.studentPhone : true), {
    message: '학부모는 학생 전화번호가 필요합니다.',
    path: ['studentPhone']
  })
  .refine((v) => (v.role === 'PARENT' ? !!v.parentPhone : true), {
    message: '학부모는 학부모 전화번호가 필요합니다.',
    path: ['parentPhone']
  })
  .refine((v) => (v.role === 'ADMIN' ? !v.studentName && !v.studentPhone && !v.parentPhone : true), {
    message: '관리자는 학생/학부모 정보를 입력할 수 없습니다.',
    path: ['studentName']
  });
