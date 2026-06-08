import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    staff: {
      findUnique: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('returns JWT token and safe staff profile when credentials are valid', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    prisma.staff.findUnique.mockResolvedValue({
      id: 'staff-id',
      branchId: 'branch-id',
      name: 'HQ Staff',
      email: 'hq.staff@example.local',
      passwordHash,
      role: StaffRole.HQ_STAFF,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: null,
    });
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await service.login({
      email: 'hq.staff@example.local',
      password: 'password123',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'staff-id',
      role: StaffRole.HQ_STAFF,
      branchId: 'branch-id',
    });
    expect(result).toEqual({
      accessToken: 'signed-token',
      staff: {
        id: 'staff-id',
        branchId: 'branch-id',
        name: 'HQ Staff',
        email: 'hq.staff@example.local',
        role: StaffRole.HQ_STAFF,
        isActive: true,
      },
    });
    expect(result.staff).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid password', async () => {
    prisma.staff.findUnique.mockResolvedValue({
      passwordHash: await bcrypt.hash('password123', 10),
      isActive: true,
    });

    await expect(
      service.login({
        email: 'hq.staff@example.local',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid email or password.');
  });

  it('rejects inactive staff', async () => {
    prisma.staff.findUnique.mockResolvedValue({
      passwordHash: await bcrypt.hash('password123', 10),
      isActive: false,
    });

    await expect(
      service.login({
        email: 'hq.staff@example.local',
        password: 'password123',
      }),
    ).rejects.toThrow('Invalid email or password.');
  });
});
