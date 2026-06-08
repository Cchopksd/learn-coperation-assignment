"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/state/auth.store";
import { loginSchema, type LoginFormValues } from "@/schema/auth.schema";
import { Button, Card, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const staff = useAuthStore((s) => s.staff);
  const ready = useAuthStore((s) => s.ready);

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Already signed in -> skip the login screen.
  useEffect(() => {
    if (ready && staff) router.replace("/class-sessions");
  }, [ready, staff, router]);

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.replace("/class-sessions");
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Could not sign in. Try again.",
      );
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">
            Learning Center Admin
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage classes and attendance.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="staff@example.com"
              {...register("email")}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
          </Field>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Signing in…" : "Log in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
