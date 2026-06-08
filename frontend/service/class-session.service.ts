"use client";

import { http } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type {
  ClassSession,
  ClassSessionDetail,
  CreateClassSessionInput,
} from "@/lib/types";

export const classSessionService = {
  list: () => http.get<ClassSession[]>("/class-sessions"),
  get: (id: string) => http.get<ClassSessionDetail>(`/class-sessions/${id}`),
  create: (input: CreateClassSessionInput) =>
    http.post<ClassSession>("/class-sessions", input),
};

/** Loads all class sessions with loading/error/reload state. */
export function useClassSessions() {
  return useApi(() => classSessionService.list());
}

/** Loads a single class session (with bookings) by id. */
export function useClassSession(id: string) {
  return useApi(() => classSessionService.get(id), [id]);
}
