"use client";

import { http } from "@/lib/api-client";
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
  list: () => http.get<Student[]>("/students"),
  get: (id: string) => http.get<Student>(`/students/${id}`),
  create: (input: CreateStudentInput) => http.post<Student>("/students", input),
  adjustCredit: (id: string, input: AdjustCreditInput) =>
    http.post<AdjustCreditResponse>(`/students/${id}/credits`, input),
  getLedger: (id: string) =>
    http.get<CreditLedgerEntry[]>(`/students/${id}/ledger`),
  getCompensations: (id: string) =>
    http.get<Compensation[]>(`/students/${id}/compensations`),
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
