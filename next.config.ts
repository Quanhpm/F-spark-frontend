import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/shared/lib/security-headers";

const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
const apiUpstreamUrl = (
  process.env.API_UPSTREAM_URL ??
  (appEnv === "staging" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined)
)?.replace(/\/$/, "");
const browserApiBaseUrl =
  appEnv === "staging" || appEnv === "production"
    ? undefined
    : process.env.NEXT_PUBLIC_API_BASE_URL;
if (
  process.env.NODE_ENV === "production" &&
  appEnv !== "staging" &&
  appEnv !== "production"
) {
  throw new Error(
    "NEXT_PUBLIC_APP_ENV must be explicitly set to staging or production for a production build",
  );
}

const securityHeaders = buildSecurityHeaders({
  apiBaseUrl: browserApiBaseUrl,
  appEnv,
  websocketUrl: process.env.NEXT_PUBLIC_WS_URL,
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    if (!apiUpstreamUrl) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiUpstreamUrl}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
