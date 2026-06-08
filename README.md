The project is split into:

- `backend` - NestJS API with Prisma and PostgreSQL
- `frontend` - Next.js admin UI
- `docker-compose.yaml` - full local stack with frontend, backend, database, migration, and seed services

## Tech Stack

- Backend: NestJS 11, Prisma 7, PostgreSQL, JWT authentication
- Frontend: Next.js 16, React 19, Tailwind CSS 4, Zustand, React Hook Form, Zod
- Runtime: Node.js 22
- Database: PostgreSQL 18 Alpine in Docker

## Main Features

- Staff authentication with JWT
- Branch management
- Staff management with roles: `HQ_STAFF`, `BRANCH_STAFF`, `TEACHER`
- Student management with credit balances
- Class session scheduling
- Student bookings and attendance marking
- Credit ledger tracking
- Compensation tracking for missed or adjusted attendance

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
HQ_STAFF_USERNAME=hq.staff
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


```bash
BACKEND_URL=http://localhost:8080 npm run dev
```

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

## API Overview

The NestJS API exposes modules for:

- `auth`
- `branches`
- `staffs`
- `students`
- `class-sessions`
- `bookings`
- `credit-ledgers`
- `compensations`

Authentication starts with:

```http
POST /auth/login
GET /auth/me
```

## Project Structure

```text
.
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   |-- schema/
|   |   `-- seed.ts
|   `-- src/
|       |-- common/
|       |-- modules/
|       `-- prisma/
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- config/
|   |-- hooks/
|   |-- lib/
|   |-- schema/
|   |-- service/
|   `-- state/
`-- docker-compose.yaml
```