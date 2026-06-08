import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

function createPrismaAdapter() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run Prisma seed.');
  }

  return new PrismaPg({ connectionString });
}

const prisma = new PrismaClient({
  adapter: createPrismaAdapter(),
});

const DEFAULT_HQ_BRANCH_CODE = 'HQ';
const DEFAULT_HQ_BRANCH_NAME = 'Headquarters';
const DEFAULT_HQ_STAFF_EMAIL = 'hq.staff@example.local';
const DEFAULT_HQ_STAFF_NAME = 'HQ Staff';
const DEFAULT_HQ_STAFF_PASSWORD = 'ChangeMe123!';

function getEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();

  return value && value.length > 0 ? value : fallback;
}

function resolveHqStaffEmail() {
  const email = process.env.HQ_STAFF_EMAIL?.trim();

  if (email) {
    return email;
  }

  const username = process.env.HQ_STAFF_USERNAME?.trim();

  if (!username) {
    return DEFAULT_HQ_STAFF_EMAIL;
  }

  return username.includes('@') ? username : `${username}@example.local`;
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const branchCode = getEnv('HQ_BRANCH_CODE', DEFAULT_HQ_BRANCH_CODE);
  const branchName = getEnv('HQ_BRANCH_NAME', DEFAULT_HQ_BRANCH_NAME);
  const hqStaffEmail = resolveHqStaffEmail();
  const hqStaffName = getEnv('HQ_STAFF_DISPLAY_NAME', DEFAULT_HQ_STAFF_NAME);
  const hqStaffPassword =
    process.env.HQ_STAFF_PASSWORD?.trim() || DEFAULT_HQ_STAFF_PASSWORD;

  const branch = await prisma.branch.upsert({
    where: { code: branchCode },
    create: {
      code: branchCode,
      name: branchName,
    },
    update: {
      name: branchName,
    },
  });

  const existingHqStaff = await prisma.staff.findUnique({
    where: { email: hqStaffEmail },
  });

  if (existingHqStaff) {
    await prisma.staff.update({
      where: { id: existingHqStaff.id },
      data: {
        branchId: branch.id,
        name: hqStaffName,
        role: StaffRole.HQ_STAFF,
        isActive: true,
        ...(process.env.HQ_STAFF_PASSWORD?.trim()
          ? { passwordHash: await hashPassword(hqStaffPassword) }
          : {}),
      },
    });
  } else {
    await prisma.staff.create({
      data: {
        branchId: branch.id,
        name: hqStaffName,
        email: hqStaffEmail,
        passwordHash: await hashPassword(hqStaffPassword),
        role: StaffRole.HQ_STAFF,
        isActive: true,
      },
    });
  }

  console.log(`Seeded branch ${branchCode} and HQ staff ${hqStaffEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
