import { CompensationStatus, CompensationType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListCompensationsDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsEnum(CompensationStatus)
  status?: CompensationStatus;

  @IsOptional()
  @IsEnum(CompensationType)
  type?: CompensationType;
}
