"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/state/auth.store";

/**
 * Reads persisted auth from localStorage once on mount so the rest of the app
 * can rely on the store's `ready` flag. Renders children unchanged.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
