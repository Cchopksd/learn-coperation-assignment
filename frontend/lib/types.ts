// Shared types mirroring the NestJS backend API contracts.
// Keep these in sync with backend Prisma models + service `select` shapes.

export type StaffRole = "HQ_STAFF" | "BRANCH_STAFF" | "TEACHER";

export type AttendanceStatus = "BOOKED" | "ATTEND" | "SKIP" | "ABSENT";

export type CreditLedgerReason =
  | "INITIAL_CREDIT"
  | "MANUAL_ADJUSTMENT"
  | "ATTENDANCE_ATTEND"
  | "ATTENDANCE_ABSENT";

export type CompensationType = "MAKEUP_CLASS" | "SEAT_CREDIT" | "EXTEND_EXPIRY";

export type CompensationStatus = "AVAILABLE" | "USED" | "CANCELLED";

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  branchId: string | null;
  createdById: string | null;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by /auth/login and /auth/me. */
export interface AuthStaff {
  id: string;
  branchId: string | null;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
}

export interface LoginResponse {
  accessToken: string;
  staff: AuthStaff;
}

export interface Student {
  id: string;
  branchId: string;
  name: string;
  email: string | null;
  phone: string | null;
  creditBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSession {
  id: string;
  branchId: string;
  teacherId: string | null;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  bookedSeats: number;
  availableSeats: number;
}

/** Booking shape inside ClassSession detail response. */
export interface SessionBooking {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  bookedAt: string;
  markedAt: string | null;
  note: string | null;
}

export interface ClassSessionDetail extends ClassSession {
  bookings: SessionBooking[];
}

/** Full booking shape returned by POST /bookings and PATCH attendance. */
export interface Booking {
  id: string;
  classSessionId: string;
  studentId: string;
  bookedById: string | null;
  markedById: string | null;
  status: AttendanceStatus;
  bookedAt: string;
  markedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSummary {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export interface SessionSummary {
  id: string;
  title: string;
  startTime: string;
}

export interface BookingSummary {
  id: string;
  status: AttendanceStatus;
  classSession?: SessionSummary | null;
}

export interface CreditLedgerEntry {
  id: string;
  studentId: string;
  bookingId: string | null;
  createdById: string | null;
  amount: number;
  reason: CreditLedgerReason;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  createdBy?: StaffSummary | null;
  student?: { id: string; name: string; branchId: string } | null;
  booking?: BookingSummary | null;
}

export interface Compensation {
  id: string;
  studentId: string;
  bookingId: string;
  type: CompensationType;
  status: CompensationStatus;
  note: string | null;
  usedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; name: string; branchId: string } | null;
  booking?: {
    id: string;
    classSessionId?: string;
    status: AttendanceStatus;
    markedAt?: string | null;
    classSession?: SessionSummary | null;
  } | null;
}

export interface AdjustCreditResponse {
  student: Student;
  ledger: CreditLedgerEntry;
}

// ---- Request payloads ----

export interface CreateBranchInput {
  code: string;
  name: string;
  address?: string;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  branchId?: string;
}

export interface CreateStudentInput {
  branchId: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CreateClassSessionInput {
  branchId: string;
  teacherId?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface AdjustCreditInput {
  amount: number;
  note?: string;
}

export interface CreateBookingInput {
  classSessionId: string;
  studentId: string;
  note?: string;
}

export type FinalAttendanceStatus = "ATTEND" | "SKIP" | "ABSENT";
