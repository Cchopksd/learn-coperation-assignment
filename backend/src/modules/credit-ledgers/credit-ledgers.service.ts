import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, StaffRole } from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { ListCreditLedgersDto } from './dto/list-credit-ledgers.dto';

@Injectable()
export class CreditLedgersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: RequestUser, query: ListCreditLedgersDto) {
    const where: Prisma.StudentCreditLedgerWhereInput = {
      studentId: query.studentId,
      reason: query.reason,
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      },
    };

    if (user.role !== StaffRole.HQ_STAFF) {
      if (!user.branchId) {
        throw new ForbiddenException('Branch access is required.');
      }

      where.student = {
        branchId: user.branchId,
      };
    }

    return await this.prisma.studentCreditLedger.findMany({
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
