import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from "./security-headers";

describe("security headers", () => {
  it("enforces CSP in production with the same-origin API", () => {
    const headers = buildSecurityHeaders({
      apiBaseUrl: "https://startup.f-spark.vn",
      appEnv: "production",
    });
    const csp = headers.find(
      (header) => header.key === "Content-Security-Policy",
    );

    expect(csp?.value).toContain("frame-ancestors 'none'");
    expect(csp?.value).toContain("connect-src 'self' https://startup.f-spark.vn");
    expect(csp?.value).toContain("wss://startup.f-spark.vn");
    expect(csp?.value).toContain("upgrade-insecure-requests");
    expect(headers).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
    expect(headers).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=31536000",
    });
  });

  it("uses report-only CSP on staging and permits only configured API/WS origins", () => {
    const headers = buildSecurityHeaders({
      apiBaseUrl: "https://api-fspark.kusl.io.vn",
      appEnv: "staging",
      websocketUrl: "wss://api-fspark.kusl.io.vn/ws",
    });

    expect(headers[0].key).toBe("Content-Security-Policy-Report-Only");
    expect(headers[0].value).toContain("https://api-fspark.kusl.io.vn");
    expect(headers[0].value).toContain("wss://api-fspark.kusl.io.vn");
    expect(headers[0].value).not.toContain("'unsafe-eval'");
    expect(headers).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=31536000",
    });
  });

  it("ignores invalid external origins", () => {
    const policy = buildContentSecurityPolicy({
      apiBaseUrl: "javascript:alert(1)",
      appEnv: "production",
    });

    expect(policy).not.toContain("javascript:");
  });
});
