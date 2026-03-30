export type Role = 'ADMIN' | 'PARENT';

export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
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

export type RouteStopRecord = {
  id: string;
  routeId: string;
  name: string;
  position: number;
  lat: number | null;
  lng: number | null;
  description: string | null;
};

export type RouteRecord = {
  id: string;
  schoolId: string;
  name: string;
  stops: string[];
  stopRecords: RouteStopRecord[];
  createdAt: string;
  updatedAt: string;
};

export interface PaymentSummary {
  studentId: string;
  year: number;
  month: number;
  effectiveFee: number; // school fee if set, else student fee
  totalPaid: number;    // cumulative sum
  shortage: number;     // effectiveFee - totalPaid (min 0)
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  payments: PaymentRecord[];
}

export interface School {
  id: string;
  name: string;
  address?: string | null;
  defaultMonthlyFee: number; // 0 means use student fee
  adminUserId?: string | null;
}
