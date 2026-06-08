"use client";

import { http } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type { Branch, CreateBranchInput } from "@/lib/types";

export const branchService = {
  list: () => http.get<Branch[]>("/branches"),
  create: (input: CreateBranchInput) => http.post<Branch>("/branches", input),
};

/** Loads all branches with loading/error/reload state. */
export function useBranches() {
  return useApi(() => branchService.list());
}
