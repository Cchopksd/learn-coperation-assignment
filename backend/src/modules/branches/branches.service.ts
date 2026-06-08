import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StaffRole } from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(_user: RequestUser, dto: CreateBranchDto) {
    return await this.prisma.branch.create({
      data: {
        code: dto.code,
        name: dto.name,
        address: dto.address,
      },
    });
  }

  async findAll(user: RequestUser) {
    if (this.canManageBranches(user)) {
      return await this.prisma.branch.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!user.branchId) {
      throw new ForbiddenException('Branch access is required.');
    }

    return await this.prisma.branch.findMany({
      where: { id: user.branchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: RequestUser, id: string) {
    if (!this.canManageBranches(user) && user.branchId !== id) {
      throw new ForbiddenException('You can only access your own branch.');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }

    return branch;
  }

  private canManageBranches(user: RequestUser) {
    return user.role === StaffRole.HQ_STAFF;
  }
}
