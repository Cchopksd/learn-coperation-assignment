import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StaffRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClassSessionsService } from './class-sessions.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';

@Controller('class-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassSessionsController {
  constructor(private readonly classSessionsService: ClassSessionsService) {}

  @Post()
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateClassSessionDto) {
    return this.classSessionsService.create(user, dto);
  }

  @Get()
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findAll(@CurrentUser() user: RequestUser) {
    return this.classSessionsService.findAll(user);
  }

  @Get(':id')
  @Roles(StaffRole.HQ_STAFF, StaffRole.BRANCH_STAFF, StaffRole.TEACHER)
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.classSessionsService.findOne(user, id);
  }
}
