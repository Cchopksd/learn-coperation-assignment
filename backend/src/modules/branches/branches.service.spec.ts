import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StaffRole } from '@prisma/client';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { BranchesService } from './branches.service';

describe('BranchesService', () => {
  let service: BranchesService;
  const prisma = {
    branch: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
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
        BranchesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    jest.clearAllMocks();
  });

  it('allows HQ staff to create a branch', async () => {
    const branch = {
      id: 'branch-id',
      code: 'BKK',
      name: 'Bangkok',
      address: null,
    };
    prisma.branch.create.mockResolvedValue(branch);

    await expect(
      service.create(hqUser, {
        code: 'BKK',
        name: 'Bangkok',
      }),
    ).resolves.toBe(branch);
    expect(prisma.branch.create).toHaveBeenCalledWith({
      data: {
        code: 'BKK',
        name: 'Bangkok',
        address: undefined,
      },
    });
  });

  it('allows HQ staff to list all branches', async () => {
    prisma.branch.findMany.mockResolvedValue([]);

    await service.findAll(hqUser);

    expect(prisma.branch.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });

  it('limits branch staff to their own branch list', async () => {
    prisma.branch.findMany.mockResolvedValue([]);

    await service.findAll(branchUser);

    expect(prisma.branch.findMany).toHaveBeenCalledWith({
      where: { id: 'branch-id' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('allows HQ staff to view any branch', async () => {
    prisma.branch.findUnique.mockResolvedValue({ id: 'other-branch-id' });

    await service.findOne(hqUser, 'other-branch-id');

    expect(prisma.branch.findUnique).toHaveBeenCalledWith({
      where: { id: 'other-branch-id' },
    });
  });

  it('rejects branch staff viewing another branch', async () => {
    await expect(
      service.findOne(branchUser, 'other-branch-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not found when branch does not exist', async () => {
    prisma.branch.findUnique.mockResolvedValue(null);

    await expect(service.findOne(hqUser, 'missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
