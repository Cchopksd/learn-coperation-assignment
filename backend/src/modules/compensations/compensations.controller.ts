import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StaffRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompensationsService } from './compensations.service';
import { ListCompensationsDto } from './dto/list-compensations.dto';
import { UpdateCompensationStatusDto } from './dto/update-compensation-status.dto';

@Controller('compensations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompensationsController {
  constructor(private readonly compensationsService: CompensationsService) {}

  @Get()
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF)
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() query: ListCompensationsDto,
  ) {
    return this.compensationsService.findAll(user, query);
  }

  @Patch(':id/status')
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF)
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCompensationStatusDto,
  ) {
    return this.compensationsService.updateStatus(user, id, dto);
  }
}
