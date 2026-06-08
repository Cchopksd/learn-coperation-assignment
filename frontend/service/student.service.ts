"use client";

import { fetchAPI } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type {
  AdjustCreditInput,
  AdjustCreditResponse,
  Compensation,
  CreateStudentInput,
  CreditLedgerEntry,
  Student,
} from "@/lib/types";

export const studentService = {
  list: () => fetchAPI<Student[]>("/students"),
  get: (id: string) => fetchAPI<Student>(`/students/${id}`),
  create: (input: CreateStudentInput) =>
    fetchAPI<Student>("/students", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  adjustCredit: (id: string, input: AdjustCreditInput) =>
    fetchAPI<AdjustCreditResponse>(`/students/${id}/credits`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getLedger: (id: string) =>
    fetchAPI<CreditLedgerEntry[]>(`/students/${id}/ledger`),
  getCompensations: (id: string) =>
    fetchAPI<Compensation[]>(`/students/${id}/compensations`),
};

/** Loads all students with loading/error/reload state. */
export function useStudents() {
  return useApi(() => studentService.list());
}

/** Loads a single student by id. */
export function useStudent(id: string) {
  return useApi(() => studentService.get(id), [id]);
}

/** Loads a student's credit ledger by id. */
export function useStudentLedger(id: string) {
  return useApi(() => studentService.getLedger(id), [id]);
}

/** Loads a student's compensations by id. */
export function useStudentCompensations(id: string) {
  return useApi(() => studentService.getCompensations(id), [id]);
}
