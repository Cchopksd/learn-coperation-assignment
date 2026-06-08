import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffsService } from './staffs.service';

type StaffCreateCall = {
  data: {
    branchId?: string;
    createdById: string;
    name: string;
    email: string;
    passwordHash: string;
    role: StaffRole;
    isActive: boolean;
  };
  select: object;
};

type PrismaMock = {
  staff: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
  branch: {
    findUnique: jest.Mock;
  };
};

const anyObject = expect.any(Object) as object;

describe('StaffsService', () => {
  let service: StaffsService;
  const prisma: PrismaMock = {
    staff: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    branch: {
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
        StaffsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<StaffsService>(StaffsService);
    jest.clearAllMocks();
  });

  it('creates staff with hashed password and creator id', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);
    prisma.branch.findUnique.mockResolvedValue({ id: 'branch-id' });
    const createCalls: StaffCreateCall[] = [];
    prisma.staff.create.mockImplementation((args: StaffCreateCall) => {
      createCalls.push(args);

      return { id: 'new-staff-id' };
    });

    const result = await service.create(hqUser, {
      branchId: 'branch-id',
      name: 'Branch Staff',
      email: 'branch.staff@example.local',
      password: 'password123',
      role: StaffRole.BRANCH_STAFF,
    });

    expect(createCalls).toHaveLength(1);
    expect(createCalls[0]?.data).toEqual(
      expect.objectContaining({
        branchId: 'branch-id',
        createdById: 'hq-staff-id',
        name: 'Branch Staff',
        email: 'branch.staff@example.local',
        role: StaffRole.BRANCH_STAFF,
        isActive: true,
      }),
    );
    expect(
      await bcrypt.compare(
        'password123',
        createCalls[0]?.data.passwordHash ?? '',
      ),
    ).toBe(true);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate staff email', async () => {
    prisma.staff.findUnique.mockResolvedValue({ id: 'existing-staff-id' });

    await expect(
      service.create(hqUser, {
        name: 'Branch Staff',
        email: 'branch.staff@example.local',
        password: 'password123',
        role: StaffRole.HQ_STAFF,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires branch id for branch staff and teachers', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);

    await expect(
      service.create(hqUser, {
        name: 'Teacher',
        email: 'teacher@example.local',
        password: 'password123',
        role: StaffRole.TEACHER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing branch references', async () => {
    prisma.staff.findUnique.mockResolvedValue(null);
    prisma.branch.findUnique.mockResolvedValue(null);

    await expect(
      service.create(hqUser, {
        branchId: 'missing-branch-id',
        name: 'Teacher',
        email: 'teacher@example.local',
        password: 'password123',
        role: StaffRole.TEACHER,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows HQ staff to list all staff', async () => {
    prisma.staff.findMany.mockResolvedValue([]);

    await service.findAll(hqUser);

    expect(prisma.staff.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      select: anyObject,
    });
  });

  it('limits branch staff to staff in their branch', async () => {
    prisma.staff.findMany.mockResolvedValue([]);

    await service.findAll(branchUser);

    expect(prisma.staff.findMany).toHaveBeenCalledWith({
      where: { branchId: 'branch-id' },
      orderBy: { createdAt: 'desc' },
      select: anyObject,
    });
  });

  it('rejects branch staff viewing staff outside their branch', async () => {
    prisma.staff.findUnique.mockResolvedValue({
      id: 'other-staff-id',
      branchId: 'other-branch-id',
    });

    await expect(
      service.findOne(branchUser, 'other-staff-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
