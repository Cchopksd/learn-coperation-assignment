"use client";

import { fetchAPI } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type { CreateStaffInput, Staff } from "@/lib/types";

export const staffService = {
  list: () => fetchAPI<Staff[]>("/staffs"),
  create: (input: CreateStaffInput) =>
    fetchAPI<Staff>("/staffs", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

/** Loads all staff with loading/error/reload state. */
export function useStaffs() {
  return useApi(() => staffService.list());
}
