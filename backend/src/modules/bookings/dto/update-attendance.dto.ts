import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const FINAL_ATTENDANCE_STATUSES = [
  AttendanceStatus.ATTEND,
  AttendanceStatus.SKIP,
  AttendanceStatus.ABSENT,
] as const;

export class UpdateAttendanceDto {
  @IsEnum(FINAL_ATTENDANCE_STATUSES)
  status!: (typeof FINAL_ATTENDANCE_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
