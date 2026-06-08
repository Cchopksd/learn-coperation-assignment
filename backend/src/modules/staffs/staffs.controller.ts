import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StaffRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { StaffsService } from './staffs.service';

@Controller('staffs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Post()
  @Roles(StaffRole.HQ_STAFF)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateStaffDto) {
    return this.staffsService.create(user, dto);
  }

  @Get()
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findAll(@CurrentUser() user: RequestUser) {
    return this.staffsService.findAll(user);
  }

  @Get(':id')
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.staffsService.findOne(user, id);
  }
}
