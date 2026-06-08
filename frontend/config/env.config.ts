// Centralized environment / runtime config. Do not read process.env elsewhere.
// `apiBaseUrl` points at the Next.js rewrite that proxies to the NestJS backend
// (see next.config.ts), so the browser stays same-origin.

export const envConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  /** Cookie name for the access token. */
  tokenStorageKey: "lc_access_token",
  /** localStorage key for the mirrored staff profile. */
  staffStorageKey: "lc_auth_staff",
} as const;
