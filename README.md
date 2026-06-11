# Learn Cooperation Assignment

School back-office application for managing branches, staff, students, class sessions, bookings, attendance, student credits, and compensations.

The repository contains:

- `backend` - NestJS API with Prisma and PostgreSQL
- `frontend` - Next.js admin website
- `docker-compose.yaml` - local containers for frontend, backend, migration/seed, and database

## ERD

```mermaid
erDiagram
  BRANCH ||--o{ STAFF : has
  BRANCH ||--o{ STUDENT : has
  BRANCH ||--o{ CLASS_SESSION : hosts

  PARENT ||--|{ STUDENT : has
  PARENT ||--o{ BOOKING : books_for

  STAFF ||--o{ STAFF : creates
  STAFF ||--o{ CLASS_SESSION : teaches
  STAFF ||--o{ BOOKING : books_for
  STAFF ||--o{ BOOKING : marks
  STAFF ||--o{ STUDENT_CREDIT_LEDGER : creates
  STAFF ||--o{ ATTENDANCE_AUDIT_LOG : acts

  STUDENT ||--o{ BOOKING : is_booked_for
  STUDENT ||--o{ STUDENT_CREDIT_LEDGER : owns
  STUDENT ||--o{ STUDENT_COMPENSATION : owns

  CLASS_SESSION ||--o{ BOOKING : contains
  BOOKING ||--o| STUDENT_CREDIT_LEDGER : produces
  BOOKING ||--o| STUDENT_COMPENSATION : produces
  BOOKING ||--o{ ATTENDANCE_AUDIT_LOG : records

  BRANCH {
    uuid id PK
    string code UK
    string name
    string address
    datetime createdAt
    datetime updatedAt
  }

  STAFF {
    uuid id PK
    uuid branchId FK
    uuid createdById FK
    string name
    string email UK
    string passwordHash
    StaffRole role
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  PARENT {
    uuid id PK
    string name
    string email UK
    string phone
    string passwordHash
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  STUDENT {
    uuid id PK
    uuid branchId FK
    uuid parentId FK
    string name
    string email
    string phone
    int creditBalance
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  CLASS_SESSION {
    uuid id PK
    uuid branchId FK
    uuid teacherId FK
    string title
    string description
    datetime startTime
    datetime endTime
    int capacity
    datetime createdAt
    datetime updatedAt
  }

  BOOKING {
    uuid id PK
    uuid classSessionId FK
    uuid studentId FK
    uuid bookedByStaffId FK
    uuid bookedByParentId FK
    uuid markedById FK
    AttendanceStatus status
    datetime bookedAt
    datetime markedAt
    string note
    datetime createdAt
    datetime updatedAt
  }

  STUDENT_CREDIT_LEDGER {
    uuid id PK
    uuid studentId FK
    uuid bookingId FK
    uuid createdById FK
    int amount
    CreditLedgerReason reason
    int balanceAfter
    string note
    datetime createdAt
  }

  STUDENT_COMPENSATION {
    uuid id PK
    uuid studentId FK
    uuid bookingId FK
    CompensationType type
    CompensationStatus status
    string note
    datetime usedAt
    datetime createdAt
    datetime updatedAt
  }

  ATTENDANCE_AUDIT_LOG {
    uuid id PK
    uuid bookingId FK
    uuid actorId FK
    AttendanceStatus fromStatus
    AttendanceStatus toStatus
    string note
    datetime createdAt
  }
```

Booking rules:

- One parent can have multiple students, and each student belongs to one parent.
- A parent can create a booking only for a student linked to that parent.
- A booking is always for one student and one class session.
- Exactly one of `bookedByStaffId` or `bookedByParentId` must be set to identify who created the booking.

Key enums:

- `StaffRole`: `HQ_STAFF`, `BRANCH_STAFF`, `TEACHER`
- `AttendanceStatus`: `BOOKED`, `ATTEND`, `SKIP`, `ABSENT`
- `CreditLedgerReason`: `INITIAL_CREDIT`, `MANUAL_ADJUSTMENT`, `ATTENDANCE_ATTEND`, `ATTENDANCE_ABSENT`
- `CompensationType`: `MAKEUP_CLASS`, `SEAT_CREDIT`, `EXTEND_EXPIRY`
- `CompensationStatus`: `AVAILABLE`, `USED`, `CANCELLED`

## Architecture Diagram

![Architecture Diagram](docs/architecture-diagram.png)

Runtime flow:

1. Staff users sign in through the Next.js frontend.
2. The frontend calls the NestJS API and stores the JWT token in a cookie.
3. NestJS validates input with global validation pipes and protects private routes with JWT and role guards.
4. Services apply business rules, then read/write data through Prisma.
5. PostgreSQL persists identity, scheduling, attendance, credit ledger, and compensation data.
6. Docker Compose starts the database first, runs migrations and seed data, then starts the API and frontend.

## Stack Justification

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js + React | Next.js was selected because it has a clear concept, an easy-to-understand project structure, and helps keep React website development more organized. |
| Styling | Tailwind CSS | Tailwind CSS was selected because it works well with AI-assisted development, helps build UI quickly, and reduces setup time compared with MUI or larger component libraries. |
| State | Zustand | Lightweight state management for authentication/session data without heavy boilerplate. |
| Forms | React Hook Form + Zod | Gives controlled validation, typed schemas, and good form performance for CRUD screens. |
| Backend | NestJS | NestJS was selected because it is a framework that already includes essential tools, unlike some frameworks that require more manual setup from the beginning. This helps save implementation time, including unit testing, because Jest is already included as a default testing tool. |
| ORM | Prisma | Prisma was selected because it is a popular ORM with an easy setup process, simple migration management when the schema changes, and most importantly, support for transactions when business logic requires multiple operations to succeed together. |
| Database | PostgreSQL | Reliable relational database for structured entities, constraints, transactions, and audit-style records. |
| Auth | JWT | Simple stateless authentication for API requests from the frontend. |
| Containerization | Docker Compose | Makes the app easier to run locally with consistent frontend, backend, migration, seed, and database services. |

## Key Design Decisions

### 1. Use CreditLedger Instead of Mutating `creditBalance` Only

**Decision**

The system keeps `Student.creditBalance` as the current balance for fast reads, but every credit-changing operation is also recorded in the `StudentCreditLedger` table.

**Rationale**

Credit balance is business-critical data. If the system only updated `Student.creditBalance` directly, it would be difficult to answer important operational questions such as why a student's balance changed, who made the change, which booking caused the change, and what the balance was after each operation.

The ledger gives the system an audit trail for initial credits, manual adjustments, attendance deductions, and absent deductions. Keeping `balanceAfter` in each ledger record also makes each credit movement easier to inspect without recalculating the full history every time.

### 2. Skip Does Not Deduct Credit but Creates Compensation

**Decision**

When a booking is marked as `SKIP`, the system does not deduct credit from the student. However, it creates a `StudentCompensation` record to represent the student's preserved entitlement.

**Rationale**

`SKIP` means approved leave. Operationally, the seat is still consumed because the school reserved capacity for that student. However, the student should still receive the full number of sessions they paid for.

Because of that, `SKIP` is not the same as `ABSENT`.

- `ABSENT` means the student did not show up and loses one credit.
- `SKIP` means the student had approved leave and should not lose their entitlement.

The compensation is modeled separately instead of simply adding credit back to the student balance. This avoids over-crediting the student because no credit was deducted in the first place.

### 3. Keep Student Package Management Lightweight in the First Iteration

**Decision**

The first version does not model complex per-student package purchase history. Instead, the system keeps the minimum fields needed for the attendance and credit module, such as `creditBalance`. Package expiry fields, such as `courseExpiresAt`, can be added later if package lifecycle management becomes part of the scope.

**Rationale**

The assignment focuses on attendance tracking and credit deduction correctness, not package sales, invoicing, or subscription management.

A complete package model could include:

- package catalog
- student package purchases
- package start date
- package expiry date
- renewal
- transfer
- partial refunds
- package-specific credit rules

Those are valid future requirements, but implementing them in the first iteration would increase scope and reduce time available for the most important part: correctly handling `BOOKED`, `ATTEND`, `SKIP`, and `ABSENT`.

### 4. Build Only the Screens Required for the Main Operational Flow

**Decision**

The frontend is intentionally focused on the minimum screens needed to demonstrate the core workflow.

Implemented or planned core screens:

- Login
- Staff management
- Student list and student detail
- Branch list
- Class session list and detail
- Booking management
- Attendance marking
- Credit ledger view

Out of scope for the first version:

- Dashboard
- Advanced reporting
- Full audit log UI
- Complex package management UI
- Billing or payment management
- Notification system

**Rationale**

The assignment states that the UI does not need to be pixel-perfect and that clarity and correctness matter more than aesthetics. Therefore, the frontend prioritizes operational correctness over visual completeness.

The most important user flow is:

1. Staff logs in.
2. Staff selects a class session.
3. Staff books a student into the class.
4. Staff marks attendance as `ATTEND`, `SKIP`, or `ABSENT`.
5. Staff verifies the credit result through the student detail or credit ledger.

This flow proves the business logic end to end.

## Main Features

- Staff authentication with JWT
- Branch management
- Staff management with roles
- Student management with credit balances
- Class session scheduling
- Student bookings and attendance marking
- Credit ledger tracking
- Compensation tracking
- Attendance audit history

## Quick Start With Docker

Create `backend/.env`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=school_backoffice
POSTGRES_PORT=5432

JWT_SECRET=change-this-secret

HQ_BRANCH_CODE=HQ
HQ_BRANCH_NAME=Headquarters
HQ_STAFF_USERNAME=hq.staff
HQ_STAFF_DISPLAY_NAME=HQ Staff
HQ_STAFF_PASSWORD=ChangeMe123!
```

Start the full stack:

```bash
docker compose up --build
```

Open the app:

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432

Default seeded login:

```text
Email: hq.staff@example.local
Password: ChangeMe123!
```

If `HQ_STAFF_USERNAME` contains an email address, that value is used directly. Otherwise the seed script converts it to `<username>@example.local`.

## Local Development

### 1. Start PostgreSQL

```bash
docker compose up database
```

### 2. Configure Backend Environment

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/school_backoffice
JWT_SECRET=change-this-secret

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=school_backoffice
POSTGRES_PORT=5432

HQ_BRANCH_CODE=HQ
HQ_BRANCH_NAME=Headquarters
HQ_STAFF_EMAIL=hq.staff@example.local
HQ_STAFF_DISPLAY_NAME=HQ Staff
HQ_STAFF_PASSWORD=ChangeMe123!
```

### 3. Run Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run start:dev
```

The backend runs on http://localhost:8080 by default.

### 4. Run Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:3000.

## Useful Commands

Backend:

```bash
cd backend
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run prisma:studio
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

Docker:

```bash
docker compose up --build
docker compose down
docker compose down -v
```

Use `docker compose down -v` only when you want to remove the local PostgreSQL volume and reset all database data.

- Docker Compose runs migrations and seed data through the `migrate` service.
- The seed script upserts the HQ branch and HQ staff account, so it is safe to run more than once.
- `docker compose down -v` deletes the local database volume.
