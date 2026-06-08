import { randomBytes, scryptSync } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, StaffRole } from '@prisma/client';

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
const DEFAULT_SUPERADMIN_EMAIL = 'superadmin@example.local';
const DEFAULT_SUPERADMIN_NAME = 'Super Admin';
const DEFAULT_SUPERADMIN_PASSWORD = 'ChangeMe123!';

function getEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();

  return value && value.length > 0 ? value : fallback;
}

function resolveSuperadminEmail() {
  const email = process.env.SUPERADMIN_EMAIL?.trim();

  if (email) {
    return email;
  }

  const username = process.env.SUPERADMIN_USERNAME?.trim();

  if (!username) {
    return DEFAULT_SUPERADMIN_EMAIL;
  }

  return username.includes('@') ? username : `${username}@example.local`;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `scrypt:${salt}:${hash}`;
}

async function main() {
  const branchCode = getEnv('HQ_BRANCH_CODE', DEFAULT_HQ_BRANCH_CODE);
  const branchName = getEnv('HQ_BRANCH_NAME', DEFAULT_HQ_BRANCH_NAME);
  const superadminEmail = resolveSuperadminEmail();
  const superadminName = getEnv(
    'SUPERADMIN_DISPLAY_NAME',
    DEFAULT_SUPERADMIN_NAME,
  );
  const superadminPassword =
    process.env.SUPERADMIN_PASSWORD?.trim() || DEFAULT_SUPERADMIN_PASSWORD;

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

  const existingSuperadmin = await prisma.staff.findUnique({
    where: { email: superadminEmail },
  });

  if (existingSuperadmin) {
    await prisma.staff.update({
      where: { id: existingSuperadmin.id },
      data: {
        branchId: branch.id,
        name: superadminName,
        role: StaffRole.HQ_ADMIN,
        isActive: true,
        ...(process.env.SUPERADMIN_PASSWORD?.trim()
          ? { passwordHash: hashPassword(superadminPassword) }
          : {}),
      },
    });
  } else {
    await prisma.staff.create({
      data: {
        branchId: branch.id,
        name: superadminName,
        email: superadminEmail,
        passwordHash: hashPassword(superadminPassword),
        role: StaffRole.HQ_STAFF,
        isActive: true,
      },
    });
  }

  console.log(`Seeded branch ${branchCode} and superadmin ${superadminEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
