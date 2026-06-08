import { CompensationStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCompensationStatusDto {
  @IsEnum([CompensationStatus.USED, CompensationStatus.CANCELLED])
  status!: CompensationStatus;
}
