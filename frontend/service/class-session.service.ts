"use client";

import { fetchAPI } from "@/lib/api-client";
import { useApi } from "@/hooks/use-api";
import type {
  ClassSession,
  ClassSessionDetail,
  CreateClassSessionInput,
} from "@/lib/types";

export const classSessionService = {
  list: () => fetchAPI<ClassSession[]>("/class-sessions"),
  get: (id: string) => fetchAPI<ClassSessionDetail>(`/class-sessions/${id}`),
  create: (input: CreateClassSessionInput) =>
    fetchAPI<ClassSession>("/class-sessions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

/** Loads all class sessions with loading/error/reload state. */
export function useClassSessions() {
  return useApi(() => classSessionService.list());
}

/** Loads a single class session (with bookings) by id. */
export function useClassSession(id: string) {
  return useApi(() => classSessionService.get(id), [id]);
}
