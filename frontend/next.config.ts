import type { NextConfig } from "next";

// Proxy `/api/*` to the NestJS backend so the browser stays same-origin
// (no CORS config needed on the backend). Override the target with BACKEND_URL.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
