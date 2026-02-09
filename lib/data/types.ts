export type Role = 'ADMIN' | 'PARENT';

export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  passwordHash: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type ParentProfileRecord = {
  userId: string;
  address: string | null;
  studentIds: string[];
  studentName?: string | null;
  studentPhone?: string | null;
  adminUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SchoolRecord = {
  id: string;
  name: string;
  address: string | null;
  defaultMonthlyFee: number;
  note: string | null;
  adminUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentRecord = {
  id: string;
  schoolId: string | null;
  parentUserId: string | null;
  name: string;
  guardianName: string;
  phone: string | null;
  homeAddress: string | null;
  pickupPoint: string | null;
  routeId?: string | null;
  emergencyContact: string | null;
  feeAmount: number;
  depositDay?: number | null;
  isActive: boolean;
  suspendedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL';

export type PaymentRecord = {
  id: string;
  studentId: string;
  schoolId: string;
  amount: number;
  targetYear: number;
  targetMonth: number;
  status: PaymentStatus;
  paidAt: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BoardPostRecord = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  schoolId: string | null;
  targetParentId?: string | null;
  parentOnly: boolean;
  locked?: boolean;
  viewCount?: number;
  commentCount?: number;
  lastCommentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BoardCommentRecord = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertType = 'PAYMENT' | 'INQUIRY' | 'ROUTE_CHANGE';

export type AlertRecord = {
  id: string;
  studentId: string;
  schoolId: string;
  year: number;
  month: number;
  type: AlertType;
  status: 'PENDING' | 'RESOLVED';
  createdBy: string;
  memo: string | null;
  createdAt: string;
};

export type RouteRecord = {
  id: string;
  schoolId: string;
  name: string;
  stops: string[];
  createdAt: string;
  updatedAt: string;
};
