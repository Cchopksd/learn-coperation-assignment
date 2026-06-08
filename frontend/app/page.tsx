"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/state/auth.store";
import { LoadingState } from "@/components/ui";

// Entry point: send signed-in staff to the main workspace, others to login.
export default function Home() {
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const ready = useAuthStore((s) => s.ready);

  useEffect(() => {
    if (!ready) return;
    router.replace(staff ? "/class-sessions" : "/login");
  }, [ready, staff, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <LoadingState />
    </div>
  );
}
