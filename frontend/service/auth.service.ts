import { http } from "@/lib/api-client";
import type { LoginResponse } from "@/lib/types";

export const authService = {
  login: (email: string, password: string) =>
    http.post<LoginResponse>("/auth/login", { email, password }),
};
