import { deleteCookie, getCookie, setCookie } from "cookies-next/client";

import { envConfig } from "@/config/env.config";

const BASE_URL = envConfig.apiBaseUrl;
const TOKEN_KEY = envConfig.tokenStorageKey;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  const value = getCookie(TOKEN_KEY);
  return typeof value === "string" ? value : null;
}

export function setToken(token: string): void {
  setCookie(TOKEN_KEY, token, {
    path: "/",
    maxAge: tokenMaxAge(token),
    sameSite: "strict",
    secure: typeof location !== "undefined" && location.protocol === "https:",
  });
}

export function clearToken(): void {
  deleteCookie(TOKEN_KEY, { path: "/" });
}

/** Seconds until the JWT's `exp`, so the cookie expires with the token. */
function tokenMaxAge(token: string): number {
  const fallback = 60 * 60 * 8;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (typeof json.exp === "number") {
      const secs = json.exp - Math.floor(Date.now() / 1000);
      return secs > 0 ? secs : 0;
    }
  } catch {
    // Malformed token — fall through to the default lifetime.
  }
  return fallback;
}

/** Builds a `?a=b&c=d` query string, dropping undefined/empty values. */
export function buildQuery(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * The single fetch entry point for every domain service. Prefixes the API base,
 * attaches the bearer token, parses the response, and normalises failures into
 * an `ApiError`. Services call this directly: `fetchAPI<T>(path, options)`.
 */
export async function fetchAPI<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(body, res.status), res.status);
  }
  return body as T;
}

function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: string | string[] }).message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  if (typeof body === "string" && body) return body;
  return `Request failed (${status}).`;
}
