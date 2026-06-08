"use client";

import { create } from "zustand";

import { envConfig } from "@/config/env.config";
import { clearToken, getToken, setToken } from "@/lib/api-client";
import { authService } from "@/service/auth.service";
import type { AuthStaff } from "@/lib/types";

const STAFF_KEY = envConfig.staffStorageKey;

interface AuthState {
  staff: AuthStaff | null;
  /** false until the store has read persisted auth on mount. */
  ready: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/**
 * Global auth store. Holds the signed-in staff and exposes login/logout.
 * The access token lives in a cookie (read synchronously by the API client);
 * the staff profile is mirrored here and persisted in localStorage alongside it.
 */
export const useAuthStore = create<AuthState>((set) => ({
  staff: null,
  ready: false,

  hydrate: () => {
    const token = getToken();
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STAFF_KEY)
        : null;
    let staff: AuthStaff | null = null;
    if (token && raw) {
      try {
        staff = JSON.parse(raw) as AuthStaff;
      } catch {
        clearToken();
      }
    }
    set({ staff, ready: true });
  },

  login: async (email, password) => {
    const res = await authService.login(email, password);
    setToken(res.accessToken);
    window.localStorage.setItem(STAFF_KEY, JSON.stringify(res.staff));
    set({ staff: res.staff });
  },

  logout: () => {
    clearToken();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STAFF_KEY);
    }
    set({ staff: null });
  },
}));
