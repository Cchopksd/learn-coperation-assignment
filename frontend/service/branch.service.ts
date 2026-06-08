"use client";

import { fetchAPI } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type { Branch, CreateBranchInput } from "@/lib/types";

export const branchService = {
  list: () => fetchAPI<Branch[]>("/branches"),
  create: (input: CreateBranchInput) =>
    fetchAPI<Branch>("/branches", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

/** Loads all branches with loading/error/reload state. */
export function useBranches() {
  return useApi(() => branchService.list());
}
