import { StaffRole } from '@prisma/client';

export type RequestUser = {
  id: string;
  role: StaffRole;
  branchId: string | null;
};
