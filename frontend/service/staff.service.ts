"use client";

import { http } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type { CreateStaffInput, Staff } from "@/lib/types";

export const staffService = {
  list: () => http.get<Staff[]>("/staffs"),
  create: (input: CreateStaffInput) => http.post<Staff>("/staffs", input),
};

/** Loads all staff with loading/error/reload state. */
export function useStaffs() {
  return useApi(() => staffService.list());
}
