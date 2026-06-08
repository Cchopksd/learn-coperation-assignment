"use client";

import { buildQuery, fetchAPI } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type { CreditLedgerEntry } from "@/lib/types";

export interface CreditLedgerFilters {
  studentId?: string;
  reason?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const creditLedgerService = {
  list: (filters?: CreditLedgerFilters) =>
    fetchAPI<CreditLedgerEntry[]>(
      `/credit-ledgers${buildQuery({ ...filters })}`,
    ),
};

/** Loads credit ledger entries, re-fetching whenever a filter changes. */
export function useCreditLedgers(filters: CreditLedgerFilters) {
  return useApi(() => creditLedgerService.list(filters), [
    filters.studentId,
    filters.reason,
    filters.dateFrom,
    filters.dateTo,
  ]);
}
