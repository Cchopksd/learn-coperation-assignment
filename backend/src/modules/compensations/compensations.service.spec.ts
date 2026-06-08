import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CompensationStatus, StaffRole } from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CompensationsService } from './compensations.service';

type CompensationTransactionMock = {
  studentCompensation: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

type TransactionCallback = (
  transaction: CompensationTransactionMock,
) => Promise<unknown>;

describe('CompensationsService', () => {
  let service: CompensationsService;
  const tx: CompensationTransactionMock = {
    studentCompensation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn(),
    studentCompensation: {
      findMany: jest.fn(),
    },
  };
  const branchUser: RequestUser = {
    id: 'branch-staff-id',
    role: StaffRole.BRANCH_STAFF,
    branchId: 'branch-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompensationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CompensationsService>(CompensationsService);
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: TransactionCallback) => await callback(tx),
    );
    tx.studentCompensation.findUnique.mockResolvedValue({
      id: 'compensation-id',
      status: CompensationStatus.AVAILABLE,
      student: {
        branchId: 'branch-id',
      },
    });
    tx.studentCompensation.update.mockResolvedValue({
      id: 'compensation-id',
    });
  });

  it('changes AVAILABLE to USED and sets usedAt', async () => {
    await service.updateStatus(branchUser, 'compensation-id', {
      status: CompensationStatus.USED,
    });

    expect(tx.studentCompensation.update).toHaveBeenCalledWith({
      where: { id: 'compensation-id' },
      data: {
        status: CompensationStatus.USED,
        usedAt: expect.any(Date) as Date,
      },
    });
  });

  it('changes AVAILABLE to CANCELLED and clears usedAt', async () => {
    await service.updateStatus(branchUser, 'compensation-id', {
      status: CompensationStatus.CANCELLED,
    });

    expect(tx.studentCompensation.update).toHaveBeenCalledWith({
      where: { id: 'compensation-id' },
      data: {
        status: CompensationStatus.CANCELLED,
        usedAt: null,
      },
    });
  });

  it.each([CompensationStatus.USED, CompensationStatus.CANCELLED])(
    'rejects transitions from %s',
    async (status) => {
      tx.studentCompensation.findUnique.mockResolvedValue({
        id: 'compensation-id',
        status,
        student: {
          branchId: 'branch-id',
        },
      });

      await expect(
        service.updateStatus(branchUser, 'compensation-id', {
          status: CompensationStatus.USED,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(tx.studentCompensation.update).not.toHaveBeenCalled();
    },
  );

  it('rejects branch staff accessing another branch compensation', async () => {
    tx.studentCompensation.findUnique.mockResolvedValue({
      id: 'compensation-id',
      status: CompensationStatus.AVAILABLE,
      student: {
        branchId: 'other-branch-id',
      },
    });

    await expect(
      service.updateStatus(branchUser, 'compensation-id', {
        status: CompensationStatus.USED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not found for a missing compensation', async () => {
    tx.studentCompensation.findUnique.mockResolvedValue(null);

    await expect(
      service.updateStatus(branchUser, 'missing-id', {
        status: CompensationStatus.USED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates update failure so the transaction can roll back', async () => {
    tx.studentCompensation.update.mockRejectedValue(
      new Error('status update failed'),
    );

    await expect(
      service.updateStatus(branchUser, 'compensation-id', {
        status: CompensationStatus.USED,
      }),
    ).rejects.toThrow('status update failed');
  });
});
