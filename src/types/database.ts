export type Role = 'ADMIN' | 'DRIVER' | 'PARENT'
export type RideType = 'MORNING' | 'AFTERNOON' | 'BOTH'
export type PaymentStatus = 'PENDING' | 'DISPUTED' | 'CONFIRMED'
export type PaymentActor = 'DRIVER' | 'PARENT'
export type PaymentAction = 'CREATED' | 'DISPUTED' | 'RESUBMITTED' | 'CONFIRMED'
export type BoardAudience = 'ALL' | 'SCHOOL'
export type NotificationKind =
  | 'PAYMENT_CONFIRM_REQUEST'
  | 'PAYMENT_DISPUTE'
  | 'PAYMENT_CONFIRMED'
  | 'BOARD_REPLY'
  | 'BOARD_NOTICE'

export interface Profile {
  id: string
  role: Role
  login_id: string
  full_name: string
  phone: string | null
  created_at: string
  updated_at: string
}

export interface School {
  id: string
  owner_driver_id: string
  name: string
  default_fee: number
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  driver_id: string
  school_id: string | null
  name: string
  phone: string | null
  parent_name: string | null
  parent_phone: string | null
  ride_type: RideType
  start_date: string | null
  end_date: string | null
  payment_day: number | null
  custom_fee: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StudentParent {
  student_id: string
  parent_profile_id: string
  linked_at: string
}

export interface InviteToken {
  id: string
  token: string
  role: 'DRIVER' | 'PARENT'
  created_by: string
  target_student_id: string | null
  expires_at: string
  used_at: string | null
  used_by: string | null
  created_at: string
}

export interface Payment {
  id: string
  student_id: string
  driver_id: string
  amount: number
  paid_at: string
  status: PaymentStatus
  created_by_role: PaymentActor
  created_by: string
  last_action_by: string | null
  last_action_role: PaymentActor | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface PaymentEvent {
  id: string
  payment_id: string
  actor_id: string
  actor_role: PaymentActor
  action: PaymentAction
  amount: number | null
  memo: string | null
  created_at: string
}

export interface FuelRecord {
  id: string
  driver_id: string
  fueled_at: string
  amount: number
  memo: string | null
  created_at: string
  updated_at: string
}

export interface BoardPost {
  id: string
  driver_id: string
  school_id: string | null
  title: string
  content: string
  audience: BoardAudience
  created_at: string
  updated_at: string
}

export interface BoardMessage {
  id: string
  driver_id: string
  parent_id: string
  sender_id: string
  content: string
  tagged_student_id: string | null
  reply_to_id: string | null
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  kind: NotificationKind
  ref_id: string | null
  ref_table: string | null
  is_read: boolean
  created_at: string
}

// ── 조회용 확장 타입 ─────────────────────────────────────────────────────────

export interface StudentWithSchool extends Student {
  school: Pick<School, 'id' | 'name' | 'default_fee'> | null
}

export interface PaymentWithStudent extends Payment {
  student: Pick<Student, 'id' | 'name'>
}

export interface BoardMessageWithSender extends BoardMessage {
  sender: Pick<Profile, 'id' | 'full_name' | 'role'>
  tagged_student: Pick<Student, 'id' | 'name'> | null
  reply_to: Pick<BoardMessage, 'id' | 'content' | 'sender_id'> | null
}
