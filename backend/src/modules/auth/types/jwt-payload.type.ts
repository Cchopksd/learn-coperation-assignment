import { StaffRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  role: StaffRole;
  branchId: string | null;
};
