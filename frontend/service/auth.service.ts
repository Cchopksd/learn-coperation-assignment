import { fetchAPI } from "@/lib/api-client";
import type { LoginResponse } from "@/lib/types";

export const authService = {
  login: (email: string, password: string) =>
    fetchAPI<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};
