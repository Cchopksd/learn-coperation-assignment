import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompensationStatus, Prisma, StaffRole } from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ListCompensationsDto } from './dto/list-compensations.dto';
import { UpdateCompensationStatusDto } from './dto/update-compensation-status.dto';

@Injectable()
export class CompensationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: RequestUser, query: ListCompensationsDto) {
    const where: Prisma.StudentCompensationWhereInput = {
      studentId: query.studentId,
      status: query.status,
      type: query.type,
    };

    if (user.role !== StaffRole.HQ_STAFF) {
      if (!user.branchId) {
        throw new ForbiddenException('Branch access is required.');
      }

      where.student = {
        branchId: user.branchId,
      };
    }

    return await this.prisma.studentCompensation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            branchId: true,
          },
        },
        booking: {
          select: {
            id: true,
            status: true,
            classSession: {
              select: {
                id: true,
                title: true,
                startTime: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(
    user: RequestUser,
    id: string,
    dto: UpdateCompensationStatusDto,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const compensation = await tx.studentCompensation.findUnique({
        where: { id },
        include: {
          student: {
            select: {
              branchId: true,
            },
          },
        },
      });

      if (!compensation) {
        throw new NotFoundException('Compensation not found.');
      }

      this.assertCanAccessBranch(user, compensation.student.branchId);

      if (compensation.status !== CompensationStatus.AVAILABLE) {
        throw new BadRequestException(
          `Cannot change compensation from ${compensation.status}.`,
        );
      }

      return await tx.studentCompensation.update({
        where: { id },
        data: {
          status: dto.status,
          usedAt: dto.status === CompensationStatus.USED ? new Date() : null,
        },
      });
    });
  }

  private assertCanAccessBranch(user: RequestUser, branchId: string) {
    if (user.role === StaffRole.HQ_STAFF) {
      return;
    }

    if (!user.branchId || user.branchId !== branchId) {
      throw new ForbiddenException(
        'You can only access compensations in your branch.',
      );
    }
  }
}
