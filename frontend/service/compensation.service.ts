"use client";

import { buildQuery, fetchAPI } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type { Compensation, CompensationStatus } from "@/lib/types";

export interface CompensationFilters {
  studentId?: string;
  status?: string;
  type?: string;
}

export const compensationService = {
  list: (filters?: CompensationFilters) =>
    fetchAPI<Compensation[]>(`/compensations${buildQuery({ ...filters })}`),
  updateStatus: (id: string, status: CompensationStatus) =>
    fetchAPI<Compensation>(`/compensations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

/** Loads compensations, re-fetching whenever a filter changes. */
export function useCompensations(filters: CompensationFilters = {}) {
  return useApi(() => compensationService.list(filters), [
    filters.studentId,
    filters.status,
    filters.type,
  ]);
}
