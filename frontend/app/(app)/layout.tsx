"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/state/auth.store";
import { Sidebar } from "@/components/Sidebar";
import { LoadingState } from "@/components/ui";

// Guards every page in the (app) group: redirects unauthenticated staff to /login.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const ready = useAuthStore((s) => s.ready);

  useEffect(() => {
    if (ready && !staff) router.replace("/login");
  }, [ready, staff, router]);

  if (!ready || !staff) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label="Checking session…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
