import type {
  AttendanceStatus,
  CompensationStatus,
  CompensationType,
  StaffRole,
} from "@/lib/types";
import { titleCase } from "@/utils/format";

export type Tone =
  | "neutral"
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-green-100 text-green-800 ring-green-200",
  warning: "bg-amber-100 text-amber-800 ring-amber-200",
  destructive: "bg-red-100 text-red-800 ring-red-200",
  muted: "bg-slate-100 text-slate-400 ring-slate-200",
  info: "bg-blue-100 text-blue-800 ring-blue-200",
};

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}

// Attendance status -> tone per the assignment styling spec.
const ATTENDANCE_TONE: Record<AttendanceStatus, Tone> = {
  BOOKED: "neutral",
  ATTEND: "success",
  SKIP: "warning",
  ABSENT: "destructive",
};

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return <StatusBadge label={titleCase(status)} tone={ATTENDANCE_TONE[status]} />;
}

// Compensation status -> tone.
const COMPENSATION_TONE: Record<CompensationStatus, Tone> = {
  AVAILABLE: "success",
  USED: "muted",
  CANCELLED: "destructive",
};

export function CompensationStatusBadge({
  status,
}: {
  status: CompensationStatus;
}) {
  return (
    <StatusBadge label={titleCase(status)} tone={COMPENSATION_TONE[status]} />
  );
}

export function CompensationTypeBadge({ type }: { type: CompensationType }) {
  return <StatusBadge label={titleCase(type)} tone="info" />;
}

const ROLE_TONE: Record<StaffRole, Tone> = {
  HQ_STAFF: "info",
  BRANCH_STAFF: "neutral",
  TEACHER: "success",
};

export function RoleBadge({ role }: { role: StaffRole }) {
  return <StatusBadge label={titleCase(role)} tone={ROLE_TONE[role]} />;
}
