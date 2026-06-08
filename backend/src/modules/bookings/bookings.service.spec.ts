import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
import { BookingsService } from './bookings.service';

type TransactionCallback = (
  transaction: BookingTransactionMock,
) => Promise<unknown>;

type BookingTransactionMock = {
  classSession: {
    update: jest.Mock;
  };
  student: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  booking: {
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  studentCreditLedger: {
    create: jest.Mock;
  };
  studentCompensation: {
    create: jest.Mock;
  };
};

type PrismaMock = {
  $transaction: jest.Mock;
};

const branchUser: RequestUser = {
  id: 'branch-staff-id',
  role: StaffRole.BRANCH_STAFF,
  branchId: 'branch-id',
};

const finalBooking = {
  id: 'booking-id',
  classSessionId: 'class-session-id',
  studentId: 'student-id',
  status: AttendanceStatus.ATTEND,
};

function createAttendanceBooking(status: AttendanceStatus, creditBalance = 2) {
  return {
    id: 'booking-id',
    classSessionId: 'class-session-id',
    studentId: 'student-id',
    bookedById: 'branch-staff-id',
    markedById: null,
    status,
    bookedAt: new Date(),
    markedAt: null,
    note: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {
      id: 'student-id',
      branchId: 'branch-id',
      creditBalance,
    },
    classSession: {
      id: 'class-session-id',
      branchId: 'branch-id',
      teacherId: 'teacher-id',
    },
    creditLedger: null,
    compensation: null,
  };
}

describe('BookingsService', () => {
  let service: BookingsService;
  const tx: BookingTransactionMock = {
    classSession: {
      update: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    studentCreditLedger: {
      create: jest.fn(),
    },
    studentCompensation: {
      create: jest.fn(),
    },
  };
  const prisma: PrismaMock = {
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: TransactionCallback) => await callback(tx),
    );
  });

  describe('create', () => {
    beforeEach(() => {
      tx.classSession.update.mockResolvedValue({
        id: 'class-session-id',
        branchId: 'branch-id',
        capacity: 2,
        teacherId: 'teacher-id',
      });
      tx.student.findUnique.mockResolvedValue({
        id: 'student-id',
        branchId: 'branch-id',
        isActive: true,
      });
      tx.booking.findUnique.mockResolvedValue(null);
      tx.booking.count.mockResolvedValue(1);
      tx.booking.create.mockResolvedValue({
        id: 'booking-id',
        status: AttendanceStatus.BOOKED,
      });
    });

    it('creates a BOOKED reservation without deducting credit', async () => {
      await service.create(branchUser, {
        classSessionId: 'class-session-id',
        studentId: 'student-id',
      });

      expect(tx.booking.create).toHaveBeenCalledWith({
        data: {
          classSessionId: 'class-session-id',
          studentId: 'student-id',
          bookedById: 'branch-staff-id',
          status: AttendanceStatus.BOOKED,
          note: undefined,
        },
        select: expect.any(Object) as object,
      });
      expect(tx.student.update).not.toHaveBeenCalled();
      expect(tx.studentCreditLedger.create).not.toHaveBeenCalled();
    });

    it('prevents duplicate bookings', async () => {
      tx.booking.findUnique.mockResolvedValue({ id: 'existing-booking-id' });

      await expect(
        service.create(branchUser, {
          classSessionId: 'class-session-id',
          studentId: 'student-id',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.booking.create).not.toHaveBeenCalled();
    });

    it('prevents overbooking', async () => {
      tx.booking.count.mockResolvedValue(2);

      await expect(
        service.create(branchUser, {
          classSessionId: 'class-session-id',
          studentId: 'student-id',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.booking.create).not.toHaveBeenCalled();
    });

    it('locks the class session and requests serializable isolation', async () => {
      await service.create(branchUser, {
        classSessionId: 'class-session-id',
        studentId: 'student-id',
      });

      expect(tx.classSession.update).toHaveBeenCalledWith({
        where: { id: 'class-session-id' },
        data: { updatedAt: expect.any(Date) as Date },
        select: expect.any(Object) as object,
      });
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function) as TransactionCallback,
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    });
  });

  describe('attendance', () => {
    beforeEach(() => {
      tx.booking.update.mockResolvedValue({ id: 'booking-id' });
      tx.booking.findUnique.mockResolvedValue(
        createAttendanceBooking(AttendanceStatus.BOOKED),
      );
      tx.booking.findUniqueOrThrow.mockResolvedValue(finalBooking);
      tx.student.update.mockResolvedValue({ id: 'student-id' });
      tx.studentCreditLedger.create.mockResolvedValue({ id: 'ledger-id' });
      tx.studentCompensation.create.mockResolvedValue({
        id: 'compensation-id',
      });
    });

    it('marks ATTEND, deducts one credit, and creates one ledger', async () => {
      await service.updateAttendance(branchUser, 'booking-id', {
        status: AttendanceStatus.ATTEND,
      });

      expect(tx.student.update).toHaveBeenCalledWith({
        where: { id: 'student-id' },
        data: { creditBalance: 1 },
      });
      expect(tx.studentCreditLedger.create).toHaveBeenCalledWith({
        data: {
          studentId: 'student-id',
          bookingId: 'booking-id',
          createdById: 'branch-staff-id',
          amount: -1,
          reason: CreditLedgerReason.ATTENDANCE_ATTEND,
          balanceAfter: 1,
          note: undefined,
        },
      });
      expect(tx.studentCompensation.create).not.toHaveBeenCalled();
    });

    it('marks ABSENT and creates an absent ledger without compensation', async () => {
      await service.updateAttendance(branchUser, 'booking-id', {
        status: AttendanceStatus.ABSENT,
      });

      expect(tx.studentCreditLedger.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: CreditLedgerReason.ATTENDANCE_ABSENT,
          amount: -1,
          balanceAfter: 1,
        }) as object,
      });
      expect(tx.studentCompensation.create).not.toHaveBeenCalled();
    });

    it('marks SKIP without deducting credit and creates compensation', async () => {
      await service.updateAttendance(branchUser, 'booking-id', {
        status: AttendanceStatus.SKIP,
        note: 'approved leave',
      });

      expect(tx.student.update).not.toHaveBeenCalled();
      expect(tx.studentCreditLedger.create).not.toHaveBeenCalled();
      expect(tx.studentCompensation.create).toHaveBeenCalledWith({
        data: {
          studentId: 'student-id',
          bookingId: 'booking-id',
          type: CompensationType.MAKEUP_CLASS,
          status: CompensationStatus.AVAILABLE,
          note: 'approved leave',
        },
      });
    });

    it.each([
      AttendanceStatus.ATTEND,
      AttendanceStatus.ABSENT,
      AttendanceStatus.SKIP,
    ])('is idempotent when repeating %s', async (status) => {
      tx.booking.findUnique.mockResolvedValue(createAttendanceBooking(status));

      await service.updateAttendance(branchUser, 'booking-id', { status });

      expect(tx.student.update).not.toHaveBeenCalled();
      expect(tx.studentCreditLedger.create).not.toHaveBeenCalled();
      expect(tx.studentCompensation.create).not.toHaveBeenCalled();
    });

    it.each([
      [AttendanceStatus.ATTEND, AttendanceStatus.SKIP],
      [AttendanceStatus.SKIP, AttendanceStatus.ABSENT],
      [AttendanceStatus.ABSENT, AttendanceStatus.ATTEND],
    ])('rejects transition from %s to %s', async (fromStatus, toStatus) => {
      tx.booking.findUnique.mockResolvedValue(
        createAttendanceBooking(fromStatus),
      );

      await expect(
        service.updateAttendance(branchUser, 'booking-id', {
          status: toStatus,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects deduction when credit would become negative', async () => {
      tx.booking.findUnique.mockResolvedValue(
        createAttendanceBooking(AttendanceStatus.BOOKED, 0),
      );

      await expect(
        service.updateAttendance(branchUser, 'booking-id', {
          status: AttendanceStatus.ATTEND,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.student.update).not.toHaveBeenCalled();
    });

    it('propagates ledger failure so the transaction can roll back', async () => {
      tx.studentCreditLedger.create.mockRejectedValue(
        new Error('ledger write failed'),
      );

      await expect(
        service.updateAttendance(branchUser, 'booking-id', {
          status: AttendanceStatus.ATTEND,
        }),
      ).rejects.toThrow('ledger write failed');
      expect(tx.booking.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('propagates compensation failure so the transaction can roll back', async () => {
      tx.studentCompensation.create.mockRejectedValue(
        new Error('compensation write failed'),
      );

      await expect(
        service.updateAttendance(branchUser, 'booking-id', {
          status: AttendanceStatus.SKIP,
        }),
      ).rejects.toThrow('compensation write failed');
      expect(tx.booking.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('locks the booking and requests serializable isolation', async () => {
      await service.updateAttendance(branchUser, 'booking-id', {
        status: AttendanceStatus.ATTEND,
      });

      expect(tx.booking.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'booking-id' },
        data: { updatedAt: expect.any(Date) as Date },
        select: { id: true },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function) as TransactionCallback,
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    });
  });
});
