import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';

const STAFF_SELECT = {
  id: true,
  branchId: true,
  createdById: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StaffSelect;

type SafeStaff = Prisma.StaffGetPayload<{
  select: typeof STAFF_SELECT;
}>;

@Injectable()
export class StaffsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: RequestUser, dto: CreateStaffDto) {
    await this.assertEmailIsAvailable(dto.email);
    await this.assertBranchRules(dto);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return await this.prisma.staff.create({
      data: {
        branchId: dto.branchId,
        createdById: user.id,
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive ?? true,
      },
      select: STAFF_SELECT,
    });
  }

  async findAll(user: RequestUser) {
    if (this.canViewAllStaff(user)) {
      return await this.prisma.staff.findMany({
        orderBy: { createdAt: 'desc' },
        select: STAFF_SELECT,
      });
    }

    if (!user.branchId) {
      throw new ForbiddenException('Branch access is required.');
    }

    return await this.prisma.staff.findMany({
      where: { branchId: user.branchId },
      orderBy: { createdAt: 'desc' },
      select: STAFF_SELECT,
    });
  }

  async findOne(user: RequestUser, id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: STAFF_SELECT,
    });

    if (!staff) {
      throw new NotFoundException('Staff not found.');
    }

    this.assertCanAccessStaff(user, staff);

    return staff;
  }

  private async assertEmailIsAvailable(email: string) {
    const existingStaff = await this.prisma.staff.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingStaff) {
      throw new ConflictException('Staff email is already in use.');
    }
  }

  private async assertBranchRules(dto: CreateStaffDto) {
    if (dto.role !== StaffRole.HQ_STAFF && !dto.branchId) {
      throw new BadRequestException(
        'Branch staff and teachers require branchId.',
      );
    }

    if (!dto.branchId) {
      return;
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }
  }

  private assertCanAccessStaff(user: RequestUser, staff: SafeStaff) {
    if (this.canViewAllStaff(user)) {
      return;
    }

    if (!user.branchId || staff.branchId !== user.branchId) {
      throw new ForbiddenException('You can only access staff in your branch.');
    }
  }

  private canViewAllStaff(user: RequestUser) {
    return user.role === StaffRole.HQ_STAFF;
  }
}
