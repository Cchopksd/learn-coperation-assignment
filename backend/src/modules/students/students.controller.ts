import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StaffRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdjustStudentCreditDto } from './dto/adjust-student-credit.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentsService } from './students.service';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(user, dto);
  }

  @Get()
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findAll(@CurrentUser() user: RequestUser) {
    return this.studentsService.findAll(user);
  }

  @Get(':id')
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.studentsService.findOne(user, id);
  }

  @Post(':id/credits')
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF)
  adjustCredit(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AdjustStudentCreditDto,
  ) {
    return this.studentsService.adjustCredit(user, id, dto);
  }

  @Get(':id/ledger')
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findLedger(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.studentsService.findLedger(user, id);
  }

  @Get(':id/compensations')
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findCompensations(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.studentsService.findCompensations(user, id);
  }
}
