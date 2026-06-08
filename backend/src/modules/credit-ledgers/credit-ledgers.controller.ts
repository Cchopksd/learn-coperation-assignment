import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StaffRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditLedgersService } from './credit-ledgers.service';
import { ListCreditLedgersDto } from './dto/list-credit-ledgers.dto';

@Controller('credit-ledgers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditLedgersController {
  constructor(private readonly creditLedgersService: CreditLedgersService) {}

  @Get()
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF)
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() query: ListCreditLedgersDto,
  ) {
    return this.creditLedgersService.findAll(user, query);
  }
}
