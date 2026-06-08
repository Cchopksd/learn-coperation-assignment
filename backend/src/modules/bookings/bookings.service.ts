import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceStatus,
  CompensationStatus,
  CompensationType,
  CreditLedgerReason,
  Prisma,
  StaffRole,
} from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

type BookingTransaction = Prisma.TransactionClient;
type AttendanceBooking = Prisma.BookingGetPayload<{
  include: {
    student: {
      select: {
        id: true;
        branchId: true;
        creditBalance: true;
      };
    };
    classSession: {
      select: {
        id: true;
        branchId: true;
        teacherId: true;
      };
    };
    creditLedger: {
      select: { id: true };
    };
    compensation: {
      select: { id: true };
    };
  };
}>;

const BOOKING_SELECT = {
  id: true,
  classSessionId: true,
  studentId: true,
  bookedById: true,
  markedById: true,
  status: true,
  bookedAt: true,
  markedAt: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BookingSelect;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: RequestUser, dto: CreateBookingDto) {
    return await this.prisma.$transaction(
      async (tx) => {
        const classSession = await tx.classSession.update({
          where: { id: dto.classSessionId },
          data: { updatedAt: new Date() },
          select: {
            id: true,
            branchId: true,
            capacity: true,
            teacherId: true,
          },
        });
        const student = await tx.student.findUnique({
          where: { id: dto.studentId },
          select: {
            id: true,
            branchId: true,
            isActive: true,
          },
        });

        if (!student || !student.isActive) {
          throw new NotFoundException('Student not found.');
        }

        this.assertCanAccessClass(user, classSession);

        if (student.branchId !== classSession.branchId) {
          throw new BadRequestException(
            'Student and class session must be in the same branch.',
          );
        }

        const existingBooking = await tx.booking.findUnique({
          where: {
            classSessionId_studentId: {
              classSessionId: dto.classSessionId,
              studentId: dto.studentId,
            },
          },
          select: { id: true },
        });

        if (existingBooking) {
          throw new ConflictException(
            'Student already has a booking for this class session.',
          );
        }

        const bookedSeats = await tx.booking.count({
          where: { classSessionId: dto.classSessionId },
        });

        if (bookedSeats >= classSession.capacity) {
          throw new ConflictException('Class session is fully booked.');
        }

        return await tx.booking.create({
          data: {
            classSessionId: dto.classSessionId,
            studentId: dto.studentId,
            bookedById: user.id,
            status: AttendanceStatus.BOOKED,
            note: dto.note,
          },
          select: BOOKING_SELECT,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async updateAttendance(
    user: RequestUser,
    bookingId: string,
    dto: UpdateAttendanceDto,
  ) {
    return await this.prisma.$transaction(
      async (tx) => {
        const lockedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { updatedAt: new Date() },
          select: { id: true },
        });
        const booking = await tx.booking.findUnique({
          where: { id: lockedBooking.id },
          include: {
            student: {
              select: {
                id: true,
                branchId: true,
                creditBalance: true,
              },
            },
            classSession: {
              select: {
                id: true,
                branchId: true,
                teacherId: true,
              },
            },
            creditLedger: {
              select: { id: true },
            },
            compensation: {
              select: { id: true },
            },
          },
        });

        if (!booking) {
          throw new NotFoundException('Booking not found.');
        }

        this.assertCanAccessClass(user, booking.classSession);

        if (booking.status === dto.status) {
          return this.findBookingInTransaction(tx, booking.id);
        }

        if (booking.status !== AttendanceStatus.BOOKED) {
          throw new BadRequestException(
            `Cannot change attendance from ${booking.status} to ${dto.status}.`,
          );
        }

        if (dto.status === AttendanceStatus.SKIP) {
          return await this.markSkip(tx, user, booking, dto.note);
        }

        return await this.markCreditDeductingAttendance(tx, user, booking, dto);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  private async markCreditDeductingAttendance(
    tx: BookingTransaction,
    user: RequestUser,
    booking: AttendanceBooking,
    dto: UpdateAttendanceDto,
  ) {
    if (booking.student.creditBalance < 1) {
      throw new BadRequestException('Student does not have enough credit.');
    }

    const balanceAfter = booking.student.creditBalance - 1;
    await tx.student.update({
      where: { id: booking.studentId },
      data: { creditBalance: balanceAfter },
    });
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: dto.status,
        markedById: user.id,
        markedAt: new Date(),
        note: dto.note ?? booking.note,
      },
    });
    await tx.studentCreditLedger.create({
      data: {
        studentId: booking.studentId,
        bookingId: booking.id,
        createdById: user.id,
        amount: -1,
        reason:
          dto.status === AttendanceStatus.ATTEND
            ? CreditLedgerReason.ATTENDANCE_ATTEND
            : CreditLedgerReason.ATTENDANCE_ABSENT,
        balanceAfter,
        note: dto.note,
      },
    });

    return this.findBookingInTransaction(tx, booking.id);
  }

  private async markSkip(
    tx: BookingTransaction,
    user: RequestUser,
    booking: AttendanceBooking,
    note: string | undefined,
  ) {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: AttendanceStatus.SKIP,
        markedById: user.id,
        markedAt: new Date(),
        note: note ?? booking.note,
      },
    });
    await tx.studentCompensation.create({
      data: {
        studentId: booking.studentId,
        bookingId: booking.id,
        type: CompensationType.MAKEUP_CLASS,
        status: CompensationStatus.AVAILABLE,
        note,
      },
    });

    return this.findBookingInTransaction(tx, booking.id);
  }

  private findBookingInTransaction(tx: BookingTransaction, id: string) {
    return tx.booking.findUniqueOrThrow({
      where: { id },
      select: BOOKING_SELECT,
    });
  }

  private assertCanAccessClass(
    user: RequestUser,
    classSession: Pick<
      Prisma.ClassSessionGetPayload<object>,
      'branchId' | 'teacherId'
    >,
  ) {
    if (user.role === StaffRole.HQ_STAFF) {
      return;
    }

    if (user.role === StaffRole.TEACHER && classSession.teacherId === user.id) {
      return;
    }

    if (user.branchId && user.branchId === classSession.branchId) {
      return;
    }

    throw new ForbiddenException('You cannot access this class session.');
  }
}
