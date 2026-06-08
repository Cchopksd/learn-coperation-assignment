import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreditLedgerReason, Prisma, StaffRole } from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustStudentCreditDto } from './dto/adjust-student-credit.dto';
import { CreateStudentDto } from './dto/create-student.dto';

const STUDENT_SELECT = {
  id: true,
  branchId: true,
  name: true,
  email: true,
  phone: true,
  creditBalance: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.StudentSelect;

type SafeStudent = Prisma.StudentGetPayload<{
  select: typeof STUDENT_SELECT;
}>;

type StudentTransaction = Prisma.TransactionClient;

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: RequestUser, dto: CreateStudentDto) {
    this.assertCanAccessBranch(user, dto.branchId);
    await this.assertBranchExists(dto.branchId);

    return await this.prisma.student.create({
      data: {
        branchId: dto.branchId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        isActive: dto.isActive ?? true,
      },
      select: STUDENT_SELECT,
    });
  }

  async findAll(user: RequestUser) {
    if (this.canAccessAllBranches(user)) {
      return await this.prisma.student.findMany({
        orderBy: { createdAt: 'desc' },
        select: STUDENT_SELECT,
      });
    }

    if (!user.branchId) {
      throw new ForbiddenException('Branch access is required.');
    }

    return await this.prisma.student.findMany({
      where: { branchId: user.branchId },
      orderBy: { createdAt: 'desc' },
      select: STUDENT_SELECT,
    });
  }

  async findOne(user: RequestUser, id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: STUDENT_SELECT,
    });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    this.assertCanAccessStudent(user, student);

    return student;
  }

  async adjustCredit(
    user: RequestUser,
    studentId: string,
    dto: AdjustStudentCreditDto,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          branchId: true,
          creditBalance: true,
        },
      });

      if (!student) {
        throw new NotFoundException('Student not found.');
      }

      this.assertCanAccessStudent(user, student);

      const balanceAfter = student.creditBalance + dto.amount;

      if (balanceAfter < 0) {
        throw new BadRequestException('Credit balance cannot become negative.');
      }

      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: { creditBalance: balanceAfter },
        select: STUDENT_SELECT,
      });

      const ledger = await this.createCreditLedger(tx, {
        studentId,
        createdById: user.id,
        amount: dto.amount,
        balanceAfter,
        note: dto.note,
      });

      return {
        student: updatedStudent,
        ledger,
      };
    });
  }

  async findLedger(user: RequestUser, studentId: string) {
    const student = await this.findOne(user, studentId);

    return await this.prisma.studentCreditLedger.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
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

  async findCompensations(user: RequestUser, studentId: string) {
    const student = await this.findOne(user, studentId);

    return await this.prisma.studentCompensation.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            id: true,
            classSessionId: true,
            status: true,
            markedAt: true,
          },
        },
      },
    });
  }

  private async assertBranchExists(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found.');
    }
  }

  private createCreditLedger(
    tx: StudentTransaction,
    data: {
      studentId: string;
      createdById: string;
      amount: number;
      balanceAfter: number;
      note?: string;
    },
  ) {
    return tx.studentCreditLedger.create({
      data: {
        studentId: data.studentId,
        createdById: data.createdById,
        amount: data.amount,
        reason: CreditLedgerReason.MANUAL_ADJUSTMENT,
        balanceAfter: data.balanceAfter,
        note: data.note,
      },
    });
  }

  private assertCanAccessStudent(
    user: RequestUser,
    student: Pick<SafeStudent, 'branchId'>,
  ) {
    this.assertCanAccessBranch(user, student.branchId);
  }

  private assertCanAccessBranch(user: RequestUser, branchId: string) {
    if (this.canAccessAllBranches(user)) {
      return;
    }

    if (!user.branchId || user.branchId !== branchId) {
      throw new ForbiddenException(
        'You can only access students in your branch.',
      );
    }
  }

  private canAccessAllBranches(user: RequestUser) {
    return user.role === StaffRole.HQ_STAFF;
  }
}
