-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."CreditLedgerReason" AS ENUM ('INITIAL_CREDIT', 'MANUAL_ADJUSTMENT', 'ATTENDANCE_ATTEND', 'ATTENDANCE_ABSENT');

-- CreateEnum
CREATE TYPE "public"."CompensationType" AS ENUM ('MAKEUP_CLASS', 'SEAT_CREDIT', 'EXTEND_EXPIRY');

-- CreateEnum
CREATE TYPE "public"."CompensationStatus" AS ENUM ('AVAILABLE', 'USED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StaffRole" AS ENUM ('HQ_STAFF', 'BRANCH_STAFF', 'TEACHER');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('BOOKED', 'ATTEND', 'SKIP', 'ABSENT');

-- CreateTable
CREATE TABLE "public"."StudentCreditLedger" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "bookingId" UUID,
    "createdById" UUID,
    "amount" INTEGER NOT NULL,
    "reason" "public"."CreditLedgerReason" NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentCompensation" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "type" "public"."CompensationType" NOT NULL DEFAULT 'MAKEUP_CLASS',
    "status" "public"."CompensationStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCompensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttendanceAuditLog" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "actorId" UUID,
    "fromStatus" "public"."AttendanceStatus" NOT NULL,
    "toStatus" "public"."AttendanceStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branch" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Staff" (
    "id" UUID NOT NULL,
    "branchId" UUID,
    "createdById" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."StaffRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClassSession" (
    "id" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "teacherId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" UUID NOT NULL,
    "classSessionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "bookedById" UUID,
    "markedById" UUID,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'BOOKED',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentCreditLedger_bookingId_key" ON "public"."StudentCreditLedger"("bookingId");

-- CreateIndex
CREATE INDEX "StudentCreditLedger_studentId_idx" ON "public"."StudentCreditLedger"("studentId");

-- CreateIndex
CREATE INDEX "StudentCreditLedger_reason_idx" ON "public"."StudentCreditLedger"("reason");

-- CreateIndex
CREATE INDEX "StudentCreditLedger_createdAt_idx" ON "public"."StudentCreditLedger"("createdAt");

-- CreateIndex
CREATE INDEX "StudentCreditLedger_createdById_idx" ON "public"."StudentCreditLedger"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCompensation_bookingId_key" ON "public"."StudentCompensation"("bookingId");

-- CreateIndex
CREATE INDEX "StudentCompensation_studentId_idx" ON "public"."StudentCompensation"("studentId");

-- CreateIndex
CREATE INDEX "StudentCompensation_status_idx" ON "public"."StudentCompensation"("status");

-- CreateIndex
CREATE INDEX "StudentCompensation_type_idx" ON "public"."StudentCompensation"("type");

-- CreateIndex
CREATE INDEX "AttendanceAuditLog_bookingId_idx" ON "public"."AttendanceAuditLog"("bookingId");

-- CreateIndex
CREATE INDEX "AttendanceAuditLog_actorId_idx" ON "public"."AttendanceAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AttendanceAuditLog_createdAt_idx" ON "public"."AttendanceAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "public"."Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_code_idx" ON "public"."Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "public"."Staff"("email");

-- CreateIndex
CREATE INDEX "Staff_branchId_idx" ON "public"."Staff"("branchId");

-- CreateIndex
CREATE INDEX "Staff_role_idx" ON "public"."Staff"("role");

-- CreateIndex
CREATE INDEX "Staff_isActive_idx" ON "public"."Staff"("isActive");

-- CreateIndex
CREATE INDEX "Student_branchId_idx" ON "public"."Student"("branchId");

-- CreateIndex
CREATE INDEX "Student_isActive_idx" ON "public"."Student"("isActive");

-- CreateIndex
CREATE INDEX "Student_name_idx" ON "public"."Student"("name");

-- CreateIndex
CREATE INDEX "ClassSession_branchId_idx" ON "public"."ClassSession"("branchId");

-- CreateIndex
CREATE INDEX "ClassSession_teacherId_idx" ON "public"."ClassSession"("teacherId");

-- CreateIndex
CREATE INDEX "ClassSession_startTime_idx" ON "public"."ClassSession"("startTime");

-- CreateIndex
CREATE INDEX "Booking_classSessionId_idx" ON "public"."Booking"("classSessionId");

-- CreateIndex
CREATE INDEX "Booking_studentId_idx" ON "public"."Booking"("studentId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "public"."Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_bookedById_idx" ON "public"."Booking"("bookedById");

-- CreateIndex
CREATE INDEX "Booking_markedById_idx" ON "public"."Booking"("markedById");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_classSessionId_studentId_key" ON "public"."Booking"("classSessionId", "studentId");

-- AddForeignKey
ALTER TABLE "public"."StudentCreditLedger" ADD CONSTRAINT "StudentCreditLedger_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCreditLedger" ADD CONSTRAINT "StudentCreditLedger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCreditLedger" ADD CONSTRAINT "StudentCreditLedger_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCompensation" ADD CONSTRAINT "StudentCompensation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCompensation" ADD CONSTRAINT "StudentCompensation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceAuditLog" ADD CONSTRAINT "AttendanceAuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceAuditLog" ADD CONSTRAINT "AttendanceAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassSession" ADD CONSTRAINT "ClassSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassSession" ADD CONSTRAINT "ClassSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_classSessionId_fkey" FOREIGN KEY ("classSessionId") REFERENCES "public"."ClassSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_bookedById_fkey" FOREIGN KEY ("bookedById") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

