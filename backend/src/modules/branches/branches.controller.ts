import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StaffRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(StaffRole.HQ_STAFF)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user, dto);
  }

  @Get()
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findAll(@CurrentUser() user: RequestUser) {
    return this.branchesService.findAll(user);
  }

  @Get(':id')
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.branchesService.findOne(user, id);
  }
}
