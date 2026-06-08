import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Staff } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload.type';

type AuthenticatedStaff = Pick<
  Staff,
  'id' | 'branchId' | 'name' | 'email' | 'role' | 'isActive'
>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const staff = await this.prisma.staff.findUnique({
      where: { email: dto.email },
    });

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      staff.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload: JwtPayload = {
      sub: staff.id,
      role: staff.role,
      branchId: staff.branchId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      staff: this.toAuthenticatedStaff(staff),
    };
  }

  async findAuthenticatedStaff(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        branchId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Authenticated staff is inactive.');
    }

    return staff;
  }

  private toAuthenticatedStaff(staff: Staff): AuthenticatedStaff {
    return {
      id: staff.id,
      branchId: staff.branchId,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      isActive: staff.isActive,
    };
  }
}
