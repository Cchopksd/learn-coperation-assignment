import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StaffRole } from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';

const CLASS_SESSION_SELECT = {
  id: true,
  branchId: true,
  teacherId: true,
  title: true,
  description: true,
  startTime: true,
  endTime: true,
  capacity: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      bookings: true,
    },
  },
} satisfies Prisma.ClassSessionSelect;

type ClassSessionResult = Prisma.ClassSessionGetPayload<{
  select: typeof CLASS_SESSION_SELECT;
}>;

@Injectable()
export class ClassSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: RequestUser, dto: CreateClassSessionDto) {
    this.assertCanAccessBranch(user, dto.branchId);
    this.assertValidTimeRange(dto.startTime, dto.endTime);
    await this.assertBranchExists(dto.branchId);
    await this.assertTeacherIsValid(dto.teacherId, dto.branchId);

    const classSession = await this.prisma.classSession.create({
      data: {
        branchId: dto.branchId,
        teacherId: dto.teacherId,
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        capacity: dto.capacity,
      },
      select: CLASS_SESSION_SELECT,
    });

    return this.withSeatCounts(classSession);
  }

  async findAll(user: RequestUser) {
    const where = this.resolveFindWhere(user);
    const classSessions = await this.prisma.classSession.findMany({
      where,
      orderBy: { startTime: 'desc' },
      select: CLASS_SESSION_SELECT,
    });

    return classSessions.map((classSession) =>
      this.withSeatCounts(classSession),
    );
  }

  async findOne(user: RequestUser, id: string) {
    const classSession = await this.prisma.classSession.findUnique({
      where: { id },
      select: {
        ...CLASS_SESSION_SELECT,
        bookings: {
          orderBy: { bookedAt: 'desc' },
          select: {
            id: true,
            studentId: true,
            status: true,
            bookedAt: true,
            markedAt: true,
            note: true,
          },
        },
      },
    });

    if (!classSession) {
      throw new NotFoundException('Class session not found.');
    }

    this.assertCanAccessClassSession(user, classSession);

    return this.withSeatCounts(classSession);
  }

  private assertValidTimeRange(startTime: string, endTime: string) {
    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      throw new BadRequestException('endTime must be after startTime.');
    }
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

  private async assertTeacherIsValid(
    teacherId: string | undefined,
    branchId: string,
  ) {
    if (!teacherId) {
      return;
    }

    const teacher = await this.prisma.staff.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        branchId: true,
        role: true,
        isActive: true,
      },
    });

    if (!teacher || !teacher.isActive || teacher.role !== StaffRole.TEACHER) {
      throw new BadRequestException(
        'teacherId must reference an active teacher.',
      );
    }

    if (teacher.branchId !== branchId) {
      throw new BadRequestException('Teacher must belong to the class branch.');
    }
  }

  private resolveFindWhere(user: RequestUser): Prisma.ClassSessionWhereInput {
    if (user.role === StaffRole.HQ_STAFF) {
      return {};
    }

    if (user.role === StaffRole.TEACHER) {
      return { teacherId: user.id };
    }

    if (!user.branchId) {
      throw new ForbiddenException('Branch access is required.');
    }

    return { branchId: user.branchId };
  }

  private assertCanAccessClassSession(
    user: RequestUser,
    classSession: Pick<ClassSessionResult, 'branchId' | 'teacherId'>,
  ) {
    if (user.role === StaffRole.HQ_STAFF) {
      return;
    }

    if (user.role === StaffRole.TEACHER && classSession.teacherId === user.id) {
      return;
    }

    if (user.branchId && classSession.branchId === user.branchId) {
      return;
    }

    throw new ForbiddenException('You cannot access this class session.');
  }

  private assertCanAccessBranch(user: RequestUser, branchId: string) {
    if (user.role === StaffRole.HQ_STAFF) {
      return;
    }

    if (!user.branchId || user.branchId !== branchId) {
      throw new ForbiddenException(
        'You can only manage class sessions in your branch.',
      );
    }
  }

  private withSeatCounts<T extends ClassSessionResult>(classSession: T) {
    const bookedSeats = classSession._count.bookings;
    const rest = Object.fromEntries(
      Object.entries(classSession).filter(([key]) => key !== '_count'),
    ) as Omit<T, '_count'>;

    return {
      ...rest,
      bookedSeats,
      availableSeats: rest.capacity - bookedSeats,
    };
  }
}
