import { CreditLedgerReason } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListCreditLedgersDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsEnum(CreditLedgerReason)
  reason?: CreditLedgerReason;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
