# Agent.md

Guidelines for AI coding agents working on this Next.js + NestJS project.

## Project Overview

This project is a full-stack TypeScript application.

- **Frontend:** Next.js, React, TypeScript
- **Frontend styling:** Tailwind CSS
- **Frontend validation:** Zod
- **Frontend forms:** React Hook Form
- **Frontend state:** Zustand
- **Backend:** NestJS, TypeScript
- **Backend database ORM:** Prisma
- **Architecture:** Keep frontend and backend clearly separated
- **Package manager:** Use the existing lockfile; do not switch package managers

Before making changes, inspect the actual repository structure and follow existing conventions. When conventions are missing, use the rules in this document.

## Core Rules

1. Do not introduce unnecessary dependencies.
2. Keep frontend, backend, and shared code boundaries clean.
3. Prefer TypeScript types over `any`.
4. Preserve existing formatting, naming, and architecture patterns.
5. Make small, focused changes instead of broad rewrites.
6. Do not modify generated files unless explicitly required.
7. Do not commit secrets, credentials, tokens, private keys, or real `.env` values.
8. Update tests, schemas, DTOs, Prisma schema, and documentation when behavior changes.
9. Prefer explicit error handling over silent failures.
10. Ensure code builds, lints, and tests pass when commands are available.

For a simple separated repository, prefer this shape:

```txt
.
├── frontend/      # Next.js frontend
├── backend/       # NestJS backend
└── Agent.md
```

Do not mix frontend and backend source files in the same feature folder unless the repository already uses a shared package pattern.

## Package Manager and Commands

Use the package manager implied by the lockfile.

```bash
ls pnpm-lock.yaml yarn.lock package-lock.json
```

Use:

- `pnpm` when `pnpm-lock.yaml` exists
- `yarn` when `yarn.lock` exists
- `npm` when `package-lock.json` exists

Typical commands:

```bash
npm install
npm dev
npm build
npm lint
npm test
npm typecheck
```

If scripts differ, use the repository-defined scripts in `package.json`.

---

# Frontend Guidelines: Next.js

## Required Frontend Tools

The frontend must use:

1. **Tailwind CSS** for styling
2. **Zod** for schema validation
3. **React Hook Form** for forms
4. **Zustand** for client-side global state
5. Separate folders for components, schemas, state, hooks, config, libs, and utils

Do not introduce competing tools unless explicitly requested. For example:

- Do not add Formik when React Hook Form is already required.
- Do not add Yup when Zod is already required.
- Do not add Redux, MobX, Jotai, or Recoil when Zustand is already required.
- Do not add a CSS-in-JS library when Tailwind CSS is already required.

## Frontend Folder Structure

Prefer this structure inside the frontend source directory:

```txt
src/
├── app/                  # Next.js App Router routes, layouts, pages
├── component/            # Reusable UI and feature components
├── schema/               # Zod schemas and inferred TypeScript types
├── state/                # Zustand stores
├── hooks/                # Reusable React hooks
├── config/               # App config, env config, route config, constants config
├── libs/                 # Library setup and external integrations
└── utils/                # Pure utility functions
```

If the project already uses plural names such as `components/`, `schemas/`, or `lib/`, follow the existing naming convention consistently. Do not create both singular and plural versions of the same folder.

## Frontend Folder Responsibilities

### `component/`

Use this folder for reusable React components.

Examples:

```txt
component/
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   └── modal.tsx
├── layout/
│   ├── header.tsx
│   └── sidebar.tsx
└── feature/
    └── user-card.tsx
```

Rules:

- Components must be small and composable.
- Use PascalCase for component names.
- Keep route-only components close to their route when they are not reused.
- Move components into `component/` only when they are reusable or shared by multiple files.

### `schema/`

Use this folder for Zod schemas.

Examples:

```txt
schema/
├── auth.schema.ts
├── user.schema.ts
└── product.schema.ts
```

Rules:

- Export both the schema and inferred TypeScript type.
- Reuse schemas across forms and API client validation when possible.
- Keep schema names explicit, such as `createUserSchema`, `updateProfileSchema`, or `loginSchema`.

### `state/`

Use this folder for Zustand stores.

Examples:

```txt
state/
├── auth.store.ts
├── user.store.ts
└── sidebar.store.ts
```

Rules:

- Use Zustand only for state that must be shared across unrelated components.
- Do not put server cache state into Zustand if a data-fetching/cache library already handles it.
- Keep stores focused. Avoid one giant global store.
- Store names should follow `useXStore`.

### `hooks/`

Use this folder for reusable React hooks.

Examples:

```txt
hooks/
├── use-debounce.ts
├── use-media-query.ts
└── use-current-user.ts
```

Rules:

- Hook names must start with `use`.
- Hooks should encapsulate reusable behavior, not hide unrelated business logic.
- Keep route-specific hooks close to the route if they are not reused.

### `config/`

Use this folder for configuration and constants that describe app behavior.

Examples:

```txt
config/
├── env.config.ts
├── route.config.ts
├── api.config.ts
└── navigation.config.ts
```

Rules:

- Keep environment variable access centralized.
- Do not scatter `process.env` usage across components.
- Never expose private backend secrets through `NEXT_PUBLIC_` variables.

### `libs/`

Use this folder for library setup, clients, and third-party integrations.

Examples:

```txt
libs/
├── api-client.ts
├── zod-resolver.ts
└── cn.ts
```

Rules:

- Centralize API client setup.
- Centralize third-party library configuration.
- Do not duplicate clients or configuration across features.

### `utils/`

Use this folder for pure utility functions.

Examples:

```txt
utils/
├── format-date.ts
├── format-currency.ts
└── parse-error.ts
```

Rules:

- Utilities should be framework-agnostic whenever possible.
- Utilities should not contain React state, side effects, or API calls unless clearly named and intentional.
- Prefer small named functions over large utility classes.

## Next.js Component Rules

- Use Server Components by default when using the App Router.
- Use Client Components only when state, effects, browser APIs, event handlers, React Hook Form, or Zustand are required.
- Add `'use client'` only to the smallest necessary component boundary.
- Do not convert an entire page to a Client Component when only a child form or button needs client behavior.

Example:

```tsx
// app/login/page.tsx
import { LoginForm } from "@/component/auth/login-form";

export default function LoginPage() {
  return <LoginForm />;
}
```

```tsx
// component/auth/login-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@/schema/auth.schema";

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    // Submit through the project API client.
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4">
      <input
        {...form.register("email")}
        className="w-full rounded-md border px-3 py-2"
        placeholder="Email"
      />
      {form.formState.errors.email && (
        <p className="text-sm text-red-500">
          {form.formState.errors.email.message}
        </p>
      )}

      <input
        {...form.register("password")}
        className="w-full rounded-md border px-3 py-2"
        placeholder="Password"
        type="password"
      />
      {form.formState.errors.password && (
        <p className="text-sm text-red-500">
          {form.formState.errors.password.message}
        </p>
      )}

      <button
        className="rounded-md bg-black px-4 py-2 text-white"
        type="submit">
        Login
      </button>
    </form>
  );
}
```

## Tailwind CSS Rules

- Use Tailwind utility classes for styling.
- Prefer consistent spacing, typography, and layout tokens already used in the project.
- Extract repeated class combinations into reusable components or helper utilities.
- Do not create large custom CSS files when Tailwind utilities are sufficient.
- Use semantic HTML and accessible states with Tailwind classes.

When a `cn` helper exists, use it for conditional classes:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Forms with React Hook Form and Zod

Use React Hook Form with Zod for frontend forms.

Rules:

- Keep validation rules in `schema/`, not inline inside components.
- Use `zodResolver` for form validation.
- Type form values with `z.infer<typeof schema>`.
- Show validation errors near the related field.
- Disable submit buttons during submission when appropriate.
- Handle API error responses clearly.

## Frontend API Client Rules

- Put API client setup in `libs/`.
- Do not call `fetch`, `axios`, or other HTTP clients in many unrelated places without a wrapper.
- Use typed request and response shapes.
- Keep API base URL in `config/`.
- Do not expose backend-only secrets to the frontend.

Example:

```ts
// libs/api-client.ts
import { envConfig } from "@/config/env.config";

export async function apiClient<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${envConfig.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json() as Promise<TResponse>;
}
```

---

# Backend Guidelines: NestJS

## Required Backend Tools

The backend must use:

1. **NestJS modules** for feature organization
2. **Prisma** for database access
3. Module folders under a clear module path
4. Submodule folders inside the parent module path

Do not introduce another ORM such as TypeORM, MikroORM, Sequelize, or Drizzle unless explicitly requested.

## Backend Folder Structure

Prefer this structure inside the backend source directory:

```txt
src/
├── main.ts
├── app.module.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
└── modules/
    ├── auth/
    │   ├── dto/
    │   ├── guards/
    │   ├── strategies/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.module.ts
    └── users/
        ├── dto/
        ├── users.controller.ts
        ├── users.service.ts
        └── users.module.ts
```

## Module and Submodule Path Rule

All backend feature modules must live under:

```txt
src/modules/<module-name>/
```

All backend submodules must live under their parent module path:

```txt
src/modules/<module-name>/<submodule-name>/
```

Examples:

```txt
src/modules/users/users.module.ts
src/modules/users/profile/profile.module.ts
src/modules/users/settings/settings.module.ts
src/modules/orders/orders.module.ts
src/modules/orders/items/items.module.ts
src/modules/orders/payments/payments.module.ts
```

Do not place feature modules directly under `src/`. Avoid this:

```txt
src/users/users.module.ts        # Wrong
src/profile/profile.module.ts    # Wrong if profile belongs to users
src/order-items/order-items.ts    # Wrong if order items is an orders submodule
```

Use module/submodule paths to make ownership explicit.

## NestJS Module Rules

A normal module should contain:

```txt
modules/<module-name>/
├── dto/
├── <module-name>.controller.ts
├── <module-name>.service.ts
├── <module-name>.module.ts
└── <module-name>.repository.ts      # only if repository pattern is used
```

Rules:

- Keep controllers thin.
- Put business logic in services.
- Use DTOs for request bodies, route params, and query params.
- Use guards, pipes, filters, and interceptors where appropriate.
- Avoid circular dependencies between modules.
- Export only what other modules need.

## Controllers

Controllers should handle HTTP concerns only.

Responsibilities:

- Route definitions
- Request parameter extraction
- Request body DTO usage
- Response status codes
- Calling services

Example:

```ts
import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

## Services

Services should contain business rules and orchestration.

Rules:

- Keep services testable and dependency-injected.
- Do not put request/response-specific logic in pure service methods.
- Keep method names explicit, such as `createUser`, `findUserById`, `updateOrderStatus`.
- Use Prisma through `PrismaService`, not by creating new Prisma clients in each service.

Example:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}
```

## Prisma Rules

Use Prisma as the only database access layer.

Expected Prisma structure:

```txt
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts               # if used
└── src/
    └── prisma/
        ├── prisma.module.ts
        └── prisma.service.ts
```

Prisma service example:

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Rules:

- Inject `PrismaService` into services that need database access.
- Do not instantiate `new PrismaClient()` inside feature services.
- Keep database queries in services or repositories, depending on the existing project pattern.
- Use Prisma migrations for schema changes.
- Do not edit old migrations unless the project explicitly requires it.
- Run Prisma generate after schema changes when possible.
- Use transactions for multi-step writes that must succeed or fail together.
- Avoid N+1 query patterns.
- Add indexes in `schema.prisma` when query patterns require them.

Common commands:

```bash
npm prisma generate
npm prisma migrate dev
npm prisma migrate deploy
npm prisma studio
```

Use the package-manager equivalent if the project does not use pnpm.

## DTOs and Validation

Use DTOs for all request bodies, query params, and route params.

Example:

```ts
import { IsEmail, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
```

Rules:

- Keep DTOs explicit.
- Do not expose internal entity fields accidentally.
- Validate incoming data at the boundary.
- Use `class-validator` and `class-transformer` if the project already uses them.
- If the project uses Zod on the backend too, keep Zod schemas in a clearly named schema folder and avoid duplicating incompatible validation logic.

## Error Handling

- Use NestJS HTTP exceptions for expected request errors.
- Do not leak internal errors to clients.
- Log unexpected errors using the project's logger.
- Preserve global exception filters if already configured.

Example:

```ts
import { ConflictException } from "@nestjs/common";

if (existingUser) {
  throw new ConflictException("Email is already in use");
}
```

## Authentication and Authorization

- Follow the existing auth strategy.
- Do not bypass guards.
- Keep authorization checks close to the protected operation.
- Never trust client-provided user IDs when authenticated context is available.
- Use decorators for authenticated user context if the project already has them.

---

# Shared Code Guidelines

Shared code may include:

- Types
- API contracts
- Zod schemas
- Constants
- Pure utility functions

Rules:

- Shared code must not depend on Next.js or NestJS runtime APIs.
- Shared packages should be framework-agnostic.
- Avoid importing backend-only code into the frontend.
- Avoid importing frontend-only code into the backend.
- Prefer shared Zod schemas only when both frontend and backend can safely depend on the same package.

---

# Environment Variables

- Never hardcode secrets.
- Use `.env.example` to document required variables.
- Validate environment variables at startup when validation already exists.
- Keep frontend-exposed variables prefixed correctly, such as `NEXT_PUBLIC_` for Next.js public variables.
- Do not expose `DATABASE_URL`, JWT private secrets, provider secrets, or server-only tokens to the frontend.

Example `.env.example` entries:

```env
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_API_URL=
```

Do not add real values.

---

# API Contract Guidelines

When changing an API endpoint:

1. Update the NestJS controller, service, DTO, and Prisma query logic.
2. Update frontend API client types.
3. Update Zod schemas if forms or client-side validation are affected.
4. Update shared schemas or contracts if present.
5. Update tests.
6. Confirm error cases are handled.
7. Confirm loading, empty, success, and error states on the frontend.

Prefer consistent response shapes already used by the project.

---

# Testing Guidelines

Use the existing test framework.

Possible tools:

- Jest
- Vitest
- React Testing Library
- Playwright
- Cypress
- Supertest

## Backend Tests

Prefer focused tests for:

- Business rules
- Validation
- Authorization
- Error cases
- Prisma database interactions when repositories or services are involved

## Frontend Tests

Test behavior, not implementation details.

Prefer tests for:

- User interactions
- Conditional rendering
- React Hook Form validation
- API success/error states
- Zustand state behavior when important

---

# Linting and Formatting

- Use the existing ESLint and Prettier configuration.
- Do not reformat unrelated files.
- Do not mix style-only changes with feature changes unless requested.
- Do not suppress lint rules without a clear reason.

---

# Git and Change Hygiene

Before editing, inspect the working tree:

```bash
git status --short
```

Rules:

- Do not overwrite user changes.
- Keep diffs minimal.
- Separate refactors from behavior changes when possible.
- Mention any files that could not be tested.

---

# Security Checklist

Before finalizing changes, verify:

- No secrets are committed.
- User input is validated.
- Authorization checks are preserved.
- Sensitive fields are not returned to the frontend.
- Prisma queries are scoped correctly.
- File uploads, redirects, and external URLs are handled safely.
- Error responses do not expose stack traces or internal details.

---

# Performance Guidelines

## Next.js

- Avoid unnecessary Client Components.
- Avoid unnecessary re-renders.
- Use dynamic imports for heavy client-only components when appropriate.
- Optimize images with the project's existing image strategy.
- Avoid fetching the same data multiple times.

## NestJS and Prisma

- Avoid N+1 queries.
- Use pagination for list endpoints.
- Select only required fields when returning data.
- Use indexes for frequent filters, joins, and ordering.
- Use transactions for related writes.
- Avoid blocking CPU-heavy work inside request handlers.

---

# Accessibility Guidelines

For frontend UI changes:

- Use semantic HTML.
- Ensure buttons and links are correctly represented.
- Add labels to form fields.
- Preserve keyboard navigation.
- Use accessible dialogs, dropdowns, and menus.
- Do not rely on color alone to communicate state.

---

# Documentation Guidelines

Update documentation when changing:

- Setup steps
- Environment variables
- API behavior
- Database schema
- Prisma migrations
- Deployment process
- Major architectural decisions

Use concise, practical documentation.

---

# Final Response Checklist for Coding Agents

When reporting completed work, include:

```txt
Changed:
- What changed
- Files modified

Validation:
- Commands run
- Test/build/lint result

Notes:
- Known limitations
- Follow-up work, if any
```

Example:

```txt
Changed:
- Added user creation endpoint under src/modules/users
- Added profile submodule under src/modules/users/profile
- Added frontend signup form using React Hook Form and Zod
- Added Zustand auth store

Validation:
- pnpm lint: passed
- pnpm test: passed

Notes:
- Did not run e2e tests because the local database is unavailable
```

---

# Do Not Do

- Do not add unrelated refactors.
- Do not rename files or folders unnecessarily.
- Do not change public APIs without updating all consumers.
- Do not ignore TypeScript errors.
- Do not suppress lint rules without a clear reason.
- Do not add comments that simply repeat the code.
- Do not create duplicate utilities or API clients.
- Do not introduce another global state library when Zustand is required.
- Do not introduce another form library when React Hook Form is required.
- Do not introduce another schema validator when Zod is required for frontend validation.
- Do not introduce another ORM when Prisma is required.
- Do not use `any` to bypass typing problems.
- Do not commit real `.env` files.

---

# Preferred Implementation Style

- Clear names over clever abstractions.
- Simple composition over deep inheritance.
- Explicit types over implicit behavior.
- Small modules over large files.
- Project conventions over personal preference.
