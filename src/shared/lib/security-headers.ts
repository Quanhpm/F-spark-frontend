type SecurityHeaderOptions = {
  apiBaseUrl?: string;
  appEnv?: string;
  websocketUrl?: string;
};

type SecurityHeader = {
  key: string;
  value: string;
};

function originOf(value?: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function websocketOrigin(apiBaseUrl?: string, websocketUrl?: string) {
  const explicitOrigin = originOf(websocketUrl);
  if (explicitOrigin) return explicitOrigin;

  const apiOrigin = originOf(apiBaseUrl);
  if (!apiOrigin) return null;
  return apiOrigin.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
}

function directive(name: string, sources: Array<string | null>) {
  return `${name} ${[...new Set(sources.filter(Boolean))].join(" ")}`;
}

export function buildContentSecurityPolicy({
  apiBaseUrl,
  appEnv,
  websocketUrl,
}: SecurityHeaderOptions) {
  const apiOrigin = originOf(apiBaseUrl);
  const wsOrigin = websocketOrigin(apiBaseUrl, websocketUrl);
  const isProduction = appEnv === "production";
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    !isProduction && appEnv !== "staging" ? "'unsafe-eval'" : null,
    "https://accounts.google.com",
  ];

  const directives = [
    directive("default-src", ["'self'"]),
    directive("base-uri", ["'self'"]),
    directive("object-src", ["'none'"]),
    directive("frame-ancestors", ["'none'"]),
    directive("form-action", ["'self'"]),
    directive("script-src", scriptSources),
    directive("style-src", [
      "'self'",
      "'unsafe-inline'",
      "https://accounts.google.com",
      "https://fonts.googleapis.com",
    ]),
    directive("font-src", ["'self'", "data:", "https://fonts.gstatic.com"]),
    directive("img-src", [
      "'self'",
      "data:",
      "blob:",
      "https://accounts.google.com",
      "https://*.googleusercontent.com",
    ]),
    directive("connect-src", [
      "'self'",
      apiOrigin,
      wsOrigin,
      "https://accounts.google.com",
      "https://oauth2.googleapis.com",
    ]),
    directive("frame-src", ["https://accounts.google.com"]),
    directive("worker-src", ["'self'", "blob:"]),
    directive("media-src", ["'self'", "blob:"]),
    directive("manifest-src", ["'self'"]),
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function buildSecurityHeaders(
  options: SecurityHeaderOptions,
): SecurityHeader[] {
  const cspHeader =
    options.appEnv === "production"
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";

  const headers: SecurityHeader[] = [
    {
      key: cspHeader,
      value: buildContentSecurityPolicy(options),
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin-allow-popups",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
  ];

  if (options.appEnv === "production" || options.appEnv === "staging") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000",
    });
  }

  return headers;
}
