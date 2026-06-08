import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  classSessionId!: string;

  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
