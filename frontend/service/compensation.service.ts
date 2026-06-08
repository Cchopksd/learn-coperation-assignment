"use client";

import { buildQuery, http } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type { Compensation, CompensationStatus } from "@/lib/types";

export interface CompensationFilters {
  studentId?: string;
  status?: string;
  type?: string;
}

export const compensationService = {
  list: (filters?: CompensationFilters) =>
    http.get<Compensation[]>(`/compensations${buildQuery({ ...filters })}`),
  updateStatus: (id: string, status: CompensationStatus) =>
    http.patch<Compensation>(`/compensations/${id}/status`, { status }),
};

/** Loads compensations, re-fetching whenever a filter changes. */
export function useCompensations(filters: CompensationFilters = {}) {
  return useApi(() => compensationService.list(filters), [
    filters.studentId,
    filters.status,
    filters.type,
  ]);
}
