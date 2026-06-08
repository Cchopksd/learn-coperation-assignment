import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
