import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreditLedgerReason, StaffRole } from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentsService } from './students.service';

type TxMock = {
  student: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  studentCreditLedger: {
    create: jest.Mock;
  };
};

type PrismaMock = {
  $transaction: jest.Mock;
  branch: {
    findUnique: jest.Mock;
  };
  student: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
  studentCreditLedger: {
    findMany: jest.Mock;
  };
  studentCompensation: {
    findMany: jest.Mock;
  };
};

const anyObject = expect.any(Object) as object;

describe('StudentsService', () => {
  let service: StudentsService;
  const tx: TxMock = {
    student: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    studentCreditLedger: {
      create: jest.fn(),
    },
  };
  const prisma: PrismaMock = {
    $transaction: jest.fn(),
    branch: {
      findUnique: jest.fn(),
    },
    student: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    studentCreditLedger: {
      findMany: jest.fn(),
    },
    studentCompensation: {
      findMany: jest.fn(),
    },
  };

  const hqUser: RequestUser = {
    id: 'hq-staff-id',
    role: StaffRole.HQ_STAFF,
    branchId: null,
  };

  const branchUser: RequestUser = {
    id: 'branch-staff-id',
    role: StaffRole.BRANCH_STAFF,
    branchId: 'branch-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: (transaction: TxMock) => Promise<unknown>) =>
        await callback(tx),
    );
  });

  it('creates a student in an existing branch', async () => {
    prisma.branch.findUnique.mockResolvedValue({ id: 'branch-id' });
    prisma.student.create.mockResolvedValue({ id: 'student-id' });

    await service.create(hqUser, {
      branchId: 'branch-id',
      name: 'Ada',
      email: 'ada@example.local',
    });

    expect(prisma.student.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-id',
        name: 'Ada',
        email: 'ada@example.local',
        phone: undefined,
        isActive: true,
      },
      select: anyObject,
    });
  });

  it('rejects branch staff creating a student in another branch', async () => {
    await expect(
      service.create(branchUser, {
        branchId: 'other-branch-id',
        name: 'Ada',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('limits branch staff to students in their branch', async () => {
    prisma.student.findMany.mockResolvedValue([]);

    await service.findAll(branchUser);

    expect(prisma.student.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-id' },
      orderBy: { createdAt: 'desc' },
      select: anyObject,
    });
  });

  it('uses a transaction when adjusting student credits', async () => {
    tx.student.findUnique.mockResolvedValue({
      id: 'student-id',
      branchId: 'branch-id',
      creditBalance: 2,
    });
    tx.student.update.mockResolvedValue({
      id: 'student-id',
      creditBalance: 5,
    });
    tx.studentCreditLedger.create.mockResolvedValue({ id: 'ledger-id' });

    await service.adjustCredit(branchUser, 'student-id', {
      amount: 3,
      note: 'manual top up',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(tx.student.update).toHaveBeenCalledWith({
      where: { id: 'student-id' },
      data: { creditBalance: 5 },
      select: anyObject,
    });
    expect(tx.studentCreditLedger.create).toHaveBeenCalledWith({
      data: {
        studentId: 'student-id',
        createdById: 'branch-staff-id',
        amount: 3,
        reason: CreditLedgerReason.MANUAL_ADJUSTMENT,
        balanceAfter: 5,
        note: 'manual top up',
      },
    });
  });

  it('rejects credit adjustment that would make balance negative', async () => {
    tx.student.findUnique.mockResolvedValue({
      id: 'student-id',
      branchId: 'branch-id',
      creditBalance: 1,
    });

    await expect(
      service.adjustCredit(branchUser, 'student-id', {
        amount: -2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects branch staff viewing another branch student', async () => {
    prisma.student.findUnique.mockResolvedValue({
      id: 'student-id',
      branchId: 'other-branch-id',
    });

    await expect(
      service.findOne(branchUser, 'student-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not found when student does not exist', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(service.findOne(hqUser, 'missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
